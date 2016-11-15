'use strict';

const path = require('path');
const fs = require('fs');
const execFileSync = require('child_process').execFileSync;
const JSONStream = require('JSONStream');
const es = require('event-stream');

if (process.argv.length < 4) {
	console.log('<regionMapping.json path> <directory containing shapefiles> [GeoJSON output directory]');
	process.exit(1);
}

const regionMappingJsonPath = process.argv[2];
const shapefileDir = process.argv[3];
const outputDir = process.argv[4] || '.';

let conf = 'regionSources {\n';

const regionMapping = JSON.parse(fs.readFileSync(regionMappingJsonPath, 'UTF-8'));
const regionIDs = Object.keys(regionMapping.regionWmsMap).slice(10,12);

let next = 0;

function doNext() {
	const regionID = regionIDs[next++];
	if (!regionID) {
		conf += '}\n';
		console.log(conf);
		return;
	}
	const region = regionMapping.regionWmsMap[regionID];

	console.log('Processing ' + regionID);

	try {
		const inputPath = path.join(shapefileDir, region.layerName + '.shp');
		const intermediatePath = path.join(outputDir, regionID + '.work.geojson');
		const outputPath = path.join(outputDir, regionID + '.geojson');
		execFileSync("ogr2ogr", ['-f', 'GeoJSON', intermediatePath, inputPath]);

		const stream = fs.createReadStream(intermediatePath)
			.pipe(JSONStream.parse('features.*'))
			.pipe(JSONStream.stringify())
			.pipe(fs.createWriteStream(outputPath));

		stream.on('finish', function() {
			fs.unlinkSync(intermediatePath);

			conf += '  ' + regionID + ' {\n';
			conf += '    url = "https://s3-ap-southeast-2.amazonaws.com/magda-files/' + regionID + '.json"\n';
			conf += '    idField = "' + region.regionProp + '"\n';
			conf += '    shapePath = "geometry"\n';
			conf += '  }\n';

			doNext();
		});
	} catch(e) {
		console.error('Exception while processing ' + regionID + ':\n  ' + e.message);
	}
}

doNext();
