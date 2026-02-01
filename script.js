// Namespace
window.Util = window.Util || {};
Util.ProjectVisualizer = (() => {
	// -----------------------------
	// JSON Loaders
	// -----------------------------
	async function loadProjectIndex() {
		try {
			const res = await fetch('data/projects.json');
			if (!res.ok) return null; // file missing
			return await res.json();
		} catch {
			return null; // network or parse error
		}
	}

	// -----------------------------
	// State & cached DOM
	// -----------------------------
	let currentProjectName = null;
	let currentFilesByPath = null; // path -> file map for O(1) lookup
	const $ = id => document.getElementById(id);

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
	function loadProject(data) {
		console.log(data);
		currentProjectName = data.projectName;

		currentFilesByPath = new Map(data.files.map(f => [f.path, f]));
		const tree = buildTree(data.files);

		const accordion = $('accordion');
		accordion.innerHTML = renderNode(data.projectName, tree);

		$('details-content').textContent = `Loaded project: ${data.projectName} (${data.level})`;
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
      ${file.exports.length ? file.exports.map(e => e.name) : '(none)'}

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
					? file.exportedInterfaces
							.map(i => `${i.name} (used: ${i.used ? 'YES' : 'NO'})`)
							.join('\n')
					: '(none)'
			}

      Unused File: ${file.unused ? 'YES' : 'NO'}
          `;

		$('details-content').textContent = text;
	}

	// -----------------------------
	// Show export details (function/constant/class/type/interface)
	// -----------------------------
	function findFileInCurrentProject(path) {
		return currentFilesByPath ? (currentFilesByPath.get(path) ?? null) : null;
	}

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
		$('accordion').addEventListener('click', e => {
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
	async function setupDropdown() {
		const select = $('projectSelect');
		const index = await loadProjectIndex();

		if (!index || index.length === 0) {
			select.innerHTML = `<option value="">Scan a project first</option>`;
			return;
		}

		select.innerHTML =
			`<option value="">Select a project</option>` +
			index
				.map(
					p =>
						`<option value="${p.path}" data-version="${p.latestVersion}">
                  ${p.name} (${p.level})
              </option>`,
				)
				.join('');
	}

	function setupProjectSelection() {
		$('projectSelect').addEventListener('change', async e => {
			const option = e.target.selectedOptions[0];
			if (!option || !option.value) return;

			const folder = option.value; // e.g. "L2/myProject"
			const version = option.dataset.version.padStart(4, '0');
			const filePath = `data/${folder}/${version}.json`;

			const res = await fetch(filePath);
			const data = await res.json();

			loadProject(data);
		});
	}

	// -----------------------------
	// Public API
	// -----------------------------
	function init() {
		setupDropdown();
		setupProjectSelection();
		setupModal();
		setupAccordionDelegation();
	}

	return {
		init,
		// loadProject,
	};
})();

// Initialize after DOM loads
document.addEventListener('DOMContentLoaded', () => {
	Util.ProjectVisualizer.init();
});
