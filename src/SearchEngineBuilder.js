import SearchEngine from './SearchEngine.js';
import WorkerSearchEngineClient from './WorkerSearchEngineClient.js';
import InvertedIndex from './Index/InvertedIndex.js';
import Aggregator from './Aggregator.js';
import CacheableDocValue from './Cache/CacheableDocValue.js';

export default class SearchEngineBuilder {
    static create(configuration) {
        if (configuration.useWorker === true) {
            let cpuCores = navigator.hardwareConcurrency || 1;

            // at leat one worker for the inverted index depending on the number of documents => 1 for each 1k documents
            // at least one worker to handle facets
            // no more than two workers by cpu core

            return new WorkerSearchEngineClient(
                new Worker('./../dist/metis.worker.js'),
                configuration,
                cpuCores
            );
        } else {
            let docValueManager = new CacheableDocValue(
                configuration.getAggDocValuesCacheSize(),
                configuration.getAggDocValuesCacheMinThreshold(),
                configuration.getAggDocValuesCacheMaxThreshold()
            );

            return new SearchEngine(
                configuration,
                new InvertedIndex(configuration.getCacheSize()),
                new Aggregator(docValueManager)
            );
        }
    }
}
