// scanner/ignore.js

module.exports = {
	// Folders to skip entirely
	ignoreFolders: [
		'node_modules',
		'.git',
		'dist',
		'build',
		'.next',
		'coverage',
		'.vscode',
		'images',
	],

	// Specific filenames to skip
	ignoreFiles: ['README.md', '.DS_Store', 'Thumbs.db', 'package-lock.json'],

	// File extensions to skip
	ignoreExtensions: [
		'.md',
		'.png',
		'.jpg',
		'.jpeg',
		'.gif',
		'.svg',
		'.css',
		'.scss',
		'.json', // except your output JSON
	],

	// Allowed source-code extensions
	allowedExtensions: ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'],

	// Simple pattern ignores (not regex yet)
	ignorePatterns: ['.test.', '.spec.', '.config.'],
};
