import DocValue from './../Index/DocValue.js';

export default class CacheableDocValue extends DocValue {
    constructor (cacheSize, minThreshold, maxThreshold) {
        super();
        this.cacheSize = cacheSize || 10;
        this.minThreshold = minThreshold || 100;
        this.maxThreshold = maxThreshold || 1000000;
        this.cache = [];
    }

    addDocument(id, document, fields) {
        super.addDocument(id, document, fields);
        this.cache = [];

        return this;
    }

    removeDocument(id) {
        super.removeDocument(id);
        this.cache = [];

        return this;
    }

    fetchIdsByFieldValue(field, docIds) {
        let cache = this.cache
            .filter(cached => cached.field === field)
            .filter(cached => cached.docIds.intersect(docIds).size === docIds.size)
        ;

        if (cache.length > 0) {
            let result = Object.assign(Object.create(null), {});

            for (let value of Object.keys(cache[0].result)) {
                result[value] = cache[0].result[value].intersect(docIds);
            }

            return result;
        }

        let result = super.fetchIdsByFieldValue(field, docIds);

        if (docIds.size > this.minThreshold && docIds.size < this.maxThreshold) {
            this.cache.push({
                field: field,
                docIds: docIds,
                result: Object.assign(Object.create(null), result)
            });
        }

        if (this.cache.length >= this.cacheSize) {
            this.cache.shift();
        }

        return result;
    }
}
