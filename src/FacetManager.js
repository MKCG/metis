class FacetManager
{
    constructor() {
        this.facets = {};
    }

    add(id, doc, facets) {
        for (let facet of facets) {
            let value = doc.getNestedValue(facet);

            if (value === undefined) {
                continue;
            }

            if (this.facets[facet] === undefined) {
                this.facets[facet] = {
                    'values': {}
                };
            }

            if (this.facets[facet].values[value] === undefined) {
                this.facets[facet].values[value] = new Set();
            }

            this.facets[facet].values[value].add(id);
        }
    }

    search(selectedFacets) {
        let foundIds;

        for (let facet in selectedFacets) {
            if (selectedFacets.hasOwnProperty(facet) === false) {
                continue;
            }

            let facetIds = selectedFacets[facet]
                .map(function(selected) {
                    return this[selected] || new Set();
                }.bind(this.facets[facet].values))
                .reduce(function(acc, current) {
                    return acc.union(current);
                });

            if (foundIds !== undefined) {
                foundIds = foundIds.intersect(facetIds);
            } else {
                foundIds = facetIds;
            }

            if (foundIds.size === 0) {
                break;
            }
        }

        return foundIds;
    }
}
