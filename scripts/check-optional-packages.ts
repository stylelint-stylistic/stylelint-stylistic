#!/usr/bin/env -S node --experimental-strip-types --disable-warning=ExperimentalWarning

/**
 * Checks that the built plugin needs none of the syntax packages a project may not have.
 *
 * The four custom syntaxes are development dependencies: a project installs the one its own stylesheets are written in, and most install none. The plugin reads what their parsers hand over and never the parsers themselves — with one exception, the tokenizer of `postcss-scss`, which the reading of a declaration's colon asks for and which is therefore reached by name at the moment it is needed. A static import of it would keep the whole plugin from loading in every other project, which is what happened once and what no reading of the source has proved absent since: an import statement, a re-export, a dynamic import and a call at the top of a module all load a package as the module is loaded, and a scan of the text catches whichever shapes it was written for.
 *
 * So the property is checked rather than the spelling. The built `dist/` is put in a project holding every dependency the package declares and none of the four, and the plugin is loaded there. Then the same project is given a second one beside it that has `postcss-scss` — the shape of a workspace whose packages carry dependencies of their own, where Stylelint reaches the syntax from the configuration and the plugin cannot reach the tokenizer from itself — and an SCSS stylesheet whose declaration carries an inline comment is linted with the fix on: the rules pass such a declaration over there, and the file comes back as it went in. Reading it with the tokenizer of plain CSS would take that comment for code and write a line break into it.
 */

import { execFileSync } from "node:child_process"
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import process, { stderr, stdout } from "node:process"

const ROOT = path.resolve(import.meta.dirname, `..`)

/** The stylesheet the second project is linted over: a declaration whose property is parted from its colon by an inline comment, which only `postcss-scss` reads there. */
const SCSS_STYLESHEET = `a { b //x:y\n: red; }\n`

/**
 * Lints one stylesheet with the built plugin and hands back what the fix left in the file.
 * @param project - The project holding the plugin.
 * @param directory - The directory the stylesheet stands in.
 * @param from - The directory Stylelint is run from, which is where it looks a custom syntax up.
 * @returns The stylesheet, as the fix left it.
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
 * Puts a package of the checkout into a project's `node_modules`, by the path Node resolves it at.
 * @param modules - The `node_modules` directory.
 * @param name - The package's name, scope and all.
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

	// A workspace whose packages carry dependencies of their own: `postcss-scss` stands where the stylesheet is, and the plugin's own chain has none of it
	let beside = path.join(project, `beside`)

	mkdirSync(beside, { recursive: true })
	link(path.join(beside, `node_modules`), `postcss-scss`)
	writeFileSync(path.join(beside, `a.scss`), SCSS_STYLESHEET)

	let read = lint(project, beside, beside)

	if (read !== `a { b //x:y\n:\n red; }\n`) throw new Error(`The tokenizer standing beside the stylesheet was not reached: ${JSON.stringify(read)}`)

	stdout.write(`\t📦 the tokenizer of a syntax is reached from the stylesheet it parsed\n`)

	// The same again with the package where Stylelint finds it and nowhere the plugin can reach: neither the stylesheet's directory nor the plugin's has it
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
