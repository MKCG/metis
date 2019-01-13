# Metis
Named after the greek mythological Titaness, goddess of wisdom, Metis is  a fulltext search engine with facet capabilities, prefix matching and fuzzy matching.

It is a lightweight ECMAScript6 library which does not require any additional dependency.

However, as indexes are loaded in memory then its memory consumption might be heavy depending of the number of documents, their text length and the number of distinct words in it.

It is recommended to index less than a few thousands document for a good user experience : the less documents, the faster it is. First results seems to indicate that client-side search operations can be performed in a few milliseconds.


## Running environment

Metis has been created to enhance search engine usage on mobile-devices in offline mode.
Alternatively it can also be used server-side but you should not expect the same performance than Lucene-based alternatives.


## Functionalities

### Fulltext search

#### Fuzzy search

#### Prefix search

### Sorting algorithm

By default the sorting mechanism is using a homemade derived version of the popular TF/IDF algorithm usually used for fulltext sorting to save memory.

#### Locale support

### Aggregations

At the moment, only facets are supported.

#### Facets


## Getting started

### Search engine configuration

#### Searchable fields

#### Define the number of workers

#### Index storage configuration

#### Document storage configuration


### CRUD operations

#### Adding documents

#### Updating documents

#### Deleting documents


## Technical overview

### Tokenization

### Radix-Tree based prefix matching

### bi-gram based fuzzy matching
