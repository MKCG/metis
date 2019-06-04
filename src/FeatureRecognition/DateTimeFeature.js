export default class DateTimeFeature {
    constructor() {
        this.months = {
            english: new Set(["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]),
            french: new Set(["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"]),
            german: new Set(["januar","februar","märz","april","mai","juni","juli","august","september","oktober","november","dezember"]),
            italian: new Set(["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"]),
            portuguese: new Set(["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"]),
            russian: new Set(["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"]),
            spanish: new Set(["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"])
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

        let dates = [];

        for (let lang of Object.keys(this.months)) {
            let monthsFound = new Set(words.filter(word => this.months[lang].has(word)));

            if (monthsFound.size > 0) {
                dates.push({
                    lang: lang,
                    months: [...monthsFound]
                });
            }
        }

        return dates;
    }
}
