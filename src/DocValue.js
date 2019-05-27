export default class DocValue {
    constructor() {
        this.documents = {};
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
                this.documents[id][field] = new Set([value]);
            } else {
                this.documents[id][field] = new Set(value);
            }
        }

        return this;
    }

    removeDocument(id) {
        delete this.documents[id];
        return this;
    }

    docIdsByFieldValue(field, docIds) {
        let fieldValues = {};

        for (let id of docIds) {
            if (!this.documents[id] || !this.documents[id][field]) {
                continue;
            }

            for (let value of this.documents[id][field]) {
                if (!fieldValues[value]) {
                    fieldValues[value] = new Set();
                }

                fieldValues[value].add(id);
            }
        }

        return fieldValues;
    }
}
