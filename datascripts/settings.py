#!/bin/env python

# the destination CSV and TopoJSON files which we will generate
OUTPUT_CTATOPOJSON = "../static/data/cta.json"
OUTPUT_INCIDENCECSV = "../static/data/cancerincidence.csv"
OUTPUT_DEMOGCSV = "../static/data/demographics.csv"
OUTPUT_COUNTYCSV = "../static/data/counties_by_cta.csv"
OUTPUT_CITYCSV = "../static/data/cities_by_cta.csv"

# the downloadable ZIP files; one of all data, and for each CTA Zone
# all ZIP files will have a readme file added for credits, disclaimer, metadata
DOWNLOADS_DIR = "../static/downloads"
DOWNLOADZIP_READMEFILE = "./inputs/readme.txt"

MASTER_ZIPFILE_FILENAME = "all_zones.zip"
MASTER_CSV_FILENAME = "all_zones.csv"

PERCTA_ZIPFILES_FILENAME = "zone_{}.zip"
PERCTA_CSV_FILENAME = "zone_{}.csv"

TEMP_CTASHPFILE = './tempfiles/CTAZones_Download.shp'

# in the downloaded ZIP files, a CSV field will be a URL
# to link back to this website zoomed to a CTA Zone
WEBSITE_URL = "https://www.example.com"

# CTA Zones shapefile, and which fields to use from it
INPUT_ZONESFILE = "./inputs/CTAZones.shp"
CTAZONES_SHAPEFILE_IDFIELD = "Zones_CA11"
CTAZONES_SHAPEFILE_NAMEFIELD = "ZoneName"
REPROJECTED_ZONESFILE = "./tempfiles/ctazones.shp"

# the XLSX spreadsheets for demographics and for cancer incidence
# what's the XLS file to use, and what's the name of the worksheet?
INPUT_CANCERXLS = "./inputs/IncidenceByCTAZone.xlsx"
INPUT_CANCERXLS_SHEETNAME = "5-yr incidence rates"

INPUT_DEMOGSXLS = "./inputs/DemographicsByCTAZone.xlsx"
INPUT_DEMOGXLS_SHEETNAME = 'Sheet1'

# Census Designated Places shapefile and the County shapefile
# used for the CTA-to-City and CTA-to-County CSV lookup CSVs
INPUT_COUNTYBOUNDS_SHP = "./inputs/tl_2019_us_county.shp"
INPUT_COUNTYBOUNDS_SHP_LAYERNAME = "tl_2019_us_county"
COUNTYBOUNDS_NAMEFIELD = "NAME"
REPROJECTED_COUNTY_SHP = "./tempfiles/counties.shp"

INPUT_CITYBOUNDS_SHP = "./inputs/tl_2019_06_place.shp"
INPUT_CITYBOUNDS_SHP_LAYERNAME = "tl_2019_06_place"
CITYBOUNDS_NAMEFIELD = "NAME"
REPROJECTED_CITY_SHP = "./tempfiles/cities.shp"

# TopoJSON settings for simplifying, quantizing coordinates, and rounding coordiate decimals
SIMPLIFY = "20%"
QUANTIZE = "1e5"
LATLNGPRECISION = 0.0001

# other constants and calculations
SQMETERS_TO_ACRES = 0.000247105
