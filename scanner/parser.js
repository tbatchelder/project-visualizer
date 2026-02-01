const fs = require('fs');

function parseFile(filePath) {
	const code = fs.readFileSync(filePath, 'utf8');

	const imports = [];
	const exports = [];

	// -----------------------------
	// IMPORTS (same as before)
	// -----------------------------
	const importRegex = /import .* from ['"](.*)['"]/g;
	let match;

	while ((match = importRegex.exec(code))) {
		imports.push(match[1]);
	}

	// -----------------------------
	// EXPORTS (new robust parser)
	// -----------------------------

	// 1. Named exports: export function foo, export const bar, etc.
	const named = code.matchAll(/export\s+(function|const|class|type|interface)\s+(\w+)/g);
	for (const m of named) {
		exports.push({
			kind: m[1],
			name: m[2],
		});
	}

	// 2. Default exports with identifiers: export default Foo;
	const defaultId = code.matchAll(/export\s+default\s+(\w+)/g);
	for (const m of defaultId) {
		exports.push({
			kind: 'default',
			name: m[1],
		});
	}

	// 3. Default exports with function/class (named or anonymous)
	const defaultFn = code.matchAll(/export\s+default\s+(async\s+)?(function|class)\s+(\w+)?/g);
	for (const m of defaultFn) {
		exports.push({
			kind: 'default',
			name: m[3] || '(anonymous)',
		});
	}

	// 4. Re-exports: export { Foo, Bar }
	const reexports = code.matchAll(/export\s+\{([^}]+)\}/g);
	for (const m of reexports) {
		const names = m[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0]);

		for (const name of names) {
			exports.push({
				kind: 'reexport',
				name,
			});
		}
	}

	// 5. Star re-exports: export * from './utils'
	const star = code.matchAll(/export\s+\*\s+from\s+['"](.*)['"]/g);
	for (const m of star) {
		exports.push({
			kind: 'star',
			from: m[1],
		});
	}

	return { imports, exports };
}

module.exports = { parseFile };
