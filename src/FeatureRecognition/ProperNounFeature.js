export default class ProperNounFeature {
    categorize(text) {
        let nouns = text.split("\n")
            .map(function(text) {
                let normalizedText = text
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-zA-Z 0-9.!?,;']+/g," ")
                    .split(' ')
                    .filter(text => text.length > 0)
                ;

                return normalizedText;
            })
            .filter(tokens => tokens.length > 0)
            .map(tokens => tokens.join(' '))
            .map(tokens => tokens.split(/[,;?!']/))
            .map(tokens => tokens.map(token => token.split(' ')).map(this.extractNouns))
            .reduce((acc, curr) => acc.concat(curr), [])
            .reduce((acc, curr) => acc.concat(curr), [])
            .filter(token => token.length > 0)
            .map(token => token.trim())
        ;

        nouns = [...new Set(nouns)];
        return nouns;
    }

    extractNouns(tokens) {
        let nouns = [];
        let currentTokens = [];

        for (let i in tokens) {
            let token = tokens[i];
            let endWithPoint = token === '.' || token.substring(token.length -1) === '.';

            let isCapitalized = token.substring(0, 1).toUpperCase() === token.substring(0, 1)
                && token.match(/^\d+([.,]\d+)?$/g) === null;

            if (!isCapitalized || (endWithPoint && token.length > 2)) {
                if (currentTokens.length > 0 && i > 1) {
                    if (isCapitalized) {
                        currentTokens.push(token.substring(0, token.length - 1));
                    }

                    if (currentTokens[0] === '.' && currentTokens.length === 2) {
                        currentTokens = [];
                        continue;
                    }

                    if (currentTokens[0] === '.') {
                        currentTokens.shift();
                    }

                    nouns.push(currentTokens.join(' '));
                }

                currentTokens = [];

                if (endWithPoint) {
                    currentTokens.push('.');
                }

                continue;
            }

            currentTokens.push(token);
        }

        if (currentTokens.length > 0) {
            if (currentTokens[0] === '.') {
                currentTokens.shift();
            }

            nouns.push(currentTokens.join(' '));
        }

        return nouns;
    }
}
