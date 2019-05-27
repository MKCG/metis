export default class WorkerSearchEngineClient {
    constructor(worker, cacheSize, cpuCores) {
        this.worker = worker;
        this.listeners = [];

        this.worker.postMessage({
            type: 'init',
            cacheSize: cacheSize
        });


        this.worker.onmessage = function(event) {
            (this.listeners[event.data.type] || []).forEach(function(listener) {
                listener.call({}, event.data.result);
            });
        }.bind(this);
    }

    addListener(type, listener) {
        if (!this.listeners[type]) {
            this.listeners[type] = [];
        }

        this.listeners[type].push(listener);
    }

    indexDocument(id, doc, fields, facets) {
        this.worker.postMessage({
            type: 'indexDocument',
            params: {
                id: id,
                doc: doc,
                fields: fields,
                facets: facets
            }
        });
    }

    removeDocument(id) {
        this.worker.postMessage({
            type: 'removeDocument',
            params: {
                id: id
            }
        });
    }

    updateDocument(id, doc, fields, facets) {
        this.worker.postMessage({
            type: 'updateDocument',
            params: {
                id: id,
                doc: doc,
                fields: fields,
                facets: facets
            }
        });
    }

    sort(sortCallback) {
        this.worker.postMessage({
            type: 'sort',
            params: {
                sortCallback: (sortCallback || function(a,b) {return 0;}).toString()
            }
        });
    }

    fuzzySearch(query, limit, selectedFacets, sortCallback) {
        this.worker.postMessage({
            type: 'fuzzySearch',
            params: {
                query: query,
                limit: limit,
                selectedFacets: selectedFacets,
                sortCallback: (sortCallback || function(a,b) {return 0;}).toString()
            }
        });
    }

    searchByPrefix(query, limit, selectedFacets, sortCallback, fieldsSelected) {
        this.worker.postMessage({
            type: 'searchByPrefix',
            params: {
                query: query,
                limit: limit,
                selectedFacets: selectedFacets,
                sortCallback: (sortCallback || function(a,b) {return 0;}).toString(),
                fieldsSelected: fieldsSelected
            }
        });
    }

    suggest(query, limit) {
        this.worker.postMessage({
            type: 'suggest',
            params: {
                query: query,
                limit: limit
            }
        });
    }
}
