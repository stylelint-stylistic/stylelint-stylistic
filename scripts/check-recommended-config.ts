#!/usr/bin/env node

/**
 * Checks that the recommended preset is reached from a project the way a configuration names it: by the package's `recommended` subpath in `extends`.
 *
 * The tests extend the preset as an object, with the plugin loaded from source, so what they cannot see is the way from the string to the built module: the `exports` entry of `package.json`, the module `dist/configs/recommended.js` and the package name the preset lists in `plugins`, resolved from inside the package. The built package is installed under `node_modules` of a project, and a stylesheet of each syntax is linted from there: plain CSS in a project holding none of the syntax packages, since an `overrides` entry whose files the project has none of loads nothing, then an SCSS and a Less file beside those packages, each read by the namespace's copies and refused by no core name.
 */

import { execFileSync } from "node:child_process"
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import process, { stderr, stdout } from "node:process"

const ROOT = path.resolve(import.meta.dirname, `..`)

/** The package as a configuration names it, and the preset as `extends` names it. */
const PACKAGE = `@stylistic/stylelint-plugin`
const PRESET = `${PACKAGE}/recommended`

/** The warning the core's copy of a rule reports over a stylesheet its syntax refuses. */
const REFUSAL = `does not read a stylesheet parsed with this syntax`

/** What one lint reads of a result. */
type Read = {
	rules: string[],
	texts: string[],
	invalid: string[],
	parseErrors: number,
}

/**
 * Lints one stylesheet from a project, extending the preset by its subpath.
 * @param project - The project, where Stylelint runs and resolves the preset from.
 * @param file - The stylesheet's path.
 * @returns The rules that reported, their texts, the option warnings and the parse error count.
 */
function lint (project: string, file: string): Read {
	let script = `
		import stylelint from "stylelint"

		let { results } = await stylelint.lint({ files: ${JSON.stringify(file)}, config: { extends: [${JSON.stringify(PRESET)}] } })
		let [result] = results

		process.stdout.write(JSON.stringify({
			rules: result.warnings.map(({ rule }) => rule),
			texts: result.warnings.map(({ text }) => text),
			invalid: result.invalidOptionWarnings.map(({ text }) => text),
			parseErrors: result.parseErrors.length,
		}))
	`

	return JSON.parse(execFileSync(`node`, [`--input-type=module`, `-e`, script], { cwd: project, encoding: `utf8` })) as Read
}

/**
 * Symlinks a package of the checkout into a project's `node_modules`.
 * @param modules - The `node_modules` directory.
 * @param name - The package to link, as `node_modules` names it.
 */
function link (modules: string, name: string): void {
	let target = path.join(ROOT, `node_modules`, name)
	let placed = path.join(modules, name)

	mkdirSync(path.dirname(placed), { recursive: true })
	symlinkSync(target, placed, `dir`)
}

/**
 * Lays a project out: the built package installed under its name, every dependency of the checkout it needs beside it, and the syntax packages asked for.
 * @param root - Where the project is laid out.
 * @param syntaxes - The syntax packages the project holds.
 * @returns The project's directory.
 */
function layOut (root: string, syntaxes: string[]): string {
	let manifest = JSON.parse(readFileSync(path.join(ROOT, `package.json`), `utf8`)) as { dependencies: Record<string, string>, peerDependencies: Record<string, string> }
	let modules = path.join(root, `node_modules`)
	let installed = path.join(modules, PACKAGE)

	for (let name of [...Object.keys(manifest.dependencies), ...Object.keys(manifest.peerDependencies), ...syntaxes]) link(modules, name)

	mkdirSync(installed, { recursive: true })
	cpSync(path.join(ROOT, `package.json`), path.join(installed, `package.json`))
	cpSync(path.join(ROOT, `dist`), path.join(installed, `dist`), { recursive: true })

	return root
}

/**
 * Checks one lint against what the preset says of the stylesheet.
 * @param read - What the lint read.
 * @param rules - The rules expected to report, and no other.
 * @param what - The stylesheet, for the message.
 * @throws {Error} Where a rule, a refusal, an option warning or a parse error was not expected.
 */
function expect (read: Read, rules: string[], what: string): void {
	if (read.parseErrors > 0) throw new Error(`${what} was not parsed: ${read.parseErrors} parse errors`)
	if (read.invalid.length > 0) throw new Error(`${what} met an option the preset sets and a rule refuses: ${read.invalid.join(`; `)}`)
	if (read.texts.some((text) => text.includes(REFUSAL))) throw new Error(`${what} was refused by a core name: ${read.texts.join(`; `)}`)
	if (read.rules.join(`,`) !== rules.join(`,`)) throw new Error(`${what} was reported by ${JSON.stringify(read.rules)} rather than by ${JSON.stringify(rules)}`)
}

let sandbox = mkdtempSync(path.join(tmpdir(), `stylelint-stylistic-config-`))

try {
	// Plain CSS in a project holding none of the syntax packages
	let plain = layOut(path.join(sandbox, `plain`), [])

	writeFileSync(path.join(plain, `a.css`), `a {\n\tcolor: #FFF;\n}\n`)
	expect(lint(plain, path.join(plain, `a.css`)), [`@stylistic/color-hex-case`], `A CSS file in a project holding no syntax package`)

	stdout.write(`\t🧩 the preset is reached by "${PRESET}"\n\t   and reads a CSS file in a project holding no syntax package\n`)

	// Each preprocessor beside its package, read under its namespace
	let preprocessed = layOut(path.join(sandbox, `preprocessed`), [`postcss-scss`, `postcss-less`])

	writeFileSync(path.join(preprocessed, `a.scss`), `a {\n\tb: 1PX; // c\n}\n`)
	writeFileSync(path.join(preprocessed, `a.less`), `a {\n\tb: 1PX; // c\n}\n`)
	expect(lint(preprocessed, path.join(preprocessed, `a.scss`)), [`@stylistic/scss/unit-case`], `An SCSS file`)
	expect(lint(preprocessed, path.join(preprocessed, `a.less`)), [`@stylistic/less/unit-case`], `A Less file`)

	stdout.write(`\t🧩 an SCSS and a Less file are read by the namespace's copies and refused by no core name\n`)
}
catch (error) {
	stderr.write(`${(error as Error).message}\n`)
	process.exitCode = 1
}
finally {
	rmSync(sandbox, { recursive: true, force: true })
}
