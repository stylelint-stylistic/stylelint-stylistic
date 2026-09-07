import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import rules from "../../lib/rules/index.ts"
import { css } from "../../lib/syntaxes/css/index.ts"
import { namespaces } from "../../lib/syntaxes/index.ts"
import { buildRegistry, lintDirect } from "../harness/lint.ts"

import type { Sweep } from "./run.ts"

/** The rules under the names a configuration spells them with, built as `vitest.setup.ts` builds the suite's registry. */
const REGISTRY = buildRegistry(rules, [css, ...namespaces])

/** Where the sweep modules stand: beside this file, not at a path the repository is asked for. */
const DIRECTORY = import.meta.dirname

/** What stands in that directory besides sweep modules and their tests: the runner, which no case can import, and the module naming what a sweep result depends on. */
const NOT_A_SWEEP = new Set([`run.ts`, `key.ts`])

/** The syntaxes a sweep naming none is read under, as the runner's `DEFAULT_SYNTAXES` spells them; the last case holds the two lists to each other. */
const DEFAULT_SYNTAXES = [`css`, `scss`, `less`]

/** The stylesheet the configurations are put over; only what the rules object to about their options is read off the run. */
const CODE = `a {\n\tcolor: pink;\n}\n`

/** A primary no rule of the plugin takes, telling a name whose rule is reached from one whose is not. */
const REFUSED_PRIMARY = `abc`

/**
 * Spells a rule the way the runner spells it, the core's carrying no segment of its own.
 * @param syntaxName - The syntax the sweep is read under.
 * @param rule - The rule's short name.
 * @returns The name a configuration refers to that rule by, behind `@stylistic/`.
 */
function nameOf (syntaxName: string, rule: string): string {
	return `${syntaxName === `css` ? `` : `${syntaxName}/`}${rule}`
}

/** The names of the files a sweep module could stand in. */
let files = readdirSync(DIRECTORY).filter((file) => file.endsWith(`.ts`) && !file.endsWith(`.test.ts`) && !NOT_A_SWEEP.has(file)).toSorted()

/** Every module of that directory, each with the name of the file it stands in. */
let modules: [string, Partial<Sweep>][] = await Promise.all(files.map(async (file): Promise<[string, Partial<Sweep>]> => [file, await import(path.join(DIRECTORY, file))]))

/** The ones exporting what a sweep exports; a module that does not is named by a case of its own rather than left to throw inside a loop that would not say which file. */
let sweeps = modules.filter(([, module]) => Array.isArray(module.corpus) && Array.isArray(module.configs)) as [string, Sweep][]

/** Every name the sweeps spell a rule with, once each. */
let names = [...new Set(sweeps.flatMap(([, sweep]) => (sweep.syntaxes ?? DEFAULT_SYNTAXES).flatMap((syntaxName) => sweep.configs.map((config) => nameOf(syntaxName, config.rule)))))].toSorted()

// #543: `scripts/sweeps/colon-in-comment.ts` listed `never-single-line` among the primaries of `declaration-colon-space-after`, which does not take it, so 3 960 of that sweep's 59 400 rows stood under a configuration no run of Stylelint reaches; the runner wrote `{ usable: false }` for each and went on, and the counts a merged commit quoted held them all
describe(`the configurations the sweeps measure under`, () => {
	it(`hold no option a rule of the plugin refuses, under any namespace a sweep is read under`, async () => {
		let refused: string[] = []

		for (let [file, sweep] of sweeps) {
			for (let syntaxName of sweep.syntaxes ?? DEFAULT_SYNTAXES) {
				for (let config of sweep.configs) {
					let name = nameOf(syntaxName, config.rule)
					// The text is read as plain CSS whichever namespace is asked: a rule refuses an option before reading anything of the file, and a stylesheet opened with no custom syntax is one every namespace accepts, so no syntax package is loaded to put the question
					// eslint-disable-next-line no-await-in-loop
					let answer = await lintDirect({ code: CODE, rules: [[name, config.primary, config.secondary]], registry: REGISTRY })

					if (!answer.unparsable && answer.invalidOptions.length > 0) refused.push(`${file}: ${name} ${JSON.stringify(config.primary)}`)
				}
			}
		}

		expect(refused).toStrictEqual([])
	})

	it(`are put to names whose rule is reached at all, a primary no rule takes being refused under each of them`, async () => {
		// The control the case above needs. `defineRule` gates a check on the syntax accepting the root, and a root a namespace turns away draws a warning of its own instead, so `validateOptions` never runs and a drifted option reads like a sound one; under a custom syntax only the namespace whose syntax parsed the text reaches its rules, which is why the question is put with none
		let silent: string[] = []

		for (let name of names) {
			// eslint-disable-next-line no-await-in-loop
			let answer = await lintDirect({ code: CODE, rules: [[name, REFUSED_PRIMARY]], registry: REGISTRY })

			if (answer.unparsable || answer.invalidOptions.length === 0) silent.push(name)
		}

		expect(silent).toStrictEqual([])
	})

	it(`are read out of every file of the directory that is neither the runner nor the module of the key`, () => {
		// Three ways the two cases above could measure nothing and say nothing, one assertion each: a directory the flat listing under-reports is caught by the recursive listing; an empty listing, by the sweep named here, a canary that goes the day that sweep does; a file that is no sweep, by the last, which names it rather than letting a loop throw
		expect(readdirSync(DIRECTORY, { recursive: true, encoding: `utf8` }).filter((entry) => entry.endsWith(`.ts`) && !entry.endsWith(`.test.ts`) && !NOT_A_SWEEP.has(entry)).toSorted()).toStrictEqual(files)
		expect(files).toContain(`colon-in-comment.ts`)
		expect(modules.filter(([file]) => !sweeps.some(([name]) => name === file)).map(([file]) => file)).toStrictEqual([])
		expect(sweeps.filter(([, sweep]) => sweep.configs.length === 0).map(([file]) => file)).toStrictEqual([])
	})

	it(`are read under the syntaxes the runner reads them under`, () => {
		// The runner cannot be imported by a case (it reads `argv`, imports the module it was handed and measures as it loads), so its list is read as text, the way `key.test.ts` reads that file
		let runner = readFileSync(path.join(DIRECTORY, `run.ts`), `utf8`)
		let listed = runner.match(/const DEFAULT_SYNTAXES = \[(?<names>[^\]]*)\]/u)?.groups?.names ?? ``

		expect([...listed.matchAll(/`(?<name>[^`]+)`/gu)].map((match) => match.groups?.name)).toStrictEqual(DEFAULT_SYNTAXES)
	})
})
