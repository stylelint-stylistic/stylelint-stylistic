let packages = new Set([
	`@eslint-community/eslint-utils`,
	`@typescript-eslint/utils`,
])

function readPackage (pkg) {
	if (packages.has(pkg.name) && pkg.peerDependencies) delete pkg.peerDependencies.eslint

	return pkg
}

export default { hooks: { readPackage } }
