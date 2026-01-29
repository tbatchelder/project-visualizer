// Namespace
window.Util = window.Util || {};
Util.ProjectVisualizer = (() => {
	// -----------------------------
	// Mock project list (with level)
	// -----------------------------
	const PROJECT_LIST = [
		{ name: 'alphaProject', file: 'alphaProject.json', level: 'L2' },
		{ name: 'betaProject', file: 'betaProject.json', level: 'L1' },
		{ name: 'gammaProject', file: 'gammaProject.json', level: 'L2' },
	];

	// -----------------------------
	// Mock project data (Layer 2)
	// -----------------------------
	const PROJECT_DATA = {
		alphaProject: {
			projectName: 'alphaProject',
			level: 'L2',
			files: [
				{
					path: 'src/index.js',
					imports: ['src/utils.js'],
					exports: ['main'],
					unused: false,

					exportedFunctions: [{ name: 'main', used: true }],
					exportedConstants: [],
					exportedClasses: [],
					exportedTypes: [],
					exportedInterfaces: [],
				},
				{
					path: 'src/utils.js',
					imports: [],
					exports: ['helper', 'UNUSED_CONST'],
					unused: false,

					exportedFunctions: [{ name: 'helper', used: true }],
					exportedConstants: [{ name: 'UNUSED_CONST', used: false }],
					exportedClasses: [],
					exportedTypes: [],
					exportedInterfaces: [],
				},
			],
		},

		betaProject: {
			projectName: 'betaProject',
			level: 'L1',
			files: [
				{
					path: 'app/start.js',
					imports: [],
					exports: ['startApp'],
					unused: false,

					exportedFunctions: [{ name: 'startApp', used: true }],
					exportedConstants: [],
					exportedClasses: [],
					exportedTypes: [],
					exportedInterfaces: [],
				},
				{
					path: 'app/old.js',
					imports: [],
					exports: ['legacy'],
					unused: true,

					exportedFunctions: [{ name: 'legacy', used: false }],
					exportedConstants: [],
					exportedClasses: [],
					exportedTypes: [],
					exportedInterfaces: [],
				},
			],
		},

		gammaProject: {
			projectName: 'gammaProject',
			level: 'L2',
			files: [
				{
					path: 'main.js',
					imports: [],
					exports: ['run', 'UNUSED_TYPE'],
					unused: false,

					exportedFunctions: [{ name: 'run', used: true }],
					exportedConstants: [],
					exportedClasses: [],
					exportedTypes: [{ name: 'UNUSED_TYPE', used: false }],
					exportedInterfaces: [],
				},
			],
		},
	};

	// -----------------------------
	// State
	// -----------------------------
	let currentProjectName = null;

	// -----------------------------
	// Build folder tree from files
	// -----------------------------
	function buildTree(files) {
		const root = {};
		files.forEach(file => {
			const parts = file.path.split('/');
			let current = root;

			parts.forEach((part, index) => {
				const isFile = index === parts.length - 1;
				if (!current[part]) {
					current[part] = isFile ? { __file: true, ...file } : {};
				}
				current = current[part];
			});
		});
		return root;
	}

	// -----------------------------
	// Render export category block
	// -----------------------------
	function renderExportCategory(label, items, filePath, kind) {
		if (!items || !items.length) return '';

		const children = items
			.map(item => {
				const cls = item.used ? 'export-item' : 'export-item unused';
				const dataId = `${filePath}::${kind}::${item.name}`;
				return `<div class="${cls}" data-export="${dataId}">- ${item.name}</div>`;
			})
			.join('');

		return `
      <div class="folder export-category">
        <span>📂 ${label}</span>
        <div class="children">
          ${children}
        </div>
      </div>
    `;
	}

	// -----------------------------
	// Render a file node (with Layer 2 exports)
	// -----------------------------
	function renderFileNode(name, node) {
		const fileClass = node.unused ? 'file unused' : 'file';

		const exportsBlock = `
      <div class="children">
        ${renderExportCategory('Functions', node.exportedFunctions, node.path, 'function')}
        ${renderExportCategory('Constants', node.exportedConstants, node.path, 'constant')}
        ${renderExportCategory('Classes', node.exportedClasses, node.path, 'class')}
        ${renderExportCategory('Types', node.exportedTypes, node.path, 'type')}
        ${renderExportCategory('Interfaces', node.exportedInterfaces, node.path, 'interface')}
      </div>
    `;

		return `
      <div class="folder file-wrapper">
        <span class="${fileClass}" data-file="${node.path}">📄 ${name}</span>
        ${exportsBlock}
      </div>
    `;
	}

	// -----------------------------
	// Render generic node (folder or file)
	// -----------------------------
	function renderNode(name, node) {
		if (node.__file) {
			return renderFileNode(name, node);
		}

		const children = Object.keys(node)
			.map(child => renderNode(child, node[child]))
			.join('');

		return `
      <div class="folder">
        <span>📁 ${name}</span>
        <div class="children">${children}</div>
      </div>
    `;
	}

	// -----------------------------
	// Load a project
	// -----------------------------
	function loadProject(name) {
		currentProjectName = name;
		const data = PROJECT_DATA[name];
		const tree = buildTree(data.files);

		document.getElementById('accordion').innerHTML = renderNode(name, tree);

		// Folder toggles
		document.querySelectorAll('.folder > span').forEach(span => {
			span.addEventListener('click', e => {
				e.stopPropagation();
				span.parentElement.classList.toggle('open');
			});
		});

		// File clicks
		document.querySelectorAll('.file').forEach(fileEl => {
			fileEl.addEventListener('click', e => {
				e.stopPropagation();
				const path = fileEl.dataset.file;
				showFileDetails(path);
			});
		});

		// Export item clicks
		document.querySelectorAll('.export-item').forEach(expEl => {
			expEl.addEventListener('click', e => {
				e.stopPropagation();
				const id = expEl.dataset.export; // filePath::kind::name
				showExportDetails(id);
			});
		});

		document.getElementById('details-content').textContent =
			`Loaded project: ${name} (${data.level})`;
	}

	// -----------------------------
	// Find file by path in current project
	// -----------------------------
	function findFileInCurrentProject(path) {
		if (!currentProjectName) return null;
		const project = PROJECT_DATA[currentProjectName];
		return project.files.find(f => f.path === path) || null;
	}

	// -----------------------------
	// Show file details
	// -----------------------------
	function showFileDetails(path) {
		const file = findFileInCurrentProject(path);
		if (!file) return;

		const text = `
Path: ${file.path}

Imports:
${file.imports.length ? file.imports.join('\n') : '(none)'}

Exports:
${file.exports.length ? file.exports.join('\n') : '(none)'}

Exported Functions:
${
	file.exportedFunctions && file.exportedFunctions.length
		? file.exportedFunctions.map(f => `${f.name} (used: ${f.used ? 'YES' : 'NO'})`).join('\n')
		: '(none)'
}

Exported Constants:
${
	file.exportedConstants && file.exportedConstants.length
		? file.exportedConstants.map(c => `${c.name} (used: ${c.used ? 'YES' : 'NO'})`).join('\n')
		: '(none)'
}

Exported Classes:
${
	file.exportedClasses && file.exportedClasses.length
		? file.exportedClasses.map(c => `${c.name} (used: ${c.used ? 'YES' : 'NO'})`).join('\n')
		: '(none)'
}

Exported Types:
${
	file.exportedTypes && file.exportedTypes.length
		? file.exportedTypes.map(t => `${t.name} (used: ${t.used ? 'YES' : 'NO'})`).join('\n')
		: '(none)'
}

Exported Interfaces:
${
	file.exportedInterfaces && file.exportedInterfaces.length
		? file.exportedInterfaces.map(i => `${i.name} (used: ${i.used ? 'YES' : 'NO'})`).join('\n')
		: '(none)'
}

Unused File: ${file.unused ? 'YES' : 'NO'}
    `;

		document.getElementById('details-content').textContent = text;
	}

	// -----------------------------
	// Show export details (function/constant/class/type/interface)
	// -----------------------------
	function showExportDetails(id) {
		// id format: filePath::kind::name
		const [path, kind, name] = id.split('::');
		const file = findFileInCurrentProject(path);
		if (!file) return;

		let list = [];
		let label = '';

		switch (kind) {
			case 'function':
				list = file.exportedFunctions || [];
				label = 'Function';
				break;
			case 'constant':
				list = file.exportedConstants || [];
				label = 'Constant';
				break;
			case 'class':
				list = file.exportedClasses || [];
				label = 'Class';
				break;
			case 'type':
				list = file.exportedTypes || [];
				label = 'Type';
				break;
			case 'interface':
				list = file.exportedInterfaces || [];
				label = 'Interface';
				break;
		}

		const item = list.find(x => x.name === name);
		if (!item) return;

		const text = `
${label}: ${item.name}
File: ${file.path}
Used: ${item.used ? 'YES' : 'NO'}
    `;

		document.getElementById('details-content').textContent = text;
	}

	// -----------------------------
	// Modal logic
	// -----------------------------
	function setupModal() {
		const modal = document.getElementById('modal');
		const btn = document.getElementById('instructionsBtn');
		const close = document.getElementById('closeModal');

		btn.onclick = () => (modal.style.display = 'block');
		close.onclick = () => (modal.style.display = 'none');
		window.onclick = e => {
			if (e.target === modal) modal.style.display = 'none';
		};
	}

	// -----------------------------
	// Dropdown logic
	// -----------------------------
	function setupDropdown() {
		const select = document.getElementById('projectSelect');

		select.innerHTML =
			`<option value="">Select a project</option>` +
			PROJECT_LIST.map(p => `<option value="${p.name}">${p.name} (${p.level})</option>`).join('');

		select.addEventListener('change', () => {
			if (select.value) loadProject(select.value);
		});
	}

	// -----------------------------
	// Public API
	// -----------------------------
	function init() {
		setupDropdown();
		setupModal();
	}

	return {
		init,
		loadProject,
	};
})();

// Initialize after DOM loads
document.addEventListener('DOMContentLoaded', () => {
	Util.ProjectVisualizer.init();
});
