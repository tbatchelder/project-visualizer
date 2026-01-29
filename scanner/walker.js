// scanner/walker.js

const fs = require('fs');
const path = require('path');
const {
	ignoreFolders,
	ignoreFiles,
	ignoreExtensions,
	allowedExtensions,
	ignorePatterns,
} = require('./ignore');

function shouldIgnoreFile(fileName) {
	const ext = path.extname(fileName);

	// Ignore specific filenames
	if (ignoreFiles.includes(fileName)) return true;

	// Ignore extensions not in allowed list
	if (!allowedExtensions.includes(ext)) return true;

	// Ignore extensions explicitly blocked
	if (ignoreExtensions.includes(ext)) return true;

	// Ignore simple patterns
	for (const pattern of ignorePatterns) {
		if (fileName.includes(pattern)) return true;
	}

	return false;
}

function walk(dir, fileList = []) {
	const items = fs.readdirSync(dir);

	for (const item of items) {
		const full = path.join(dir, item);
		const stat = fs.statSync(full);

		// Ignore folders
		if (stat.isDirectory()) {
			if (ignoreFolders.includes(item)) continue;
			walk(full, fileList);
			continue;
		}

		// Ignore files
		if (shouldIgnoreFile(item)) continue;

		fileList.push(full);
	}

	return fileList;
}

module.exports = { walk };
