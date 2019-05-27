import Storage from './Storage.js';

export default class Page extends Storage {
    constructor() {
        super();

        this.tracked = 0;
        this.documents = [];
    }

    addDocument(id, doc) {
        if (!this.documents[id]) {
            this.tracked++;
        }

        this.documents[id] = doc;
    }

    getDocument(id) {
        return this.documents[id] || null;
    }

    getDocuments(ids) {
        let documents = [];

        for (let id in ids) {
            if (!!this.documents[id]) {
                documents[id] = this.documents[id];
            }
        }

        return documents;
    }

    getAllDocuments() {
        return this.documents;
    }

    removeDocument(id) {
        if (!!this.documents[id]) {
            delete this.documents[id];
            this.tracked--;
        }
    }

    flush() {
        this.documents = [];
        this.tracked = 0;
    }

    countTracked() {
        return this.tracked;
    }
}
