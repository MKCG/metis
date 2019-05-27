import Storage from './Storage.js';
import Page from  './Page.js';

export default class IndexedDBStorage extends Storage {
    constructor(dbName, maxDocByPage, maxPageInMemory, flushInterval) {
        super();

        this.config = {
            dbName: dbName || 'metis',
            storeName: 'documents',
            pageNamePrefix: 'page-',
            version: 1,
            maxDocByPage: parseInt(maxDocByPage) || 1000,
            maxPageInMemory: parseInt(maxPageInMemory) || 10,
            flushInterval: parseInt(flushInterval) || 1000,
            flushRetryDelay: 2
        };

        this.currentPage = new Page();
        this.pages = [];
        this.loadedPages = [];
        this.mapDocIdToPage = [];

        this.flushablePages = new Set();
        this.flushIsPending = false;

        this.mapPageToName = new Map();
        this.isInitialized = false;
        this.delayedOperations = [];
        this.db = null;
        this.onInitialized = function(documents) {};
    }

    connect(onInitialized) {
        if (typeof onInitialized === 'function') {
            this.onInitialized = onInitialized;
        }

        this.getConnection();
        return this;
    }

    addDocument(id, doc) {
        if (this.isInitialized === false) {
            this.delayedOperations.push(['addDocument', id, doc]);
            return;
        }

        if (!!this.mapDocIdToPage[id]) {
            this.mapDocIdToPage[id].addDocument(id, doc);
            this.addPageToFlush(this.mapDocIdToPage[id]);
        } else {
            this.currentPage.addDocument(id, doc);
            this.mapDocIdToPage[id] = this.currentPage;
            this.addPageToFlush(this.currentPage);

            if (this.currentPage.countTracked() === this.config.maxDocByPage) {
                this.currentPage = new Page();
                this.pages.push(this.currentPage);
            } else if (this.pages.length === 0) {
                this.pages.push(this.currentPage);
            }
        }
    }

    getDocument(id) {
        if (this.isInitialized === false) {
            let delayed = function(id, resolve, reject) {
                this.delayedOperations.push(['getDocument', id, resolve, reject]);
            }.bind(this, id);

            return new Promise(delayed);
        }

        if (!this.mapDocIdToPage[id]) {
            return new Promise(function(resolve, reject) {
                resolve(null);
            });
        }

        let page = this.mapDocIdToPage[id];

        let promisedDoc = new Promise(function(page, id, resolve, reject) {
            if (page.countTracked() === 0) {
                this.loadPage(page, function(page, id, resolve, reject) {
                    let doc = page.getDocument(id);
                    this.freeMemory();

                    if (doc) {
                        resolve(doc);
                    } else {
                        reject(new Error('Content unfetchable'));                        
                    }
                }.bind(this, page, id, resolve, reject));
            } else {
                let doc = page.getDocument(id);
                resolve(doc);
            }
        }.bind(this, page, id));

        return promisedDoc;
    }

    getDocuments(ids) {
        if (this.isInitialized === false) {
            let delayed = function(ids, resolve, reject) {
                this.delayedOperations.push(['getDocuments', ids, resolve, reject]);
            }.bind(this, ids);

            return new Promise(delayed);
        }

        let knownIds = ids.filter(id => !!this.mapDocIdToPage[id]);
        let pages = knownIds.map(id => this.mapDocIdToPage[id]);
        let promises = [];

        let docsLoaded = new Array();

        for (let id of knownIds) {
            if (this.mapDocIdToPage[id].countTracked() > 0)  {
                docsLoaded.push(this.mapDocIdToPage[id].getDocument(id));
            }
        }

        if (Object.keys(docsLoaded).length > 0) {
            promises.push(new Promise(function(resolve, reject) {
                resolve(this);
            }.bind(docsLoaded)));
        }

        let pagesToLoad = pages.filter(page => page.countTracked() === 0);
        pagesToLoad = [...new Set(pagesToLoad)];

        if (pagesToLoad.length > 0) {
            let futurePromises = pagesToLoad.map(function(knownIds, page) {
                return new Promise(function(knownIds, page, resolve, reject) {
                    this.loadPage(page, function(page, knownIds, resolve, reject) {
                        let documents = knownIds.map(function(id) {
                                return this.getDocument(id);
                            }.bind(page))
                            .filter(doc => doc !== null)
                        ;

                        resolve(documents);
                    }.bind(this, page, knownIds, resolve, reject));
                }.bind(this, knownIds, page));
            }.bind(this, knownIds));

            promises = promises.concat(futurePromises);
        }

        let coordinator = Promise.all(promises);

        return new Promise(function(promise, resolve, reject) {
            promise.then(function(resolve, results) {
                let documents = results.reduce(function(acc, curr) {
                        acc = acc.concat(curr);
                        return acc;
                    }, []);
                resolve(documents);
            }.bind(this, resolve));
        }.bind(this, coordinator));
    }

    removeDocument(id) {
        if (this.isInitialized === false) {
            this.delayedOperations.push(['removeDocument', id]);
            return;
        }

        if (!this.mapDocIdToPage[id]) {
            return;
        }

        let page = this.mapDocIdToPage[id];
        page.removeDocument(id);

        this.addPageToFlush(page);
        delete this.mapDocIdToPage[id];
    }

    loadPage(page, callback) {
        let name = this.getPageName(page);

        let request = this.db.transaction(this.config.storeName)
            .objectStore(this.config.storeName)
            .get(name);

        request.onsuccess = function(page, callback, event) {
            Object.keys(event.target.result).forEach(function(documents, docId) {
                this.addDocument(docId, documents[docId]);
            }.bind(page, event.target.result));

            this.loadedPages.push(page);
            callback();
        }.bind(this, page, callback);

        request.onerror = function(page, callback, event) {
            callback();
        }.bind(this, page, callback);
    }

    addPageToFlush(page) {
        this.flushablePages.add(page);

        if (!this.flushIsPending) {
            this.flushIsPending = true;
            setInterval(this.flush.bind(this), this.config.flushInterval);
        }
    }

    flush() {
        if (this.getConnection().readyState !== 'done') {
            setInterval(this.flush.bind(this), this.config.flushRetryDelay);
            return;
        }

        if (!this.db) {
            /**
             * Happens when a connection error occured
             * objects are not flushed and are kept in memory only
             */
            return;
        }

        this.flushablePages.forEach(function(page) {
            let connection = this.getConnection();
            let documents = page.getAllDocuments();
            let pageName = this.getPageName(page);

            this.db
                .transaction(this.config.storeName, 'readwrite')
                .objectStore(this.config.storeName)
                .add(documents, pageName);

            if (this.loadedPages.indexOf(page) === -1) {
                page.flush();
            }
        }.bind(this));

        this.flushablePages = new Set();
        this.freeMemory();
        this.flushIsPending = false;
    }

    freeMemory() {
        if (!this.db) {
            /**
             * When the db is not defined
             * Then the connection could not be established
             * And the memory must not be freed
             */
            return;
        }

        while (this.loadedPages.length > this.config.maxPageInMemory) {
            let pageToDrop = this.loadedPages.shift();
            pageToDrop.flush();
        }
    }

    getConnection() {
        if (!this.connection) {
            this.connection = indexedDB.open(this.config.dbName, this.config.version);

            let applyPendingOperations = function() {
                this.isInitialized = true;

                this.delayedOperations.forEach(function(operation) {
                    switch (operation[0]) {
                        case 'addDocument':
                            this.addDocument(operation[1], operation[2]);
                            break;

                        case 'removeDocument':
                            this.removeDocument(operation[1]);
                            break;

                        case 'getDocument':
                            this.getDocument(operation[1]).then(function(resolve, reject, document) {
                                resolve(document);
                            }.bind(this, operation[2], operation[3]));
                            break;

                        case 'getDocuments':
                            this.getDocuments(operation[1]).then(function(resolve, reject, documents) {
                                if (Array.isArray(documents)) {
                                    resolve(documents);
                                } else {
                                    reject();
                                }
                            }.bind(this, operation[2], operation[3]));
                            break;
                    }
                }.bind(this));
            }.bind(this);

            this.connection.onsuccess = function(applyPendingOperations, event) {
                this.db = event.target.result;

                this.db.transaction(this.config.storeName)
                    .objectStore(this.config.storeName)
                    .openCursor()
                    .onsuccess = function(applyPendingOperations, event) {
                        let cursor = event.target.result;

                        if (cursor) {
                            this.makePage(cursor.key, cursor.value);
                            this.onInitialized(cursor.value);
                            cursor.continue();
                        } else {
                            applyPendingOperations();
                            this.delayedOperations = [];
                        }
                    }.bind(this, applyPendingOperations);
            }.bind(this, applyPendingOperations);

            this.connection.onupgradeneeded = function(event) {
                let db = event.target.result;

                if (!db.objectStoreNames.contains(this.config.storeName)) {
                    db.createObjectStore(this.config.storeName);
                }
            }.bind(this);

            this.connection.onerror = applyPendingOperations;
        }

        return this.connection;
    }

    makePage(name, documents) {
        let page = new Page();

        Object.keys(documents).forEach(function(page, documents, docId) {
            page.addDocument(docId, documents[docId]);
            this.mapDocIdToPage[docId] = page;
        }.bind(this, page, documents));

        this.pages.unshift(page);
        this.mapPageToName.set(page, name);
        this.loadedPages.push(page);
        this.freeMemory();
    }

    getPageName(page) {
        let name = this.mapPageToName.get(page);

        if (!name) {
            name = this.config.pageNamePrefix + this.pages.indexOf(page);
            this.mapPageToName.set(page, name);
        }

        return name;
    }
}
