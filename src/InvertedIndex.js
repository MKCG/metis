class InvertedIndex
{
    constructor(cacheSize) {
        this.tokens = Object.create(null);
        this.trackedIds = new Set();
        this.lastQueries = [];
        this.radixTree = new RadixTree(3, 1);
        this.cacheSize = cacheSize;
        this.ngrams = [];
    }

    register(id, value) {
        if (typeof value !== 'string') {
            return;
        }

        let tokens = this.tokenize(value);

        for (let token of tokens) {
            if (this.tokens[token] === undefined) {
                this.tokens[token] = new Set();
            }

            this.tokens[token].add(id);
            this.radixTree.add(token);

            let ngramSize = 2;

            for (let i = 0; i <= token.length - ngramSize; i++) {
                let ngram = token.slice(i, i + ngramSize);

                if (this.ngrams[ngram] === undefined) {
                    this.ngrams[ngram] = new Set();
                }

                this.ngrams[ngram].add(token);
            }
        }

        this.trackedIds.add(id);
        this.lastQueries = [];
    }

    remove(id) {
        let tokens = Object.keys(this.tokens);

        for (let i = 0; i < tokens.length; i++) {
            this.tokens[tokens[i]].delete(id);

            if (this.tokens[tokens[i]].size === 0) {
                delete this.tokens[tokens[i]];
            }
        }

        this.trackedIds.remove(id);
        this.lastQueries = [];
    }

    suggest(value, nb) {
        let tokens = value.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z 0-9]+/g," ")
            .split(' ')
            .filter((v) => v !== '')
            .map((value) => value.toLowerCase());

        if (tokens.length === 0) {
            return [];
        }

        let lastToken = tokens.pop(),
            phrase = value.split(' ').filter((v) => v !== ''),
            lastWord = phrase.pop();

        phrase = phrase.join(' ');

        let suggestions = this.radixTree.match(lastToken, nb).map(function(suggestion) {
            return phrase !== ''
                ? phrase + ' ' + suggestion
                : suggestion;
        }.bind(phrase));

        return suggestions;
    }

    search(value) {
        if (this.trackedIds.size === 0) {
            return [];
        }

        let cachedResult = this.searchQueryResult('search', value);

        if (Array.isArray(cachedResult)) {
            return cachedResult;
        }

        let tokens = this.tokenize(value),
            ids = [];

        if (tokens.length === 0) {
            ids = [...this.trackedIds];
        } else {
            ids = this.listMatchingAndIds(tokens);
        }

        this.saveQueryResult('search', value, ids);

        return ids;
    }

    fuzzy(value) {
        let tokens = this.tokenize(value),
            fuzzyIds;

        for (let token of tokens) {
            let ngrams = new Set();

            for (let i = 0; i <= token.length - 2; i++) {
                ngrams.add(token.slice(i, i + 2));
            }

            let fuzzy = [...ngrams].map(function(ngram) {
                    return this[ngram] || new Set();
                }.bind(this.ngrams))
                .reduce((a,v) => a.union(v), new Set());

            fuzzy = [...fuzzy].filter(function(token) {
                    if (this.length < 4) {              // no typo err for short tokens
                        return this === token;
                    }

                    return this.length < 8
                        ? this.levenshtein(token) < 2   // one typo err for medium size tokens
                        : this.levenshtein(token) < 3;  // two typo err for large size tokens
                }.bind(token));

            let ids = fuzzy.reduce(function(acc, token) {
                    return acc.union(this[token]);
                }.bind(this.tokens), new Set());

            if (fuzzyIds === undefined) {
                fuzzyIds = ids;
            } else {
                fuzzyIds = fuzzyIds.intersect(ids);
            }

            if (fuzzyIds.size === 0) {
                break;
            }
        }

        return fuzzyIds;
    }

    searchByPrefix(value) {
        if (value === '' || value.slice(value.length -1) === ' ') {
            return this.search(value);
        }

        let cachedResult = this.searchQueryResult('searchByPrefix', value);

        if (Array.isArray(cachedResult)) {
            return cachedResult;
        }

        let ids = [];
        let tokens = value.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z 0-9]+/g," ")
            .split(' ')
            .filter((v) => v !== '')
            .map((value) => value.toLowerCase());

        if (tokens.length === 0) {
            return this.search('');
        }

        let lastToken = tokens.pop();

        tokens = tokens.filter(function(value, index, array) {
            return array.indexOf(value) === index;
        });

        if (tokens.length > 0) {
            ids = this.listMatchingAndIds(tokens);

            if (tokens.length > 0 && ids.length === 0) {
                this.saveQueryResult('searchByPrefix', value, []);
                return [];
            }
        }

        let prefixedTokens = this.radixTree.match(lastToken);

        if (prefixedTokens.length === 0) {
            this.saveQueryResult('searchByPrefix', value, []);
            return [];
        }

        let idsPrefixingLastToken = this.listMatchingOrIds(prefixedTokens);

        if (tokens.length > 0) {
            ids = ids.filter(function(id) {
                return this.indexOf(id) > -1;
            }, idsPrefixingLastToken);
        } else {
            ids = idsPrefixingLastToken;
        }

        this.saveQueryResult('searchByPrefix', value, ids);

        return ids;
    }

    listMatchingAndIds(tokens) {
        let matched = new Set();

        // Sort to speedup the matching process when some elements size is greatly smallest than any other
        tokens.sort(function(first, second) {
            return this[first] !== undefined
                && this[second] !== undefined
                && this[first].size > this[second].size
                ? 1
                : -1;
        }.bind(this.tokens));

        for (let token of tokens) {
            if (this.tokens[token] === undefined) {
                return [];
            }

            matched = matched.size === 0
                ? this.tokens[token].clone()
                : matched.intersect(this.tokens[token]);

            if (matched.size === 0) {
                break;
            }
        }

        return [...matched];
    }

    listMatchingOrIds(tokens) {
        let matched = new Set();

        for (let token of tokens) {
            if (this.tokens[token] === undefined) {
                return [];
            }

            matched = matched.size === 0
                ? this.tokens[token].clone()
                : matched.union(this.tokens[token]);

            if (matched.size === this.trackedIds.size) {
                break;
            }
        }

        return [...matched];
    }

    tokenize(value) {
        return value.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z 0-9]+/g," ")
            .split(' ')
            .filter(function(value, index, array) {
                return value !== '' && array.indexOf(value) === index;
            })
            .map((value) => value.toLowerCase());
    }

    searchQueryResult(type, query) {
        for (let i = this.lastQueries.length - 1; i >= 0; i--) {
            if (this.lastQueries[i].type === type && this.lastQueries[i].query === query) {
                return this.lastQueries[i].result;
            }
        }
    }

    saveQueryResult(type, query, result) {
        this.lastQueries.push({
            'type': type,
            'query': query,
            'result': result
        });

        if (this.lastQueries.length > this.cacheSize) {
            this.lastQueries.shift();
        }
    }
}
