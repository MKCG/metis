export default class ColorFeature {
    constructor(colors) {
        this.colors = colors || [
            "red", "green", "blue", "yellow", "purple",
            "mint green", "teal", "white", "black", "orange",
            "pink", "grey", "maroon", "violet", "turquoise",
            "tan", "sky blue", "salmon", "plum", "orchid",
            "olive", "magenta", "lime", "ivory", "indigo",
            "gold", "fuchsia", "cyan", "azure", "lavender", "silver"
        ];
    }

    categorize(text) {
        let normalizedText = text.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z 0-9]+/g," ")
            .toLocaleLowerCase()
        ;

        return this.colors.filter(color => normalizedText.indexOf(color) !== -1);
    }
}
