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
	// State & cached DOM
	// -----------------------------
	let currentProjectName = null;
	let currentFilesByPath = null; // path -> file map for O(1) lookup
	const $ = (id) => document.getElementById(id);

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
		currentFilesByPath = new Map(data.files.map((f) => [f.path, f]));
		const tree = buildTree(data.files);

		const accordion = $('accordion');
		accordion.innerHTML = renderNode(name, tree);
		$('details-content').textContent = `Loaded project: ${name} (${data.level})`;
	}

	// Find file by path (O(1) via map built on load)
	function findFileInCurrentProject(path) {
		return currentFilesByPath ? currentFilesByPath.get(path) ?? null : null;
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

		$('details-content').textContent = text;
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

		$('details-content').textContent = text;
	}

	// -----------------------------
	// Accordion: single delegated click (folder toggle, file, export)
	// -----------------------------
	function setupAccordionDelegation() {
		$('accordion').addEventListener('click', (e) => {
			const fileEl = e.target.closest('.file[data-file]');
			if (fileEl) {
				e.stopPropagation();
				showFileDetails(fileEl.dataset.file);
				return;
			}
			const exportEl = e.target.closest('.export-item[data-export]');
			if (exportEl) {
				e.stopPropagation();
				showExportDetails(exportEl.dataset.export);
				return;
			}
			const folderSpan = e.target.closest('.folder > span');
			if (folderSpan) {
				e.stopPropagation();
				folderSpan.parentElement.classList.toggle('open');
			}
		});
	}

	// -----------------------------
	// Modal logic
	// -----------------------------
	function setupModal() {
		const modal = $('modal');
		const btn = $('instructionsBtn');
		const close = $('closeModal');

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
		const select = $('projectSelect');

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
		setupAccordionDelegation();
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
