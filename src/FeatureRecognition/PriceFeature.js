export default class PriceFeature {
    constructor() {
        this.currencies = {
            dollar: {
                symbol: '$',
                variants: ['$', 'dollar', 'dollars']
            },
            euro: {
                symbol: '€',
                variants: ['€', 'euro', 'euros']
            },
            pound: {
                symbol: '£',
                variants: ['£', 'pound']
            }
        };
    }

    categorize(text) {
        let currencies = Object.keys(this.currencies)
            .map(currency => this.currencies[currency].variants)
            .reduce((acc, curr) => acc.concat(curr), [])
        ;

        let words = text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase()
            .split(/\s+/)
        ;

        let prices = words
            .filter(function(currencies, word) {
                return currencies.filter(currency => word.indexOf(currency) !== -1).length > 0;
            }.bind(this, currencies))
            .filter(t => t.match(/\d/) !== null)
        ;

        return prices;
    }
}
