const path = require('path');
const fs = require('fs');

// Creaete the data storage folders
const dataRoot = path.join(__dirname, '..', 'data');
const levelFolders = ['L1', 'L2', 'L3', 'L4', 'N'];

// Ensure /data exists
if (!fs.existsSync(dataRoot)) fs.mkdirSync(dataRoot);

// Ensure each level folder exists
for (const lvl of levelFolders) {
	const lvlPath = path.join(dataRoot, lvl);
	if (!fs.existsSync(lvlPath)) fs.mkdirSync(lvlPath);
}

// Import the main workhorses
const { walk } = require('./walker');
const { parseFile } = require('./parser');
const { buildProjectJson } = require('./builder');

// Obtain the scanner  parameters
const folder = process.argv[2];
const projectName = process.argv[3];
const level = process.argv[4] || 'L1';

if (!folder || !projectName) {
	console.error('Usage: node scanner/index.js <folder> <projectName> [level]');
	process.exit(1);
}

// Make the project folder
const projectFolder = path.join(dataRoot, level, projectName);

if (!fs.existsSync(projectFolder)) {
	fs.mkdirSync(projectFolder);
}

// Scan the project
const absFolder = path.resolve(folder);
const allFiles = walk(absFolder);

const parsedFiles = allFiles.map(filePath => {
	const { imports, exports } = parseFile(filePath);

	return {
		path: path.relative(absFolder, filePath).replace(/\\/g, '/'),
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

// Next version
const existingFiles = fs
	.readdirSync(projectFolder)
	.filter(f => f.endsWith('.json'))
	.sort();

let nextVersion = 0;

if (existingFiles.length > 0) {
	const lastFile = existingFiles[existingFiles.length - 1];
	const lastVersion = parseInt(lastFile.replace('.json', ''), 10);
	nextVersion = lastVersion + 1;
}

const versionString = String(nextVersion).padStart(4, '0');

// Write the versioned data
const output = buildProjectJson(projectName, level, parsedFiles);

const outputPath = path.join(projectFolder, `${versionString}.json`);
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

// Update the project listing
const indexFile = path.join(dataRoot, 'projects.json');
let index = [];

if (fs.existsSync(indexFile)) {
	const raw = fs.readFileSync(indexFile, 'utf8').trim();

	if (raw.length > 0) {
		try {
			index = JSON.parse(raw);
		} catch (err) {
			console.warn('Warning: projects.json was invalid. Resetting index.');
			index = [];
		}
	}
}

index = index.filter(p => p.name !== projectName);

index.push({
	name: projectName,
	level,
	path: `${level}/${projectName}`,
	latestVersion: nextVersion,
});

fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));

console.log('Saved:', outputPath);
