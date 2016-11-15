## magda-convert-region-shapefiles

This is a simple node.js script that takes TerriaJS `regionMapping.json` and a directory full of the corresponding shapefiles for the region types and:

* Creates a GeoJSON-ish file for each region type.  The files contain an array of features, one per region, rather than the FeatureCollection you might see in a "real" GeoJSON file.  These files are meant to be used with the magda-metadata ElasticSearch engine.
* Outputs the region configuration for copy/pasting into magda-metadata's application.conf.

To run it, you first need the region shapefiles.  These can be obtained from the `/mnt/data/regionmap/shape_files` directory on the `geoserver.nationalmap.nicta.com.au` server.  Copy them to, e.g., `~/regions`.

Then, run something like:

```
node index.js ~/github/nationalmap/wwwroot/data/regionMapping.json ~/regions ./out
```

The optional last parameter specifies the directory in which to create the output GeoJSON-ish files.

Once done, copy the `geojson` files to S3 using (you'll need a terria AWS profile with access to the terria AWS account):

```
aws --profile terria s3 cp ./out/ s3://magda-files --recursive
```

And update the magda-metadata application.conf file with the `regionSources` written to the console.

