class FacetManager
{
    constructor() {
        this.facets = Object.create(null);
    }

    add(id, doc, facets) {
        for (let facet of facets) {
            let value = doc.getNestedValue(facet);

            if (value === undefined) {
                continue;
            }

            if (this.facets[facet] === undefined) {
                this.facets[facet] = Object.assign(Object.create(null), {});
            }

            if (this.facets[facet][value] === undefined) {
                this.facets[facet][value] = new Set();
            }

            this.facets[facet][value].add(id);
        }
    }

    remove(id) {
        for (let facet in this.facets) {
            for (let choice in this.facets[facet]) {
                this.facets[facet][choice].delete(id);

                if (this.facets[facet][choice].size === 0) {
                    delete this.facets[facet][choice];
                }
            }

            if (Object.keys(this.facets[facet]) === 0) {
                delete this.facets[facet];
            }
        }
    }

    getFacets() {
        let refinedFacets = this.refineFacets(this.facets);

        return refinedFacets;
    }

    refineFacets(facets) {
        let refinedFacets = Object.assign(Object.create(null), facets);

        for (let facet in refinedFacets) {
            for (let choice in refinedFacets[facet]) {
                refinedFacets[facet][choice] = refinedFacets[facet][choice].size;
            }
        }

        return refinedFacets;
    }

    search(selectedFacets, docIds) {
        let filteredFacets = Object.assign(Object.create(null), {}),
            filteredDocIds = new Set(docIds),
            facetGroupDocIds = [];

        /**
         * Intersect each selected facet with the global doc ids
         */
        for (let facet in this.facets) {
            if (selectedFacets[facet] === undefined) {
                continue;
            }

            filteredFacets[facet] = Object.assign(Object.create(null), {});

            let facetDocIds = new Set();

            for (let choice in this.facets[facet]) {
                filteredFacets[facet][choice] = this.facets[facet][choice].intersect(docIds);

                if (selectedFacets[facet].indexOf(choice) !== -1) {
                    facetDocIds = facetDocIds.union(this.facets[facet][choice]);
                }
            }

            if (facetDocIds.size > 0) {
                filteredDocIds = filteredDocIds.intersect(facetDocIds);
            }

            facetGroupDocIds[facet] = facetDocIds;
        }

        /**
         * Filter facets not selected using filtered document ids
         */
        for (let facet in this.facets) {
            if (selectedFacets[facet] !== undefined) {
                continue;
            }

            filteredFacets[facet] = Object.assign(Object.create(null), {});

            for (let choice in this.facets[facet]) {
                let facetDocIds = this.facets[facet][choice].intersect(filteredDocIds);

                if (facetDocIds.size > 0) {
                    filteredFacets[facet][choice] = facetDocIds.size;
                }
            }
        }


        /**
         * Filter selected facets using other selected facets
         */
        for (let facet in selectedFacets) {
            let otherFacets = Object.keys(selectedFacets)
                .filter(function(facet) {
                    return this !== facet;
                }.bind(facet)),
                otherFacetIds = undefined;

            for (let otherFacet of otherFacets) {
                if (otherFacetIds === undefined) {
                    otherFacetIds = new Set(facetGroupDocIds[otherFacet]);
                } else {
                    otherFacetIds = otherFacetIds.intersect(facetGroupDocIds[otherFacet]);
                }
            }

            for (let choice in filteredFacets[facet]) {
                let choiceIds = otherFacetIds !== undefined
                    ? filteredFacets[facet][choice].intersect(otherFacetIds)
                    : filteredFacets[facet][choice];

                if (choiceIds.size > 0) {
                    filteredFacets[facet][choice] = choiceIds.size;
                } else {
                    delete filteredFacets[facet][choice];
                }
            }
        }

        return {
            'ids': filteredDocIds,
            'facets': filteredFacets
        };
    }
}
