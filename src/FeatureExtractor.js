import AcronymFeature from './FeatureRecognition/AcronymFeature.js';
import ColorFeature from './FeatureRecognition/ColorFeature.js';
import DateTimeFeature from './FeatureRecognition/DateTimeFeature.js';
import LocaleFeature from './FeatureRecognition/LocaleFeature.js';
import ProperNounFeature from './FeatureRecognition/ProperNounFeature.js';

export default class FeatureExtractor {
    constructor() {
        this.features = new Map();

        this
            .addFeature('acronym', new AcronymFeature())
            .addFeature('color', new ColorFeature())
            .addFeature('datetime', new DateTimeFeature())
            .addFeature('locale', new LocaleFeature())
            .addFeature('properNoun', new ProperNounFeature())
        ;
    }

    addFeature(name, feature) {
        this.features.set(name, feature);
        return this;
    }

    categorize(text) {
        let result = Object.create(null);
        this.features.forEach((feature, name) => result[name] = [...new Set(feature.categorize(text))]);

        return result;
    }
}
