class RadixTree
{
    constructor(size, step, prefix) {
        this.size = size;
        this.step = step;
        this.tokens = new Set();
        this.inner = [];

        if (prefix === null) {
            this.prefix = '';
        } else {
            this.prefix = prefix;
        }
    }

    add(value) {
        if (this.size === 0 || value.length <= this.step) {
            this.tokens.add(value);
        } else {
            let prefix = value.slice(0, this.step),
                suffix = value.slice(this.step);

            if (this.inner[prefix] === undefined) {
                this.inner[prefix] = new RadixTree(this.size - 1, this.step, prefix);
            }

            this.inner[prefix].add(suffix);
        }
    }

    remove(value) {
        if (this.size === 0 || value.length <= this.step) {
            this.tokens.delete(value);
        } else {
            let prefix = value.slice(0, this.step),
                suffix = value.slice(this.step);

            if (this.inner[prefix] !== undefined) {
                this.inner[prefix].remove(suffix);
            }
        }
    }

    match(value, nb) {
        let matches = new Set();

        if (value.length <= this.step || this.size === 0) {
            for (let token of this.tokens) {
                if (token.length >= value.length && token.indexOf(value) === 0) {
                    matches.add(token);
                }
            }
        }

        if (nb !== undefined && matches.size >= nb) {
            return [...matches].slice(0, nb);
        }

        if (this.size > 0) {
            let prefix = value.slice(0, this.step);
            let roots = Object.keys(this.inner).filter(function(root) {
                return root.indexOf(this) === 0;
            }, prefix);

            if (value.length <= this.step) {
                let innerMatches = roots.map(function(rootName) {
                    return new Set(this.inner[rootName].listAll());
                }, this)
                .reduce(function(acc, value) {
                    return acc.union(value);
                }, new Set());

                matches = matches.union(innerMatches);
            } else if (this.inner[prefix] !== undefined) {
                let suffix = value.slice(this.step);
                let innerMatches = this.inner[prefix].match(suffix).map(function(value) {
                    return this + value;
                }.bind(prefix));

                matches = matches.union(innerMatches);
            }
        }

        if (nb !== undefined && matches.size >= nb) {
            return [...matches].slice(0, nb);
        }

        return [...matches];
    }

    listAll() {
        let elems = [...this.tokens],
            roots = Object.keys(this.inner);

        for (let i = 0; i < roots.length; i++) {
            this.inner[roots[i]]
                .listAll()
                .forEach(function(value) {
                    this.push(value);
                }.bind(elems));
        }


        elems = elems.map(function(elem) {
            return this.prefix + elem;
        }, this);

        return elems;
    }
}
