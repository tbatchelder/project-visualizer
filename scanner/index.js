const path = require('path');
const fs = require('fs');

const { walk } = require('./walker');
const { parseFile } = require('./parser');
const { buildProjectJson } = require('./builder');

const folder = process.argv[2];
const projectName = process.argv[3];
const level = process.argv[4] || 'L1';

if (!folder || !projectName) {
	console.error('Usage: node scanner/index.js <folder> <projectName> [level]');
	process.exit(1);
}

const absFolder = path.resolve(folder);
const allFiles = walk(absFolder);

const parsedFiles = allFiles.map(filePath => {
	const { imports, exports } = parseFile(filePath);

	return {
		path: path.relative(absFolder, filePath),
		imports,
		exports,
		unused: false, // computed later
		exportedFunctions: [],
		exportedConstants: [],
		exportedClasses: [],
		exportedTypes: [],
		exportedInterfaces: [],
	};
});

const output = buildProjectJson(projectName, level, parsedFiles);

const outputPath = path.join(__dirname, '..', 'data', `${projectName}.json`);
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log('Saved:', outputPath);
