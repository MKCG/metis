export default class Aggregator {
    constructor(docValues) {
        this.termVector = Object.create(null);
        this.docValues = docValues;
    }

    addDocument(id, doc, facets) {
        this.removeDocument(id);

        for (let facet of facets) {
            let value = doc.getNestedValue(facet);

            if (value === undefined) {
                continue;
            }

            if (this.termVector[facet] === undefined) {
                this.termVector[facet] = Object.assign(Object.create(null), {});
            }

            if (this.termVector[facet][value] === undefined) {
                this.termVector[facet][value] = new Set();
            }

            this.termVector[facet][value].add(id);
        }

        this.docValues.addDocument(id, doc, facets);
    }

    removeDocument(id) {
        for (let facet in this.termVector) {
            for (let choice in this.termVector[facet]) {
                this.termVector[facet][choice].delete(id);

                if (this.termVector[facet][choice].size === 0) {
                    delete this.termVector[facet][choice];
                    this.docValues.removeFieldValue(facet, choice);
                }
            }

            if (Object.keys(this.termVector[facet]) === 0) {
                this.docValues.removeField(facet);
                delete this.termVector[facet];
            }
        }

        this.docValues.removeDocument(id);
    }

    selectFacets(selectedFacets, docIds) {
        console.clear();
        let filteredFacets = Object.assign(Object.create(null), {}),
            filteredDocIds = new Set(docIds),
            filteredIds = new Set(docIds),
            facetGroupDocIds = [],
            facetsDocIds = [];

        docIds = new Set(docIds);

        let start, end;
        start = performance.now();

        /**
         * Intersect each selected facet with the global doc ids
         */
        for (let facet in this.termVector) {
            if (selectedFacets[facet] === undefined) {
                continue;
            }

            let valuesToIds = this.docValues.fetchIdsByFieldValue(facet, docIds);
            filteredFacets[facet] = valuesToIds;

            let toCombine = [];

            for (let choice of Object.keys(valuesToIds)) {
                if (selectedFacets[facet].indexOf(choice) !== -1) {
                    toCombine.push(valuesToIds[choice]);
                }
            }

            let facetDocIds = new Set();

            for (let choiceValues of toCombine) {
                for (let docId of choiceValues.keys()) {
                    facetDocIds.add(docId);
                }
            }

            facetGroupDocIds[facet] = facetDocIds;

            if (facetDocIds.size > 0) {
                facetsDocIds.push(facetDocIds);
            }
        }

        end = performance.now();
        console.log('docValues - took ' + Math.round(end - start, 2) + 'ms');

        start = performance.now();

        if (facetsDocIds.length > 0) {
            filteredDocIds = this.intersectSets(facetsDocIds);
        }

        end = performance.now();
        console.log('intersections - took ' + Math.round(end - start, 2) + 'ms');


        let aggs = this.docValues.countEachFieldValue(filteredDocIds, Object.keys(this.termVector));

        start = performance.now();
        console.log('not selected agg - took ' + Math.round(start - end, 2) + 'ms');
        /**
         * Filter facets not selected using filtered document ids
         */
        for (let facet in this.termVector) {
            if (selectedFacets[facet] !== undefined) {
                continue;
            }

            filteredFacets[facet] = Object.assign(Object.create(null), {});

            for (let choice of Object.keys(this.termVector[facet])) {
                let facetDocIds = this.termVector[facet][choice].intersect(filteredDocIds);

                if (facetDocIds.size > 0) {
                    filteredFacets[facet][choice] = facetDocIds.size;
                }
            }
        }
        end = performance.now();
        console.log('not selected - took ' + Math.round(end - start, 2) + 'ms');

        start = performance.now();
        /**
         * Filter selected facets using other selected facets
         */
        for (let facet of Object.keys(selectedFacets)) {
            let otherFacets = Object.keys(selectedFacets)
                .filter(function(facet) {
                    return this !== facet;
                }.bind(facet)),
                otherFacetIds = undefined;

            let startCross = performance.now();

            otherFacetIds = this.intersectSets(otherFacets.map(name => facetGroupDocIds[name]));

            let middleCross = performance.now();

            for (let choice in filteredFacets[facet]) {
                let choiceIds = otherFacetIds.size > 0
                    ? filteredFacets[facet][choice].intersect(otherFacetIds || new Set())
                    : filteredFacets[facet][choice];

                if (choiceIds.size > 0) {
                    filteredFacets[facet][choice] = choiceIds.size;
                } else {
                    delete filteredFacets[facet][choice];
                }
            }

            let endCross = performance.now();
            console.log('cross selected facet ' + facet + ' - took ' + Math.round(middleCross - startCross, 2) + 'ms for others intersection');
            console.log('cross selected facet ' + facet + ' - took ' + Math.round(endCross - middleCross, 2) + 'ms for choices intersection');
        }
        end = performance.now();
        console.log('cross select - took ' + Math.round(end - start, 2) + 'ms');

        return {
            'ids': filteredDocIds,
            'facets': filteredFacets
        };
    }

    aggregateByTerm(term, ids, limit) {
        console.time(term);
        let aggregation = this.termVector[term] || {};

        if (Array.isArray(ids)) {
            aggregation = Object.keys(aggregation)
                .reduce(function(ids, acc, field) {
                    acc[field] = this[field].intersect(ids);
                    return acc;
                }.bind(aggregation, ids), {});

            Object.keys(aggregation)
                .forEach(function(field) {
                    if (this[field].size === 0) {
                        delete this[field];
                    }
                }.bind(aggregation));
        }

        let result = this.renderAggregation(aggregation, this.sortByValueDesc, limit);
        console.timeEnd(term);
        return result;
    }

    aggregateByRange(name, ranges, ids) {
        debugger;

    }

    renderAggregation(aggregation, sorter, limit) {
        let bucket = Object.keys(aggregation)
            .reduce(function(acc, field) {
                acc.push([field, this[field].size]);
                return acc;
            }.bind(aggregation), [])
            .sort(sorter);

        return limit > 0
            ? bucket.slice(0, limit)
            : bucket
        ;
    }

    sortByTermAsc(a, b) {
        return a[0] > b[0] ? 1 : -1;
    }

    sortByTermDesc(a, b) {
        return a[0] < b[0] ? 1 : -1;
    }

    sortByValueAsc(a, b) {
        return a[1] > b[1] ? 1 : -1;
    }

    sortByValueDesc(a, b) {
        return a[1] < b[1] ? 1 : -1;
    }

    intersectSets(sets) {
        if (sets.length === 2) {
            return sets[0].intersect(sets[1]);
        }

        let fastIntersection = new Set();

        sets.sort((a, b) => a.size > b.size);

        for (let value of sets[0].values()) {
            let matchAll = true;

            for (let i = 1; i < sets.length; i++) {
                if (!sets[i].has(value)) {
                    matchAll = false;
                    break;
                }
            }

            if (matchAll) {
                fastIntersection.add(value);
            }
        }

        return fastIntersection;
    }
}
