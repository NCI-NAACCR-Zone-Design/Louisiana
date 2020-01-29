# Cancer Mapping Template

This is a template for web developers to set up a website of cancer statistics like at https://www.californiahealthmaps.org/

This is not a turnkey product with a 5-minute installer. It is a starting place for a web developer to set up a cancer mapper, and to begin customizing their own website.

See the project on Github at https://github.com/NCI-NAACCR-Zone-Design/Cancer-Map-Template/

See a demonstration at https://nci-naaccr-zone-design.github.io/Cancer-Map-Template/


## Prerequisites

You need the **NVM** and **Yarn** command-line tools installed. To check, run `yarn --version` and `nvm --version`

You will need Python 3 in order to run the data-preparation scripts under `datascripts/`. To check, run `python3 --version` and `pip3 -version`

You will need the OSGEO/GDAL module for Python 3. To check, run `python3 -c 'from osgeo import ogr; print("OK")'` If it is not installed on your system, you will need to install GDAL and then Python's GDAL package. To install GDAL, see https://trac.osgeo.org/gdal/wiki/DownloadingGdalBinaries for recommended packages for various operating systems, including Mac and Windows. To install the Python library, run `pip3 install GDAL`

You need to set up a Github repository where this will be hosted. The repository may be private. It must have Github Pages enabled and set to serve from the `docs/` directory (not the `gh-pages` branch).

You need a shapefile of the CTA Zones. See the *Integrating Your Own Data* section of this document which describes data details and a provided example file.

You need your demographics dataset, giving statistics for each zone. See the *Integrating Your Own Data* section of this document which describes data details and a provided example file.

For those demographics data, you may find it helpful to have a list of all what demographic fields exist and how you would like them labelled.

You need a spreadsheet of cancer incidence statistics, giving statistics for each zone. See the *Integrating Your Own Data* section of this document which describes data details and a provided example file.

For those cancer incidence statistics, you may find it helpful to have a list of all domain values for the Sex, Years

You need a shapefile of county boundaries for your state. A good source is ftp://ftp2.census.gov/geo/tiger/TIGER2019/COUNTY/

You need a shapefile of city/CDP boundaries for your state. A good source is You need a shapefile ftp://ftp2.census.gov/geo/tiger/TIGER2019/PLACE/



## Getting Started

Visit https://github.com/GreenInfo-Network/Westat-Cancer-Template Download and unpack the latest release ZIP file.

Note: If you are using a Mac and you choose to move files out of that folder into some other folder, there are files starting with a `.` and these will not be visible in Mac's Finder by default. Use Command+Shift+Dot to show these files, or use the Console instead.

Open your command-line tools and `cd` into the directory.

Select the appropriate Node version: `nvm use`

Install dependencies: `yarn -i`

Start the Webpack development web server: `npm start` This will run a web server at http://localhost:8181/ where you can see your website under development.

The package comes with a working dataset to serve as a demonstration and example. After a brief overview of the code, your next step will be to integrate your own data.



## Overview of Directory Structure and Development

### Directory Structure

The `datascripts/` folder has scripts used when integrating your own data and updating it.

The `src/` directory contains the source code files, including the settings for what fields to expect in your demographic and incidence CSVs, the text/HTML that displays, and calculations and map controls. Later on in this document are some task-oriented tips on how you would make edits to your website.

The `static/data/` directory contains the data files that power the website: the CTA Zones geodata file, the incidence and demographics CSVs, the county reference overlay, and so on.

The `static/downloads/` directory, contains content accessed via the *Download* button on the website.

The rest of the `src/static/` directory is where you should put other static content such as images, logos, and your favicon.

### Development

Program code under `src/` is written in ECMAScript 2017 and SASS, and compiled using Babel, Webpack, et al.

The command `npm start` will start Webpack's development server at http://localhost:8181/ and will open a browser window for you as well.

The command `npm run build` will copy static assets and compiled code into the `docs/` directory, where it may be deployed to Github Pages as your website. You will need to do this every time you change the content of `static/`, including replacing images or loading new data.

While using the Webpack development server, making edits to `src/` will automatically recompile your application and reload the web page. **However, changes to `static/` will not trigger this**. After replacing a logo, for example, you must run `npm run build` and reload the page.

Again, **do not forget to do `npm run build`** after making changes the content of `static/`, including replacing images or loading new data.

### Deployment

The intended workflow for deployment, is Github Pages serving from the `docs/` sub-folder. Make sure that you have set up a Github repository and set up its Github Pages settings appropriately.

The command `npm run build` will compile the source files and static assets into their browser-ready versions under `docs/`. You may then commit and push as usual.

As a convenience, the command `npm run deploy` will do this in a single step: do a `npm run build`, then a `git commit` with a default message, then a `git push`.



## Integrating Your Own Data

Again, **do not forget to do `npm run build`** after making changes the content of `static/`, including replacing images or loading new data.

### Demographics Data

Verify the field and data requirements:
* The `Zone` field is used as the CTA Zones' unique ID to tie to other data (incidence, boundary).
* The special `Zone` name *Statewide* should be used to indicate statewide data. Other values such as "California" or "LA" or "All" will not be recognized as Statewide.

Copy your demographics CSV into `static/data/demographics.csv`

Edit `index.js` and set up `DEMOGRAPHIC_TABLES` to display the demographic data into the tables below the map. This defines a set of tables, what fields to display in each table, and how to label the fields and format their values (adding commas, rounding to 1 decimal, etc.).

Edit `index.js` and set up `CHOROPLETH_OPTIONS` to offer demographics as a Color By option for the choropleth map.

Again, **do not forget to do `npm run build`** after making changes the content of `static/`, including replacing images or loading new data.

### Incidence Data

Verify the field and data requirements:
* The `Zone` field is used as the CTA Zones' unique ID to tie to other data (demographics, boundary).
* The special `Zone` name *Statewide* should be used to indicate statewide data. Other values such as "California" or "LA" or "All" will not be recognized as Statewide.
* The `Sex` field is domain values, and is used for filtering.
* The `Cancer` field is domain values, and is used for filtering.
* The `Years` field is domain values, and is used for filtering.
* The incidence data fields `Cases` `AAIR` `LCI` `UCI` and `PopTot` are used for reporting incidence and are required.
* The same incidence fields must be defined for each race filter that you will define, and must be prefixed by the race's "short version". For example, If you use `W` as a domain value for race then that race will be reported using these fields: `W_Cases` `W_AAIR` `W_LCI` `W_UCI` `W_PopTot`.

Copy your cancer incidence CSV into `static/data/cancerincidence.csv`

Edit `index.js` and set up `SEARCHOPTIONS_CANCERSITE` to match your dataset's domain values.

Edit `index.js` and set up `SEARCHOPTIONS_SEX` to match your dataset's domain values.

Edit `index.js` and set up `SEARCHOPTIONS_TIME` to match your dataset's domain values.

Edit `index.js` and set up `SEARCHOPTIONS_RACE` to match your dataset's domain values.

If any of the cancer site options will be specific to one sex, edit `index.js` and set up `CANCER_SEXES` to auto-select that sex if that cancer site is selected.

Again, **do not forget to do `npm run build`** after making changes the content of `static/`, including replacing images or loading new data.

### CTA Zones Geodata

Place your CTA Zones shapefile into `datascripts/inputs/` as `CTAZones.shp`.

This should be provided in WGS84 (plain lat-lon) SRS.

Relevant attributes are as follows. Other fields will be ignored.
* `Zone` -- CTA Zone's unique ID, used to tie to other data (demogs, incidence).
* `ZoneName` -- CTA Zone's name for display.

Run `python3 make_ctageofile.py`. Ths will create `static/data/cta.json` which is the TopoJSON file providing CTA Zone boundaries for the map.

Again, **do not forget to do `npm run build`** after making changes the content of `static/`, including replacing images or loading new data.

### County Boundaries Geodata

A recommended county boundaries dataset may be had from ftp://ftp2.census.gov/geo/tiger/TIGER2019/COUNTY/ The FTP site has one county file for all of the United States, and you will need to crop it to your state using the `STATEFP` field.

Place your county boundaries shapefile into `datascripts/inputs/` as `counties.shp`.

This should be provided in WGS84 (plain lat-lon) SRS.

Relevant attributes are as follows. Other fields will be ignored.
* `COUNTYFP` -- The FIPS code for this county. Used as a unique ID.
* `NAME` -- The name of the county.

Run `python3 make_countygeofile.py` to create `static/data/countybounds.json` which is the TopoJSON file providing county boundaries for the map.

Again, **do not forget to do `npm run build`** after making changes the content of `static/`, including replacing images or loading new data.

### City / Place Boundaries Geodata

A recommended city/CDP boundaries dataset may be had from ftp://ftp2.census.gov/geo/tiger/TIGER2019/PLACE/ The FTP site names the files by the state's FIPS code, e.g. California is FIPS code *06*.

Place your city/CDP boundaries shapefile into `datascripts/inputs/` as `cities.shp`.

This should be provided in WGS84 (plain lat-lon) SRS.

Relevant attributes are as follows. Other fields will be ignored.
* `PLACEFP` -- The FIPS code for this county. Used as a unique ID.
* `NAME` -- The name of the city/place.

After both the counties and places datasets are in place, run `python3 make_placescsv.py` to create `static/data/counties_by_cta.csv` and `static/data/cities_by_cta.csv` which provide a list of places intersecting each CTA Zone.

Again, **do not forget to do `npm run build`** after making changes the content of `static/`, including replacing images or loading new data.

### Creating Downloadable Files

The files offered by the Download button, are static ZIP files containing CSV extracts of merged demographic and incidence data.

Edit `datascripts/make_downloadables.py` and define what demographic and incidence fields should be present in the downloadable content accessed by the Download button.
* The function `aggregateDemographicData()` will read the demographic dataset and is where you can massage/correct/format the data for the downloadable CSVs, as well as rename the fields as they appear in the download CSVs.
* The function `aggregateIncidenceData()` does simialrly, for the incidence data, massaging and formatting values and renaming them for the download CSVs.
* The function `csvHeaderRow()` defines the sequence of fields as they appear in the final download CSV. All fields here must be the fields created in `aggregateIncidenceData()` and/or `aggregateDemographicData()` but it is not required that every field defined be used here.

Edit the `datascripts/inputs/readme.txt` file to describe the CSV fields, and to include the name of your website or project as needed. This file will be included in all of the downloadable ZIP files, and is suitable for metadata such as a data dictionary, a disclaimer, and credits/attributions.

Run `python3 make_downloadables.py` to compile the downloadable ZIP files under `static/downloads/`.

Again, **do not forget to do `npm run build`** after making changes the content of `static/`, including replacing images or loading new data.

### Rebuilding For The Website

Lastly, be sure to run `npm run build` to update the files as seen by the web server.

Again, **do not forget to do `npm run build`** after making changes the content of `static/`, including replacing images or loading new data.



## Further Customizations

### HTML Site/Registry Name and Statistics

The file `src/index.html` contains a boilerplate version of site copy, with several places where you will want to enter the name of your website/registry/project, statistical thresholds and values, and so on.

Search for the `[REPLACE` string throughout `src/index.html` and replace the values mentioned there. Some are simple values amenable to simple search-and-replace, but most are narrative text that may require more involvement.

A list of such replacements is:
* `[REPLACE STATE/REGISTRY]` -- The name of your state, project, or cancer registry. Commonly used with the phrase "Cancer Maps" after it, indicating the name of this website. A simple search-and-replace should work here.
* `[REPLACE NUM_CANCER_SITES]` -- The number of cancer sites by which data may be searched. Usually the same as the number of `SEARCHOPTIONS_CANCERSITE` entries.
* `[CONFIRM RACE LIST]` -- A list of the races/ethnicities by which data may be searched. This should reflect the `SEARCHOPTIONS_RACE` entries.
* `[REPLACE NUM_ZONES]` -- The number of CTA Zones used for the analysis.
* `[REPLACE MINIMUM ZONE POPULATION]` -- The minimum population of a CTA Zone. Used in a statement describing CTA Zones.
* `[REPLACE MAXIMUM ZONE POPULATION]` -- The maximum population of a CTA Zone. Used in a statement describing CTA Zones.
* `[REPLACE MINIMUM TRACTS PER ZONE]` -- The minimum number of census tracts forming any CTA Zone. Used in a statement describing CTA Zones.
* `[REPLACE MAXIMUM TRACTS PER ZONE]` -- The maximum number of census tracts forming any CTA Zone. Used in a statement describing CTA Zones.
* `[REPLACE REPORTING MIN CASES]` -- The minimum number of cancer cases in a CTZ Zone, to be reported.
* `[REPLACE REGISTRY WEBSITE]` -- A hyperlink URL to this website's parent agency, cancer registry, etc., in the FAQ.
* `[REPLACE FUNDING URL]` -- A hyperlink URL to the agency which funded this website. Displayed in the FAQ alongside the FUNDING SOURCE.
* `[REPLACE FUNDING SOURCE]` -- A statement/description of who funded the website. Displayed in the FAQ alongside the FUNDING URL.
* `[REPLACE ABOUT BLURB]` -- A statement/description of the website, in "What is the XXX Registry" section of the FAQ.
* `[REPLACE CITATION INFO]` -- A statement/description of how this website should be cited in literature.

Since this is free-form narrative text, you may choose to rewrite or rephrase whole blocks of text, in addition to or instead of making the string replacements suggested above.


### Other HTML Content, Cosmetic Changes, Look-and-Feel

* *Browser title bar* -- Look in `src/index.html` for the `title`.

* *Footer, credits, and citation* -- Look in `src/index.html` for the `footer`.

* *Favicon* -- Replace or change the refgerence to `/static/favicon.png` with an appropriate image. Don't forget to `npm run build`. The `/static` directory includes several boilerplate logos if desired.

* *Introductory text/logo/navbar* -- Look in `src/index.html` for the `intro-text` section. The `/static` directory includes several boilerplate logos if desired.

* *Map starting view* -- Look in `src/index.js` for the definition of `MAP_BBOX` which defines lat-lng coordinates for `[[south, west], [north, east]]` The website http://bboxfinder.com is very useful here. *Note that the actual bounding box viewed depends on a lot of factors such as the size of the browser window, so the map view may not be precisely what you want and may not be the same on different displays.*

* *Google Analytics* -- Look in `src/index.html` for a `script` tag pointing at *www.googletagmanager.com* Fill in your UA code _in two places_ here.

* *Bing API Key* -- Look in `src/index.html` for the definition of `BING_API_KEY` Until you set this, you will not be able to search for addresses. A Bing Maps API key is free, and their terms of use are quite flexible. See https://docs.microsoft.com/en-us/bingmaps/getting-started/bing-maps-dev-center-help/getting-a-bing-maps-key for more information.

* *About This Project* -- Look in `src/index.html` for the `learn-about`.

* *Methodology* -- Look in `src/index.html` for the `learn-method`.

* *FAQs* -- Look in `src/index.html` for the `learn-faq`.

* *Glossary* -- Look in `src/index.html` for the `learn-glossary`.

* *Tooltip i icons* -- Within `src/index.html` you may create tooltip I icons, with HTML such as this: `<i class="fa fa-info-circle" aria-hidden="true" data-tooltip="yourtermhere"></i>` The tooltip HTML for each such tooltip, is provided in `tooltip_contents` Each DIV has a `data-tooltip` attribute corresponding to the `data-tooltip` used in the `<i>` element. For the Demographics table, be sure to cross reference to the `DEMOGRAPHICS_TABLE` element in `src/index.js`.

### Downloadable Data Files

* *readme.txt* -- See `datascripts/readme.txt`
