# SimpleBook Extension for MediaWiki

SimpleBook is a MediaWiki Extension for rendering a collection of wiki
pages as a PDF with a table of contents.  It was motivated by the
printing needs of the [Torque Sites](https://github.com/OpenTechStrategies/torque-sites) project.

SimpleBook a simplified fork of the [Collection](https://www.mediawiki.org/wiki/Special:ExtensionDistributor/Collection) extension.  Collection
had many features that we didn't need, and for the enhancements that
we needed to make, we found that it would be easiest to pare down
Collection and then add them to the core that remains.

Please read over the [original documentation for the Collection Plugin](docs/COLLECTION_README.rst) as a companion document to this readme.

## Repository Structure

This repository houses:

* The SimpleBook plugin, which makes up the majority of the files
* `services/api` - a flask API which is used to interact with the node puppeteer service.
* `services/api/mw2pdf` - a NodeJS script invoked by the flask API.


## Prerequeisites

This plugin requires the following:

* PHP with cURL support
* Node.js (v14)
* Yarn
* Python (v3.7)
* Pipenv
* Redis (at `localhost:6379`)

## Installation

From the project root

*Install python packages*
```
cd services/api
pipenv install
cd ../../
```

*Install node packages*
```
cd services/api/mw2pdf
yarn install
cd ../../../
```

## Running

In order for the plugin to work you will need to install it to your wiki and also run the flask service.

### Running the flask service

From project root

```
cd services/api
pipenv run flask run --port=3333
```

### Running the queue workers

Page rendering occurs through queue workers, which needs to be run in parallel to the flask application.

From project root

```
cd services/api
pipenv run rq worker
```

## Contact
We always welcome questions, ideas, issues, and patches, to both code
and documentation.  You can reach us here or in the `Book Printing
stream`_ in our Zulip chat server.
