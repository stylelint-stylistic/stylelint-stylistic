#!/usr/bin/env node

/**
 * Checks that the build left something loadable in `dist/`: `dist/index.js`
 * must export the plugin array, and it must hold at least one rule.
 *
 * `make build` runs it right after `tsc`, so a build that produced nothing
 * is answered by `build` itself rather than by the first target that loads
 * `dist/` (`packages-check`, `config-check`, `verify`).
 */

import path from "node:path"
import { stderr, stdout } from "node:process"
import { pathToFileURL } from "node:url"

const ROOT = path.resolve(import.meta.dirname, `..`)

let loaded: { "default": unknown } | undefined

try {
	loaded = await import(pathToFileURL(path.join(ROOT, `dist`, `index.js`)).href)
}
catch (error) {
	stderr.write(`\t❌ dist/index.js did not load: ${(error as Error).message}\n`)
	process.exitCode = 1
}

if (loaded !== undefined) {
	let plugins = loaded.default

	if (!Array.isArray(plugins) || plugins.length === 0) {
		stderr.write(`\t❌ dist/index.js exports no plugin\n`)
		process.exitCode = 1
	}
	else {
		stdout.write(`\t📦 dist/index.js loads ${plugins.length} plugins\n`)
	}
}
