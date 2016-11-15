const path = require('path');
const fs = require('fs');
const execFileSync = require('child_process').execFileSync;
const JSONStream = require('JSONStream');
const es = require('event-stream');

if (process.argv.length < 3) {
	console.log('Please specify the path to the shapefiles.  The output GeoJSON files will be written to the current working directory.');
	process.exit(1);
}

const files = fs.readdirSync(process.argv[2] || '.');
files.forEach(function(inputPath) {
	inputPath = path.join(process.argv[2], inputPath);
	const extension = path.extname(inputPath);
	if (!extension.match(/^.shp$/i)) {
		return;
	}

	console.log(inputPath);

	const withoutExtension = path.basename(inputPath, extension);
	const intermediateName = withoutExtension + '.work.geojson';
	const outputName = withoutExtension + '.geojson';

	execFileSync("ogr2ogr", ['-f', 'GeoJSON', intermediateName, inputPath]);

	fs.createReadStream(intermediateName)
		.pipe(JSONStream.parse('features.*'))
		.pipe(JSONStream.stringify())
		.pipe(fs.createWriteStream(outputName));

	fs.unlinkSync(intermediateName);
});
