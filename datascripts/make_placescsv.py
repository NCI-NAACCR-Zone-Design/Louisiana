#!/bin/env python3

from osgeo import ogr
import os
import csv

import settings


class PlacesIntersector:
    def run(self):
        print("PlacesIntersector")

        self.reproject()
        self.findplaces(settings.REPROJECTED_CITY_SHP, settings.OUTPUT_CITYCSV, 'City')
        self.findplaces(settings.REPROJECTED_COUNTY_SHP, settings.OUTPUT_COUNTYCSV, 'County')

    def reproject(self):
        print("    Reproject")

        print("        {}  => {}".format(settings.INPUT_ZONESFILE, settings.REPROJECTED_ZONESFILE))

        for ext in ['shp', 'shx', 'dbf', 'prj']:  # delete the target shapefile
            basename = os.path.splitext(settings.REPROJECTED_ZONESFILE)[0]
            if os.path.exists("{}.{}".format(basename, ext)):
                os.unlink("{}.{}".format(basename, ext))

        command = "ogr2ogr -t_srs epsg:3310 -sql 'SELECT {} AS id, {} AS name FROM {}' {} {}".format(
            settings.CTAZONES_SHAPEFILE_IDFIELD, settings.CTAZONES_SHAPEFILE_NAMEFIELD,
            os.path.splitext(os.path.basename(settings.INPUT_ZONESFILE))[0],
            settings.REPROJECTED_ZONESFILE,
            settings.INPUT_ZONESFILE
        )
        # print(command)
        os.system(command)

        # reproject the SHP to Albers 3310 so we can do accurate area measurements
        # using an area threshold eliminates edge effects where a county/city intersects by 1 pixel
        print("        {}  => {}".format(settings.INPUT_CITYBOUNDS_SHP, settings.REPROJECTED_CITY_SHP))

        for ext in ['shp', 'shx', 'dbf', 'prj']:  # delete the target shapefile
            basename = os.path.splitext(settings.REPROJECTED_CITY_SHP)[0]
            if os.path.exists("{}.{}".format(basename, ext)):
                os.unlink("{}.{}".format(basename, ext))

        command = "ogr2ogr -t_srs epsg:3310 -sql 'SELECT {} AS name FROM {}' {} {}".format(
            settings.CITYBOUNDS_NAMEFIELD,
            settings.INPUT_CITYBOUNDS_SHP_LAYERNAME,
            settings.REPROJECTED_CITY_SHP,
            settings.INPUT_CITYBOUNDS_SHP
        )
        # print(command)
        os.system(command)

        # reproject the SHP to Albers 3310 so we can do accurate area measurements
        # using an area threshold eliminates edge effects where a county/city intersects by 1 pixel
        print("        {}  => {}".format(settings.INPUT_COUNTYBOUNDS_SHP, settings.REPROJECTED_COUNTY_SHP))

        for ext in ['shp', 'shx', 'dbf', 'prj']:  # delete the target shapefile
            basename = os.path.splitext(settings.REPROJECTED_COUNTY_SHP)[0]
            if os.path.exists("{}.{}".format(basename, ext)):
                os.unlink("{}.{}".format(basename, ext))

        command = "ogr2ogr -t_srs epsg:3310 -sql 'SELECT {} AS name FROM {}' {} {}".format(
            settings.COUNTYBOUNDS_NAMEFIELD,
            settings.INPUT_COUNTYBOUNDS_SHP_LAYERNAME,
            settings.REPROJECTED_COUNTY_SHP,
            settings.INPUT_COUNTYBOUNDS_SHP
        )
        # print(command)
        os.system(command)

    def findplaces(self, placesdataset, csvfilename, placecolumnname):
        print("    Calculating {}  =>  {}".format(placesdataset, csvfilename))

        outfh = open(csvfilename, 'w')
        csvfh = csv.writer(outfh)
        csvfh.writerow(['Zone', placecolumnname])

        ctads = ogr.Open(settings.REPROJECTED_ZONESFILE, False)
        ctalayer = ctads.GetLayer(0)

        for cta in ctalayer:
            ctaid = cta.GetField('id')
            ctageom = cta.GetGeometryRef()

            places = []

            ds = ogr.Open(placesdataset, False)
            layer = ds.GetLayer(0)
            layer.SetSpatialFilter(ctageom)

            for thisplace in layer:
                # work around twitchy hands making false intersections
                # "% of CTA area" strategy doesn't work: small towns in large rural CTAs = small percentage
                # but a town sliver over X acres, well, that should count as intersecting the town
                # also, note that we collect names here and unique-ify them in a second step
                # multipolygon datasets means that a CTA may intersect the same place more than once!
                geom = thisplace.GetGeometryRef()
                iacres = geom.Intersection(ctageom).GetArea() * settings.SQMETERS_TO_ACRES

                if iacres < 2000:
                    continue

                name = thisplace.GetField('name')
                # print("            {}".format(name))
                places.append(name)

            ds = None  # close places dataset, will reopen at next CTA

            # done collecting: unique-ify the list, write the CSV rows
            places = list(set(places))
            for name in places:
                csvfh.writerow([ctaid, name])

        # done CTA loop, close geo fh and CSV fh
        ctads = None
        outfh.close()


if __name__ == '__main__':
    PlacesIntersector().run()
    print("DONE")
