class SearchEngine
{
    constructor(index, facetManager) {
        this.index = index;
        this.facetManager = facetManager;
        this.documents = [];
        this.sortedKeywords
    }

    indexDocument(id, doc, fields, facets) {
        for (let field of fields) {
            let value = doc.getNestedValue(field);

            if (typeof value !== undefined) {
                this.index.register(id, value);
            }
        }

        this.facetManager.add(id, doc, facets);
        this.documents[id] = doc;
    }

    searchByPrefix(query, limit, selectedFacets) {
        let searchStart = performance.now();

        let facetIds = this.facetManager.search(selectedFacets);
        let foundIds = this.index.searchByPrefix(query);

        let ids = new Set(foundIds);
        ids = [...ids];

        let count = ids.length,
            documents = ids.slice(0, limit)
            .map(function(id) {
                return this.documents[id];
            }.bind(this));

        let facets = {};
        let searchTime = performance.now() - searchStart;

        return {
            'query': query,
            'ids': ids,
            'count': count,
            'documents': documents,
            'facets': facets,
            'took': searchTime
        };
    }

    suggest(query, limit) {
        let suggestions = this.index.suggest(query, limit);
        return suggestions;
    }
}
