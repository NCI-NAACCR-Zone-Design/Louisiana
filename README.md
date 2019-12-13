## Westat Cancer Mapping Template

This is a template for web developers to set to a website of cancer statistics like at https://www.californiahealthmaps.org/

This is not a turnkey product with a 5-minute installer. It is a starting place for a web developer to set up a cancer mapper, and to begin customizing their own website.


## Overview

### Prerequisites

You need the **NVM** and **Yarn** command-line tools installed.

You need to set up a Github repository where this will be hosted. The repository may be private. It must have Github Pages enabled and set to serve from the `docs/` directory (not the `gh-pages` branch).

You need a shapefile of the cancer zones. GDA DETAILS AND REVIEW

You need your demographics dataset, giving statistics for each zone. GDA DETAILS AND REVIEW

You need a spreadsheet of cancer statistics, giving statistics for each zone. GDA DETAILS AND REVIEW


### Getting Started

Visit https://github.com/GreenInfo-Network/Westat-Cancer-Template Download and unpack the latest release ZIP file.

Open your command-line tools and `cd` into the directory.

Select the appropriate Node version: `nvm use`

Install dependencies: `yarn -i`

Start the Webpack development web server: `npm run start` This will run a web server at http://localhost:8181/ where you can see your website under developments.

Edit the files under `src/` as needed. See the rest of this document for details on the types of changes you will want to make.

See the `datascripts/` folder for details on integrating your own data. GDA DETAILS AND REVIEW

When your site is all set up, deploy it!


### Deploying Your Website

This is designed to work with Github Pages, serving from the `docs/` sub-folder. Make sure that you have set up a Github repository and Github Pages appropriately.

Run `npm run build` to compile the source files into their browser-ready versions under `docs/` for Github Pages. Then commit and push as usual. As a convenience, the command `npm run deploy` will do this in a single step.


## Details on Data and Editing

### Integrating Your Own Data

GDA DETAILS AND REVIEW


### Editing the Site

GDA DETAILS AND REVIEW
