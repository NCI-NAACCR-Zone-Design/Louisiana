## Westat Cancer Mapping Template

This is a template for web developers to set to a website of cancer statistics like at https://www.californiahealthmaps.org/

This is not a turnkey product with a 5-minute installer. It is a starting place for a web developer to set up a cancer mapper, and to begin customizing their own website.


## Overview

### Prerequisites

You need the **NVM** and **Yarn** command-line tools installed. To check, run `yarn --version` and `nvm --version`

You need the Mapshaper CLI and GDAL/OGR CLI tools installed. To check, run `mapshaper -version` and `ogr2ogr --version`

You need to set up a Github repository where this will be hosted. The repository may be private. It must have Github Pages enabled and set to serve from the `docs/` directory (not the `gh-pages` branch).

You need a shapefile of the cancer zones. See the *Integrating Your Own Data* section of this document which describes data details and a provided example file.

You need your demographics dataset, giving statistics for each zone. See the *Integrating Your Own Data* section of this document which describes data details and a provided example file.

You need a spreadsheet of cancer statistics, giving statistics for each zone. See the *Integrating Your Own Data* section of this document which describes data details and a provided example file.


### Getting Started

Visit https://github.com/GreenInfo-Network/Westat-Cancer-Template Download and unpack the latest release ZIP file.

Open your command-line tools and `cd` into the directory.

Select the appropriate Node version: `nvm use`

Install dependencies: `yarn -i`

Start the Webpack development web server: `npm run start` This will run a web server at http://localhost:8181/ where you can see your website under developments.

Edit the files under `src/` as needed. See the rest of this document for details on the types of changes you will want to make.

See the `datascripts/` folder for details on integrating your own data. GDA DETAILS AND REVIEW

Remember that you will need to run `npm run build` after changing static files such as data files or the favicon.

When your site is all set up, deploy it!


### Deploying Your Website

This is designed to work with Github Pages, serving from the `docs/` sub-folder. Make sure that you have set up a Github repository and Github Pages appropriately.

Run `npm run build` to compile the source files into their browser-ready versions under `docs/` for Github Pages. Then commit and push as usual. As a convenience, the command `npm run deploy` will do this in a single step.


## Configuring, Editing, and Integrating Your Data

### Integrating Your Own Data

The `datascripts/` folder has some tools written in Python for importing your own data.

The sample files provided in `datascripts/inputs/` were used to set up the template demo, and may be a useful reference.

* *DemographicsByCTAZone.xlsx* -- Demographic statistics source file, Excel spreadsheet.
  * One row per CTA Zone.
  * The `Zone` field is used as the CTA Zones' unique ID to tie to other data (demographics, boundary).
  * The special `Zone` name *Statewide* should be used to indicate statewide data.
  * GDA TBD note here about potential `DEMOGRAPHICS_TABLE` structure and how these fields may be made visible in the Demographics table.
  * GDA TBD note here about potential `CHOROPLETH_OPTIONS` structure and how these fields may be used as options for choropleth maps.
* *IncidenceByCTAZone.xlsx* -- Excel spreadsheet providing cancer incidence data.
  * One row per combination of CTA Zone X Sex X Site X Time Frame.
  * The `Zones` field is used as the CTA Zones' unique ID to tie to other data (demographics, boundary).
  * The special `Zone` name *Statewide* should be used to indicate statewide data.
  * GDA TBD note here about potential `SEARCH_CANCERSITES` structure and how one would configure their set of cancer sites.
  * GDA TBD note here about potential `SEARCH_DATERANGES` structure and how one would configure their set of date ranges as a search filter.
  * GDA TBD note here about potential `CHOROPLETH_OPTIONS` structure and how these fields may be used as options for choropleth maps.
* *CTAZones.shp* -- CTA Zones shapefile, providing boundaries for the map.
  * This should be provided in WGS84 (plain lat-lon) SRS.
  * Relevant attributes are as follows:
    * `Zone` -- CTA Zone's unique ID, used to tie to other data (demogs, incidence)
    * `ZoneName` -- CTA Zone's name for display
* *tl_2019_06_place.shp* -- Shapefile of census designated places, used to create a CSV of which cities/towns intersect each CTA Zone.
  * This should be provided in WGS84 (plain lat-lon) SRS.
  * The provided version was downloaded from ftp://ftp2.census.gov/geo/tiger/TIGER2019/PLACE/ then cropped to those areas which intersect any CTA Zone. A second, manual clipping was also done to remove those which only intersect accidentally at edges.
  * Relevant attributes are as follows:
    * `NAME` -- The name of the county. See also the `CITYBOUNDS_NAMEFIELD` setting in `datascripts/settings.py`
* *tl_2019_us_county.shp* -- Shapefile of counties, used to create a CSV of which counties intersect each CTA Zone.
  * This should be provided in WGS84 (plain lat-lon) SRS.
  * The provided version was downloaded from ftp://ftp2.census.gov/geo/tiger/TIGER2019/COUNTY/ then cropped to those areas which intersect any CTA Zone. A second, manual clipping was also done to remove those which only intersect accidentally at edges.
  * Relevant attributes are as follows:
    * `NAME` -- The name of the county. See also the `COUNTYBOUNDS_NAMEFIELD` setting in `datascripts/settings.py`
* *readme.txt* -- This file will be included in each of the downloadable ZIP files. This would be suitable as metadata such as a data dictionary, a disclaimer, credits, etc.

The scripts are written for Python 3, and are as follows. It is recommended that they be run in this order.

* `python3 make_ctageofile.py` -- Creates `static/data/cta.json` which is the TopoJSON file providing CTA Zone boundaries for onto the map.
* `python3 make_demogcsv.py` -- Creates `static/data/demographics.csv` which provides demographics for each CTA Zone.
* `python3 make_incidencecsv.py` -- Creates `static/data/cancerincidence.csv` which provides incidence for each CTA Zone.
* `python3 make_placescsv.py` -- Creates `static/data/counties_by_cta.csv` and `static/data/cities_by_cta.csv` which provide a list of places intersecting each CTA Zone.
* `python3 make_downloadables.py` -- Creates the downloadable ZIP files under `static/downloads/`.

If you get errors that some Python module is missing, install them via `pip3 install -r requirements.txt`

Some settings may be adjsted in `settings.py` such as the URL of your website.

After running all of them, be sure to run `npm run build` to update the web server so your new files will show up.


### Changing Data Filtering Options

The filtering options available for Sex, Cancer Site, Race/Ethnicity, and Time Range may need adjustment to fit your own data, if have a different set of options for these filters, or if you use different domain values for these fields.

The filter options may be defined in `index.js` by the `SEARCHOPTIONS_CANCERSITE`, `SEARCHOPTIONS_RACE`, `SEARCHOPTIONS_SEX`, and `SEARCHOPTIONS_TIME` options.


### Cosmetic and Look-and-Feel

* *Browser title bar* -- Look in `src/index.html` for the `title`.

* *Footer, credits, and citation* -- Look in `src/index.html` for the `footer`.

* *Favicon* -- Replace `/static/favicon.png` with an appropriate image. Don't forget to `npm run build`.

* *Introductory text/logo/navbar* -- Look in `src/index.html` for the `intro-text` section.

* *Map starting view* -- Look in `src/index.js` for the definition of `MAP_BBOX` which defines lat-lng coordinates for `[[south, west], [north, east]]` The website http://bboxfinder.com is very useful here. *Note that the actual bounding box viewed depends on a lot of factors such as the size of the browser window, so the map view may not be precisely what you want and may not be the same on different displays.*

* *Google Analytics* -- Look in `src/index.html` for a `script` tag pointing at *www.googletagmanager.com* Fill in your UA code _in two places_ here.

* *Bing API Key* -- Look in `src/index.html` for the definition of `BING_API_KEY` Until you set this, you will not be able to search for addresses. A Bing Maps API key is free, and their terms of use are quite flexible. See https://docs.microsoft.com/en-us/bingmaps/getting-started/bing-maps-dev-center-help/getting-a-bing-maps-key for more information.

* *About this Project* -- Look in `src/index.html` for the `learn-about`.

* *Methodology* -- Look in `src/index.html` for the `learn-method`.

* *FAQs* -- Look in `src/index.html` for the `learn-faq`.

* *Glossary* -- Look in `src/index.html` for the `learn-glossary`.

* *Tooltip i icons* -- Within `src/index.html` you may create tooltip I icons, with HTML such as this: `<i class="fa fa-info-circle" aria-hidden="true" data-tooltip="yourtermhere"></i>` The tooltip HTML for each such tooltip, is provided in `tooltip_contents` Each DIV has a `data-tooltip` attribute corresponding to the `data-tooltip` used in the `<i>` element.


### Customizing Data Download ZIP Files

The downloadable ZIP files are created by the `datascripts/make_downloadables.py` script.

The functions `aggregateIncidenceData()` and `aggregateDemographicData()` will read the incidence dataset and the demographic dataset, and will perform various massage/correction to the data, and will rename fields for the purpose of putting them in the output files.

The function `csvHeaderRow()` defines the sequence of fields as they appear in the CSV. All fields here must be the fields created in `aggregateIncidenceData()` and `aggregateDemographicData()` However, it is *not required* that every field in `aggregateIncidenceData()` and `aggregateDemographicData()` be used in the final, downloadable CSVs.

Lastly, note that all ZIP files will include the `datascripts/readme.txt` file. This would be suitable as metadata such as a data dictionary, a disclaimer, credits, etc.

Also important:
* The website's CSVs and JSON files under `static/data/` are the source for the content of the ZIP files. As such, it is recommended that `make_downloadables.py` be run *after* the other scripts which update those website files.
* Don't forget to run `npm run build` after running `make_downloadables.py`, so your new files will show up in the website.
