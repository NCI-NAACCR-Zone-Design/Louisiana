## Westat Cancer Mapping Template

This is a template for web developers to set to a website of cancer statistics like at https://www.californiahealthmaps.org/

This is not a turnkey product with a 5-minute installer. It is a starting place for a web developer to set up a cancer mapper, and to begin customizing their own website.

See the project on Github at https://github.com/GreenInfo-Network/Westat-Cancer-Template

See a demonstration at https://greeninfo-network.github.io/Westat-Cancer-Template/


## Overview

### Prerequisites

You need the **NVM** and **Yarn** command-line tools installed. To check, run `yarn --version` and `nvm --version`

You need to set up a Github repository where this will be hosted. The repository may be private. It must have Github Pages enabled and set to serve from the `docs/` directory (not the `gh-pages` branch).

You need a shapefile of the CTA Zones. See the *Integrating Your Own Data* section of this document which describes data details and a provided example file.

You need your demographics dataset, giving statistics for each zone. See the *Integrating Your Own Data* section of this document which describes data details and a provided example file.

For those demographics data, you may find it helpful to have a list of all what demographic fields exist and how you would like them labelled.

You need a spreadsheet of cancer incidence statistics, giving statistics for each zone. See the *Integrating Your Own Data* section of this document which describes data details and a provided example file.

For those cancer incidence statistics, you may find it helpful to have a list of all domain values for the Sex, Years

You need a shapefile of county boundaries for your state. A good source is ftp://ftp2.census.gov/geo/tiger/TIGER2019/COUNTY/

You need a shapefile of city/CDP boundaries for your state. A good source is You need a shapefile ftp://ftp2.census.gov/geo/tiger/TIGER2019/PLACE/


### Getting Started

Visit https://github.com/GreenInfo-Network/Westat-Cancer-Template Download and unpack the latest release ZIP file.

Open your command-line tools and `cd` into the directory.

Select the appropriate Node version: `nvm use`

Install dependencies: `yarn -i`

Start the Webpack development web server: `npm run start` This will run a web server at http://localhost:8181/ where you can see your website under development.

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

* *tl_2019_XX_place.shp* -- Shapefile of census designated places, used to create a CSV of which cities/towns intersect each CTA Zone.
  * The provided version was downloaded from ftp://ftp2.census.gov/geo/tiger/TIGER2019/PLACE/ The FTP site names the files by the state's FIPS code, e.g. California is FIPS code *06*.
  * This should be provided in WGS84 (plain lat-lon) SRS.
  * Relevant attributes are as follows:
    * `PLACEFP` -- The FIPS code for this county. Used as a unique ID. If you use a different field name, edit the `CITYBOUNDS_IDFIELD` setting in `settings.py`.
    * `NAME` -- The name of the city/place. If you use a different field name, edit the `CITYBOUNDS_NAMEFIELD` setting in `datascripts/settings.py`
* *tl_2019_us_county.shp* -- Shapefile of counties, used to create a CSV of which counties intersect each CTA Zone.
  * This should be provided in WGS84 (plain lat-lon) SRS.
  * The provided version was downloaded from ftp://ftp2.census.gov/geo/tiger/TIGER2019/COUNTY/ The FTP site has one county file for all of the United States, and you will need to crop it to your state.
  * The following attributes are used (see `settings.py`) and others are ignored:
    * `COUNTYFP` -- The FIPS code for this county. Used as a unique ID. If you use a different field name, edit the `COUNTYBOUNDS_IDFIELD` setting in `settings.py`.
    * `NAME` -- The name of the county. If you use a different field name, edit the `COUNTYBOUNDS_NAMEFIELD` setting in `datascripts/settings.py`
* *IncidenceByCTAZone.xlsx* -- Excel spreadsheet providing cancer incidence data.
  * One row per combination of CTA Zone X Sex X Site X Time Frame.
  * The `Zones` field is used as the CTA Zones' unique ID to tie to other data (demographics, boundary).
  * The special `Zone` name *Statewide* should be used to indicate statewide data. Other values such as "California" or "LA" will not be recignozed as Statewide!
  * The worksheet to use is defined in `settings.py` in the `INPUT_CANCERXLS_SHEETNAME` setting. If you get an error that the worksheet doesn't exist, check this setting.
  * The fields must be named as follows, and in this sequence:
    * `ID` -- a unique ID for this row, not really used and OK to just enter anything. Do not leave this blank, as this would look like a blank row and be skipped.
    * `sex` -- Domain value for filtering by sex.
    * `cancer` -- Domain value for filtering by cancer site.
    * `years` -- Domain value for filtering by time frame.
    * `Zones` -- CTA Zone ID, correspnding to a CTA Zone in the CTA Zones shapefile.
    * `W_PopTot` -- the PopTot, Cases, AAIR, LCI, and UCI are repeated for each Race option W, B, H, A
    * `W_Cases`
    * `W_AAIR`
    * `W_LCI`
    * `W_UCI`
    * `B_PopTot`
    * `B_Cases`
    * `B_AAIR`
    * `B_LCI`
    * `B_UCI`
    * `H_PopTot`
    * `H_Cases`
    * `H_AAIR`
    * `H_LCI`
    * `H_UCI`
    * `A_PopTot`
    * `A_Cases`
    * `A_AAIR`
    * `A_LCI`
    * `A_UCI`
    * `PopTot` -- Total population for AAIR calculation purposes
    * `Cases` -- Number of cases of this cancer site + sex + time in this CTA Zone
    * `AAIR` -- Age-adjusted incidence rate of this cancer site + sex + time in this CTA Zone
    * `LCI` -- Lower end of confidence interval (LCI) for the AAIR
    * `UCI` -- Upper end of confidence interval (UCI) for the AAIR
* *DemographicsByCTAZone.xlsx* -- Demographic statistics source file, Excel spreadsheet.
  * One row per CTA Zone.
  * The `Zone` field is used as the CTA Zones' unique ID to tie to other data (demographics, boundary).
  * The special `Zone` name *Statewide* should be used to indicate statewide data. Other values such as "California" or "LA" will not be recignozed as Statewide!
  * The worksheet to use is defined in `settings.py` in the `INPUT_DEMOGXLS_SHEETNAME` setting. If you get an error that the worksheet doesn't exist, check this setting.
  * The set of fields will vary, and you will need to make some edits:
    * Edit `make_demogcsv.py` to validate your fields, and also to copy them into the output CSV.
    * Edit `aggregateDemographicData()` in `make_downloadables.py` to define what fields are placed in the downloadable CSV and ZIP files.
* *CTAZones.shp* -- CTA Zones shapefile, providing boundaries for the map.
  * This should be provided in WGS84 (plain lat-lon) SRS.
  * Relevant attributes are as follows, and other fields will be ignored:
    * `Zone` -- CTA Zone's unique ID, used to tie to other data (demogs, incidence). If you use a different feld name, edit the `CTAZONES_SHAPEFILE_IDFIELD` setting in `settings.py`.
    * `ZoneName` -- CTA Zone's name for display. If you use a different feld name, edit the `CTAZONES_SHAPEFILE_NAMEFIELD` setting in `settings.py`.
* *readme.txt* -- This file will be included in each of the downloadable ZIP files. This would be suitable as metadata such as a data dictionary, a disclaimer, credits, etc.
  * Depending on your demographic statistics, you probably want to edit this.

The scripts are written for Python 3, and are as follows. It is recommended that they be run in this order.

* `python3 make_ctageofile.py` -- Creates `static/data/cta.json` which is the TopoJSON file providing CTA Zone boundaries for the map.
* `python3 make_demogcsv.py` -- Creates `static/data/demographics.csv` which provides demographics for each CTA Zone.
* `python3 make_incidencecsv.py` -- Creates `static/data/cancerincidence.csv` which provides incidence for each CTA Zone.
* `python3 make_countygeofile.py` -- Creates `static/data/countybounds.json` which is the TopoJSON file providing county boundaries for the map.
* `python3 make_placescsv.py` -- Creates `static/data/counties_by_cta.csv` and `static/data/cities_by_cta.csv` which provide a list of places intersecting each CTA Zone.
* `python3 make_downloadables.py` -- Creates the downloadable ZIP files under `static/downloads/`.

If you get errors that some Python module is missing, install them via `pip3 install -r requirements.txt`

Some settings may be adjsted in `settings.py` such as the URL of your website.

After running all of them, be sure to run `npm run build` to update the web server so your new files will show up.


### Changing Data Filtering Options

The filtering options available for Sex, Cancer Site, Race/Ethnicity, and Time Range may need adjustment to fit your own data, if have a different set of options for these filters, or if you use different domain values for these fields.

The filter options may be defined in `index.js` by the `SEARCHOPTIONS_CANCERSITE`, `SEARCHOPTIONS_RACE`, `SEARCHOPTIONS_SEX`, and `SEARCHOPTIONS_TIME` options.

Some cancers may be specific to a single sex, e.g. uterine cancer does not occur in males, nor prostate in females. To address these cases, see the `CANCER_SEXES` setting. If a cancer site is selected which only applies to one sex, that sex will be automaticaly selected if that cancer is selected. If a sex is selected, then invalid cancer site options for that sex will be disabled.


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

#### Controlling Which Fields Appear

The functions `aggregateIncidenceData()` and `aggregateDemographicData()` will read the incidence dataset and the demographic dataset, and will perform various massage/correction to the data, and will rename fields for the purpose of putting them in the output files.

The function `csvHeaderRow()` defines the sequence of fields as they appear in the CSV. All fields here must be the fields created in `aggregateIncidenceData()` and `aggregateDemographicData()` However, it is *not required* that every field in `aggregateIncidenceData()` and `aggregateDemographicData()` be used in the final, downloadable CSVs.

#### The Readme File

All generated ZIP files will include the `datascripts/readme.txt` file. This would be suitable as metadata such as a data dictionary, a disclaimer, credits, etc.

#### Website URL

The CSVs contain a `URL` field, which is a hyperlink to the website with that CTA Zone automatically selected. The URL used is the `WEBSITE_URL` setting in `settings.py`

#### Other Notes

* The website's CSVs and JSON files under `static/data/` are the source for the content of the ZIP files. As such, it is recommended that `make_downloadables.py` be run *after* the other scripts which update those website files.
* Don't forget to run `npm run build` after running `make_downloadables.py`, so your new files will show up in the website.


### Adding or Changing Demographic Data

If you want to add or change the demographic fields, the following checklist outlines the required updates. Most of these are covered elsewhere within this document.

* The new demographics XLSX with the new fields: `datascripts/inputs/DemographicsByCTAZone.xlsx`
  * The `Zone` field contains the CTA Zone ID, which must match those in the CTA Zones shapefile and incidence spreadsheets.
* The data-prep script at `datascripts/make_demogcsv.py` will need modifications in three places:
  * to validate the fields,
  * to write the CSV's header row,
  * and to write out the data rows.
* The data-prep script at `datascripts/make_downloadables.py` will be used to re-create new downloadable CSVs and ZIPs, and you probably need to make some changes:
  * Edit `aggregateDemographicData()` to reflect your demographic fields, as well as any data formatting, handling of no-data values, or other formatting.
  * Edit `csvHeaderRow()` to put the massaged/formatted field into the final output CSV.
  * Optional: Edit the `inputs/readme.txt` file which describes the fields.
* Optional: Edit `DEMOGRAPHIC_TABLES` to display the demographic field in the tables below the map.
  * Formatting of the values is controlled by the `format` option. See formatFieldValue() for a list of supported format types.
* Optional: Edit `CHOROPLETH_OPTIONS` to offer the demographic field as a choropleth map option.
  * Formatting of the values when displayed in the legend, is controlled by the `format` option. See formatFieldValue() for a list of supported format types.
