import IndexedDBStorage from './Storage/IndexedDBStorage.js';
import Page from './Storage/Page.js';

export default class EngineConfiguration {
    constructor() {
        this.useWorker = false;
        this.aggUseDocValue = false;

        this.searchableFields = [];
        this.aggregatableFields = [];
        this.sortableFields = [];

        this.cache = {
            search: {
                maxSize: 50
            },
            agg: {
                docValue: {
                    maxSize: 10,
                    minThreshold: 100,
                    maxThreshold: 1000000
                }
            }
        };

        this.storage = {
            persistent: true,          // Storage is persistent by default if possible
            type: 'indexedDB',
            config: {
                dbName: 'metis',
                maxPageInMemory: 20,
                maxDocByPage: 1000,
                flushInterval: 1000    // Delay in ms before a page flush is made on disk when a change happens
            }
        };
    }

    getStorage() {
        if (this.storage.type === 'indexedDB') {
            return new IndexedDBStorage(
                this.storage.dbName,
                this.storage.maxPageInMemory,
                this.storage.maxDocByPage,
                this.storage.flushInterval
            );
        } else if (this.storage.type === 'in-memory') {
            return new Page();
        }

        return new Page();
    }

    /**
     * Behaviours :
     *    - When a document is indexed without providing any searchable fields (i.e. defining them as null or undefined)
     *      Then those default searchable fields are used
     *
     *      However, if a document is indexed while providing [] or {} as searchable fields
     *      Then none will be used and the document will be accessible only when an empty query is used
     *
     *    - When the default searchable fields are defined or changed after indexing any document
     *      Then those document will not be reindexed unless they are explicitly reindexed
     */
    defineDefaultSearchableFields(searchableFields) {
        this.searchableFields = searchableFields;
        return this;
    }

    defineDefaultAggregatableFields(aggregatableFields) {
        this.aggregatableFields = aggregatableFields;
        return this;
    }

    defineDefaultSortableFields(sortableFields) {
        this.sortableFields = sortableFields;
        return this;
    }

    /**
     * DocValue is a column oriented structure
     *
     * In some cases DocValue improves the performance of aggregation
     * However it greatly increases the memory usage of the overall system
     *
     * It is recommended to activate DocValue when
     *    - the cardinality of each value is high (over 40 distinct values)
     *    - the length of each distinct value is small (less than 20 characters)
     *
     * It is recommended to not activate DocValue when
     *    - the length of any value is high (over 2O characters)
     *    - the number of indexed documents is high (over 20K documents)
     */
    aggregationUseDocValues(useDocValue) {
        this.aggUseDocValue = useDocValue;
        return this;
    }

    getAggDocValuesCacheSize() {
        return this.cache.agg.docValue.maxSize;
    }

    getAggDocValuesCacheMinThreshold() {
        return this.cache.agg.docValue.minThreshold;
    }

    getAggDocValuesCacheMaxThreshold() {
        return this.cache.agg.docValue.maxThreshold;
    }

    getCacheSize() {
        return this.cache.search.maxSize;
    }

    /**
     * Define the number of searches kept in cache using a queue acting as a FIFO
     *
     * Only the fulltext-search of a query is cached
     * The aggregation part is never cached also it is expected to be supported in a future version
     *
     * The cache is flushed whenever a new document is indexed
     */
    changeSearchCacheSize(cacheSize)
    {
        this.cache.search.maxSize = cacheSize;
        return this;
    }
}
