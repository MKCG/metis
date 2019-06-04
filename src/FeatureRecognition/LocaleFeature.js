import StopWords from './../NLP/StopWords.js';

export default class LocaleFeature {
    constructor() {
        this.stopwords = {
            brazilian: new Set(StopWords.brazilian()),
            english: new Set(StopWords.english()),
            french: new Set(StopWords.french()),
            german: new Set(StopWords.german()),
            italian: new Set(StopWords.italian()),
            spanish: new Set(StopWords.spanish()),
            portuguese: new Set(StopWords.portuguese()),
            russian: new Set(StopWords.russian())
        };
    }

    categorize(text) {
        let words = text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase()
            .split(/[^\w|']+/)
            .filter(word => word.length > 0)
            .filter(word => word.match(/[^\w+']|\d+/gi) === null)
        ;

        let stats = [];

        for (let lang of Object.keys(this.stopwords)) {
            let nb = words.filter(word => this.stopwords[lang].has(word)).length;

            stats.push({
                lang: lang,
                nbWords: words.length,
                nbStopWords: nb,
                ratioStopWords: nb / words.length
            });
        }

        stats.sort((a, b) => a.ratioStopWords < b.ratioStopWords);

        return stats;
    }
}
