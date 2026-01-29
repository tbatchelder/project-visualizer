const fs = require('fs');

function parseFile(filePath) {
	const code = fs.readFileSync(filePath, 'utf8');

	const imports = [];
	const exports = [];

	// Simple regex-based import detection (AST comes later)
	const importRegex = /import .* from ['"](.*)['"]/g;
	const exportRegex = /export (function|const|class|type|interface) (\w+)/g;

	let match;

	while ((match = importRegex.exec(code))) {
		imports.push(match[1]);
	}

	while ((match = exportRegex.exec(code))) {
		exports.push(match[2]);
	}

	return { imports, exports };
}

module.exports = { parseFile };
