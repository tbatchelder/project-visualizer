function buildProjectJson(projectName, level, files) {
	return {
		projectName,
		level,
		files,
	};
}

module.exports = { buildProjectJson };
