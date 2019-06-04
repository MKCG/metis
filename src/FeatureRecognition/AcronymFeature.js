export default class AcronymFeature {
    categorize(text) {
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z 0-9]+/g," ")
            .split(' ')
            .filter(value => value.toLocaleUpperCase() === value)
            .filter(value => value.length > 1)
            .filter(value => Number.isNaN(Number(value)))
        ;
    }
}
