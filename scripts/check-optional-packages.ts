#!/usr/bin/env node

/**
 * Checks that the built plugin needs none of the syntax packages a project may lack.
 *
 * The four custom syntaxes are devDependencies; the plugin reaches only `postcss-scss`'s tokenizer and the template reader of `postcss-styled-syntax`, lazily. A static import once kept the plugin from loading, and a source scan misses import shapes, so the property is checked: `dist/` is loaded in a project holding every dependency and none of the four. A second project is then given each package where Stylelint reaches it and the plugin cannot, and a stylesheet is linted with `--fix`: the rules pass an SCSS declaration with an inline comment over, where the CSS tokenizer would write a line break into the comment, and write no break between two interpolations of a styled template, whose texts only the package tells apart.
 */

import { execFileSync } from "node:child_process"
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import process, { stderr, stdout } from "node:process"

const ROOT = path.resolve(import.meta.dirname, `..`)

/** A property parted from its colon by an inline comment, which only `postcss-scss` reads. */
const SCSS_STYLESHEET = `a { b //x:y\n: red; }\n`

/** Two interpolations on lines of their own, the first holding a break, and a declaration behind them, each line two levels too deep. */
const STYLED_STYLESHEET = `const a = styled.div\`\n\tcolor: red;\n\t\t\t\${\`\n\`}\n\t\t\t\${y}\n\t\t\ttop: 0;\n\`;\n`

/** What one syntax's check lints: the file, its syntax and the rule. */
type Subject = {
	file: string,
	syntax: string,
	rule: string,
	primary: string,
}

/** The SCSS check. */
const SCSS: Subject = { file: `a.scss`, syntax: `postcss-scss`, rule: `@stylistic/scss/declaration-colon-newline-after`, primary: `always` }

/** The styled check. */
const STYLED: Subject = { file: `a.js`, syntax: `postcss-styled-syntax`, rule: `@stylistic/styled/indentation`, primary: `tab` }

/**
 * Lints one stylesheet with the built plugin.
 * @param project - The project holding the plugin.
 * @param directory - The stylesheet's directory.
 * @param from - Where Stylelint runs, and looks the syntax up.
 * @param subject - The file, its syntax and the rule.
 * @returns The stylesheet as the fix left it.
 */
function lint (project: string, directory: string, from: string, subject: Subject): string {
	let stylesheet = path.join(directory, subject.file)
	let script = `
		import { readFileSync } from "node:fs"

		import stylelint from "stylelint"

		await stylelint.lint({
			files: ${JSON.stringify(stylesheet)},
			fix: true,
			config: {
				plugins: [${JSON.stringify(path.join(project, `plugin`, `index.js`))}],
				customSyntax: ${JSON.stringify(subject.syntax)},
				rules: { ${JSON.stringify(subject.rule)}: ${JSON.stringify(subject.primary)} },
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

	// Each package beside the stylesheet, out of the plugin's chain
	let beside = path.join(project, `beside`)

	mkdirSync(beside, { recursive: true })
	link(path.join(beside, `node_modules`), `postcss-scss`)
	link(path.join(beside, `node_modules`), `postcss-styled-syntax`)
	writeFileSync(path.join(beside, `a.scss`), SCSS_STYLESHEET)
	writeFileSync(path.join(beside, `a.js`), STYLED_STYLESHEET)

	let read = lint(project, beside, beside, SCSS)

	if (read !== `a { b //x:y\n:\n red; }\n`) throw new Error(`The tokenizer standing beside the stylesheet was not reached: ${JSON.stringify(read)}`)

	stdout.write(`\t📦 the tokenizer of a syntax is reached from the stylesheet it parsed\n`)

	let readTemplate = lint(project, beside, beside, STYLED)

	if (readTemplate !== STYLED_STYLESHEET.replaceAll(`\n\t\t\t`, `\n\t`)) throw new Error(`The template reader standing beside the stylesheet was not reached: ${JSON.stringify(readTemplate)}`)

	stdout.write(`\t📦 the template reader of a syntax is reached from the stylesheet it parsed\n`)

	// `postcss-scss` where only Stylelint finds it
	let apart = path.join(project, `apart`)
	let runner = path.join(project, `runner`)

	mkdirSync(apart, { recursive: true })
	mkdirSync(runner, { recursive: true })
	link(path.join(runner, `node_modules`), `postcss-scss`)
	link(path.join(runner, `node_modules`), `postcss-styled-syntax`)
	writeFileSync(path.join(apart, `a.scss`), SCSS_STYLESHEET)
	writeFileSync(path.join(apart, `a.js`), STYLED_STYLESHEET)

	let untouched = lint(project, apart, runner, SCSS)

	if (untouched !== SCSS_STYLESHEET) throw new Error(`A stylesheet was rewritten where the plugin could not reach the tokenizer its syntax is read by: ${JSON.stringify(untouched)}`)

	stdout.write(`\t📦 a declaration is passed over where the tokenizer of its syntax is out of reach\n`)

	let untouchedTemplate = lint(project, apart, runner, STYLED)

	if (untouchedTemplate !== STYLED_STYLESHEET.replace(`\n\t\t\t\${\``, `\n\t\${\``).replace(`\n\t\t\ttop`, `\n\ttop`)) throw new Error(`A template was written between its interpolations where the plugin could not reach the reader of its syntax: ${JSON.stringify(untouchedTemplate)}`)

	stdout.write(`\t📦 no break between interpolations is written where the template reader of its syntax is out of reach\n`)
}
catch (error) {
	stderr.write(`${(error as Error).message}\n`)
	process.exitCode = 1
}
finally {
	rmSync(project, { recursive: true, force: true })
}
