export default class DocValue {
    constructor() {
        this.documents = {};

        this.mapFieldToInt = new Map();
        this.intFieldCounter = 0;

        this.mapValueToInt = new Map();
        this.mapIntToValue = new Map();
        this.intValueCounter = 0;
    }

    addDocument(id, document, fields) {
        for (let field of fields) {
            let value = document.getNestedValue(field);

            if (value === undefined || value === null) {
                continue;
            }

            if (!this.documents[id]) {
                this.documents[id] = Object.assign(Object.create(null), {});
            }

            if (!Array.isArray(value)) {
                value = [value];
            }

            value = value.map(v => this.getIntFromValue(v));
            field = this.getIntFromFieldName(field);

            this.documents[id][field] = new Set(value);
        }

        return this;
    }

    removeDocument(id) {
        delete this.documents[id];
        return this;
    }

    docIdsByFieldValue(field, docIds) {
        let fieldValues = Object.assign(Object.create(null), {});
        let fieldAsInt = this.mapFieldToInt.get(field);

        if (fieldAsInt === undefined) {
            return fieldValues;
        }

        for (let id of docIds) {
            if (!this.documents[id] || !this.documents[id][fieldAsInt]) {
                continue;
            }

            for (let value of this.documents[id][fieldAsInt]) {
                if (!fieldValues[value]) {
                    fieldValues[value] = new Set();
                }

                fieldValues[value].add(id);
            }
        }

        let docIdsByFieldValue = Object.assign(Object.create(null), {});

        for (let value of Object.keys(fieldValues)) {
            let originalValue = this.mapIntToValue.get(parseInt(value));
            docIdsByFieldValue[originalValue] = fieldValues[value];
        }

        return docIdsByFieldValue;
    }

    getIntFromFieldName(field) {
        let int = this.mapFieldToInt.get(field);

        if (int === undefined) {
            int = this.intFieldCounter++;
            this.mapFieldToInt.set(field, int);
        }

        return int;
    }

    getIntFromValue(value) {
        let int = this.mapValueToInt.get(value);

        if (int === undefined) {
            int = this.intValueCounter++;
            this.mapValueToInt.set(value, int);
            this.mapIntToValue.set(int, value);
        }

        return int;
    }
}
