class SearchEngineBuilder
{
    static create(cacheSize, useWorker) {
        if (useWorker === true) {
            let cpuCores = navigator.hardwareConcurrency || 1;

            // at leat one worker for the inverted index depending on the number of documents => 1 for each 1k documents
            // at least one worker to handle facets
            // no more than two workers by cpu core

            return new SearchEngine(new InvertedIndex(cacheSize), new FacetManager());
        } else {
            return new SearchEngine(new InvertedIndex(cacheSize), new FacetManager());
        }
    }
}
