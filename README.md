# METIS

MKCG's Engine for Textual In-device Search, or METIS, is named after the greek mythological Titaness.  
METIS is a fulltext search engine with facet capabilities, prefix matching and fuzzy matching.


It is a lightweight ECMAScript6 library which does not require any additional dependency.


However, as indexes are loaded in memory then its memory consumption might be heavy depending on the number of documents, their text length and the number of distinct words in it.

It is recommended to index less than a few thousands document for a good user experience : the less documents, the faster it is. First results seems to indicate that client-side search operations can be performed in a few milliseconds.


## Running environment

METIS has been created to enhance search engine usage on mobile-devices in offline mode.
Alternatively it can also be used server-side but you should not expect the same performance than Lucene-based alternatives.


## Features

### Fulltext search

#### Fuzzy search

Work in progress.

Fuzzy search allow typo tolerance based on the tokenized query. Typo tolerance is applied for each token with :
* no typo mistake for tokens of less than 4 characters
* 1 typo mistake for tokens of less than 8 characters
* 2 mistakes for tokens of at least 8 characters


#### Prefix search

#### Suggest

Suggest search allow for fast autocomplete based on the last query token.

At the moment, suggested values are not necessarily part of the documents matching the first part of the query.


### Sorting algorithm

Not implemented yet.


Contrary to other search engines, tokens frequencies are not stored to limit the overall memory usage.  

Instead of a traditional TF-IDF or Okapi BM25 implementation, the sorting formula will be based on a mix between:
* the number of tokens of each document
* the search fuzziness
* custom-attribute matching
* sorting callbacks



#### Locale support

Not implemented yet.

Locale support will be based on defined stopwords lists and on stemming rules.


Expected locales support :
* English
* French
* Spanish


### Aggregations

At the moment, only facets aggregations are expected to be supported.

#### Facets

Work in progress.


#### Highlight

Not implemented yet. This feature will probably not be enabled by default.


## Getting started

### Search engine configuration

#### Searchable fields

METIS maintains only one inverted index for memory usage reason. This means that, when searching for a document, you can not define on which field the search should be performed.

However, when indexing a document, you must define which fields should be indexed. This allow you to index documents of completely different mappings into the same search engine.


#### Define the number of web workers

Not implemented yet.


#### Index storage configuration

Not implemented yet.

Dependending of the index size and the device capabilities, it will be possible to store the index into the IndexedDB or the LocalStorage.
This will allow for a faster application bootstrap.


#### Document storage configuration

Not implemented yet.

Dependending of the overall documents size and the device capabilities, it will be possible to store the index into the IndexedDB or the LocalStorage.
This will allow to use the search engine while being offline.


### CRUD operations

#### Adding documents

```javascript
const searchEngine = SearchEngineBuilder.create(50, true);

const fields = [
    'content.firstname',
    'content.lastname',
    'content.jobTitle',
    'content.presentation',
    'content.contact.email',
    'content.github.name'
];

const facets = [
    'content.github.name',
    'content.github.project.name',
    'content.github.project.licence',
    'content.github.project.language',
    'content.skills'
];

let doc = {
    'id': id,
    'content': {
        'firstname': 'Kévin',
        'lastname': 'Masseix',
        'jobTitle': 'Software architect',
        'presentation':
            "Hi, I'm a web software architect living in Paris and always up for new challenges."
            + "<br/><br/>I have a strong background working with search engines, mainly on the ELK stack since the 0.90 Elasticsearch version but also on Solr and Algolia."
            + "<br/><br/>I have an affinity with decentralized applications living 'on the edge' based on eventually consistent optimistic models and asynchronous processing."
            + "<br/><br/>I am actually looking for a new challenge, so feel free to contact me on LinkedIn or by email if you are looking for a software architect or a lead developer with a strong DevOps background :-)",
        'contact': {
            'email': 'masseix.kevin@gmail.com',
            'linkedin': 'https://www.linkedin.com/in/k%C3%A9vin-masseix-228a328b/'
        },
        'github': {
            'name': 'MKCG',
            'project': {
                'name': 'METIS',
                'licence': 'GPL 3.0',
                'language': 'ECMAScript 6'
            }
        },
        'skills': [
            'Domain Driven-Design',
            'Event souring',
            'CQRS',
            'Gherkin'
        ]
    }
};

searchEngine.indexDocument(id, doc, fields, facets);

```

#### Updating documents

Not implemented yet.


#### Deleting documents

Not implemented yet.



## Technical overview

### Tokenization

At the moment the tokenization is based on a simple regex but is expected to be replaced by a more dynamic solution to be able to apply stemming based on the defined index locale.


### Radix-Tree based prefix matching

When indexing a document, each token is inserted as a node or a leaf into a radix-tree with a depth of 3.  
During the searching phase, the last token of the query is used to retrieve documents ids associated to this token from the radix tree.


### Fuzzy matching

By default, fuzzy matching is based on bi-grams.


When indexing a document, each token is split into multiple bi-grams.  
Then each of those bi-grams is inserted as key into an array with the matching tokens as values.


During the searching phase, each searched token is split into bi-grams.  
Those bi-grams are then mapped to their associated tokens and those tokens are then reduced using a levenshtein distance using the searched token.


Finally, the reduced list of token is used to retrieve indexed document ids.


### Workers

Not implemented yet.


It is expected from the SearchEngineBuilder to be able to create javascript Web Workers when running on a compatible device to be able to perform indexing and search operation in background for a better UX experience.


## Roadmap

A new version is expected every two weeks on saturday night.


| Feature                    | Expected for |  Version  |
|----------------------------|--------------|-----------|
| Facet manager              | 2018-01-20   |  0.2      |
| Fuzzy search               | 2018-01-20   |  0.3      |
| Document Update / Delete   | 2018-01-27   |  0.4      |
| Sorting                    | 2018-01-27   |  0.5      |
| Index storage              | 2018-02-03   |  0.6      |
| Web Workers                | 2018-02-03   |  0.7      |
| Locales based tokenization | 2018-02-17   |  0.8      |
| Highlight                  | 2018-03-03   |  0.9      |
| Better suggest             | 2018-03-18*  |  1.0      |


* Don't expect me to work on St Patrick's day. Just don't.



## Contributing

Contributions will not be accepted before late February as I need the flexibility to make radical changes to the search engine algorithm during the first phase without impacting any other user contribution. However feel free to critizice any choice or to ask for any feature.

After this first phase, any contribution will be welcomed.
