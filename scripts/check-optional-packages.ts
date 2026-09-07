#!/usr/bin/env node

/**
 * Checks that the built plugin needs none of the syntax packages a project may lack.
 *
 * The four custom syntaxes are devDependencies; the plugin reaches only `postcss-scss`'s tokenizer, lazily. A static import once kept the plugin from loading, and a source scan misses import shapes, so the property is checked: `dist/` is loaded in a project holding every dependency and none of the four. A second project is then given `postcss-scss` where Stylelint reaches it and the plugin cannot, and an SCSS declaration with an inline comment is linted with `--fix`: the rules pass it over, where the CSS tokenizer would write a line break into the comment.
 */

import { execFileSync } from "node:child_process"
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import process, { stderr, stdout } from "node:process"

const ROOT = path.resolve(import.meta.dirname, `..`)

/** A property parted from its colon by an inline comment, which only `postcss-scss` reads. */
const SCSS_STYLESHEET = `a { b //x:y\n: red; }\n`

/**
 * Lints one stylesheet with the built plugin.
 * @param project - The project holding the plugin.
 * @param directory - The stylesheet's directory.
 * @param from - Where Stylelint runs, and looks the syntax up.
 * @returns The stylesheet as the fix left it.
 */
function lint (project: string, directory: string, from: string): string {
	let stylesheet = path.join(directory, `a.scss`)
	let script = `
		import { readFileSync } from "node:fs"

		import stylelint from "stylelint"

		await stylelint.lint({
			files: ${JSON.stringify(stylesheet)},
			fix: true,
			config: {
				plugins: [${JSON.stringify(path.join(project, `plugin`, `index.js`))}],
				customSyntax: "postcss-scss",
				rules: { "@stylistic/scss/declaration-colon-newline-after": "always" },
			},
		})

		process.stdout.write(JSON.stringify(readFileSync(${JSON.stringify(stylesheet)}, "utf8")))
	`

	return JSON.parse(execFileSync(`node`, [`--input-type=module`, `-e`, script], { cwd: from, encoding: `utf8` })) as string
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

let manifest = JSON.parse(readFileSync(path.join(ROOT, `package.json`), `utf8`)) as { dependencies: Record<string, string>, devDependencies: Record<string, string>, peerDependencies: Record<string, string> }
let optional = Object.keys(manifest.devDependencies).filter((name) => name.startsWith(`postcss-`))
let project = mkdtempSync(path.join(tmpdir(), `stylelint-stylistic-`))

try {
	let modules = path.join(project, `node_modules`)

	for (let name of [...Object.keys(manifest.dependencies), ...Object.keys(manifest.peerDependencies)]) link(modules, name)

	cpSync(path.join(ROOT, `dist`), path.join(project, `plugin`), { recursive: true })

	let loaded = execFileSync(`node`, [`--input-type=module`, `-e`, `import(${JSON.stringify(path.join(project, `plugin`, `index.js`))}).then(({ default: plugins }) => { process.stdout.write(String(plugins.length)) })`], { encoding: `utf8` })

	if (Number(loaded) === 0) throw new Error(`The plugin loaded no rules in a project holding none of ${optional.join(`, `)}`)

	stdout.write(`\t📦 ${loaded} rules load in a project holding none of ${optional.join(`, `)}\n`)

	// `postcss-scss` beside the stylesheet, out of the plugin's chain
	let beside = path.join(project, `beside`)

	mkdirSync(beside, { recursive: true })
	link(path.join(beside, `node_modules`), `postcss-scss`)
	writeFileSync(path.join(beside, `a.scss`), SCSS_STYLESHEET)

	let read = lint(project, beside, beside)

	if (read !== `a { b //x:y\n:\n red; }\n`) throw new Error(`The tokenizer standing beside the stylesheet was not reached: ${JSON.stringify(read)}`)

	stdout.write(`\t📦 the tokenizer of a syntax is reached from the stylesheet it parsed\n`)

	// `postcss-scss` where only Stylelint finds it
	let apart = path.join(project, `apart`)
	let runner = path.join(project, `runner`)

	mkdirSync(apart, { recursive: true })
	mkdirSync(runner, { recursive: true })
	link(path.join(runner, `node_modules`), `postcss-scss`)
	writeFileSync(path.join(apart, `a.scss`), SCSS_STYLESHEET)

	let untouched = lint(project, apart, runner)

	if (untouched !== SCSS_STYLESHEET) throw new Error(`A stylesheet was rewritten where the plugin could not reach the tokenizer its syntax is read by: ${JSON.stringify(untouched)}`)

	stdout.write(`\t📦 a declaration is passed over where the tokenizer of its syntax is out of reach\n`)
}
catch (error) {
	stderr.write(`${(error as Error).message}\n`)
	process.exitCode = 1
}
finally {
	rmSync(project, { recursive: true, force: true })
}
