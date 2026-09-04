import stylelint from "stylelint"
import { assert, describe, expect, it } from "vitest"

import rules from "../../lib/rules/index.ts"
import { css } from "../../lib/syntaxes/css/index.ts"
import { namespaces } from "../../lib/syntaxes/index.ts"
import { RULE_OPTIONS } from "../oracles/options.ts"

import { buildRegistry, lint, lintDirect } from "./lint.ts"

/** The rules under the names a configuration spells them with, built the way `vitest.setup.ts` builds the registry the suite is linted through. */
const REGISTRY = buildRegistry(rules, [css, ...namespaces])

/** The plugin as a configuration names it, which is the path `vitest.setup.ts` hands the testing library. */
const PLUGIN = new URL(`../../lib/index.ts`, import.meta.url).pathname

/** A stylesheet the three rules of the cases below have nothing to say about, so that a warning could only be one the option should have stopped. The case putting the whole option list over it reads the objections alone, and seventeen of those rules do warn about it. */
const CODE = `a {\n\tcolor: pink;\n}\n`

/** The same stylesheet with a space at the end of its second line, which `no-eol-whitespace` takes away wherever it runs at all — so that a rewrite is what shows the fix pass ran. The space is written inside a one-line literal, where no editor trims it. */
const CODE_WITH_TRAILING_SPACE = `a {\n\tcolor: pink; \n}\n`

// #540: the configuration the runner assembled carried no `validate` flag, and `stylelint.utils.validateOptions` opens by reading one — so it handed back `true` for every option of every rule, and every `if (!validOptions) return` of `lib/rules/` was dead
describe(`a primary option the rule does not take`, () => {
	it(`is refused in the words the linter refuses it with`, async () => {
		let answer = await lintDirect({ code: CODE, rules: [[`max-empty-lines`, `abc`]], registry: REGISTRY })

		assert(!answer.unparsable)
		expect(answer.invalidOptions).toStrictEqual([`Invalid option "abc" for rule "@stylistic/max-empty-lines"`])
		expect(answer.warnings).toHaveLength(0)
	})

	it(`is refused on the fix pass as much as on the check, so that the rule writes nothing`, async () => {
		let answer = await lintDirect({ code: CODE_WITH_TRAILING_SPACE, rules: [[`no-eol-whitespace`, `abc`]], registry: REGISTRY, fix: true })
		// The same text under the option the rule does take, so that the case cannot pass by standing over a fixture there was nothing to write into
		let taken = await lintDirect({ code: CODE_WITH_TRAILING_SPACE, rules: [[`no-eol-whitespace`, true]], registry: REGISTRY, fix: true })

		assert(!answer.unparsable)
		assert(!taken.unparsable)
		expect(answer.invalidOptions).toHaveLength(1)
		expect(answer.code).toBe(CODE_WITH_TRAILING_SPACE)
		expect(taken.code).not.toBe(CODE_WITH_TRAILING_SPACE)
	})

	it(`stops a rule whose primary is a number before it builds a regular expression out of the keyword`, async () => {
		let answer = await lintDirect({ code: CODE, rules: [[`function-max-empty-lines`, `abc`]], registry: REGISTRY })

		assert(!answer.unparsable)
		expect(answer.invalidOptions).toHaveLength(1)
	})

	it(`reaches the oracles as an option warning naming the rule under its own namespace`, async () => {
		let { results } = await lint({ code: CODE, config: { plugins: [PLUGIN], customSyntax: `postcss-less`, rules: { "@stylistic/less/max-empty-lines": `abc` } } })

		expect(results[0].invalidOptionWarnings).toStrictEqual([{ text: `Invalid option "abc" for rule "@stylistic/less/max-empty-lines"` }])
		expect(results[0].warnings).toHaveLength(0)
	})

	it(`reaches a test case as the option warning the testing library reads`, async () => {
		let { results } = await stylelint.lint({ code: CODE, config: { plugins: [PLUGIN], rules: { "@stylistic/max-empty-lines": `abc` } } })

		expect(results[0]?.invalidOptionWarnings).toStrictEqual([{ text: `Invalid option "abc" for rule "@stylistic/max-empty-lines"` }])
	})
})

/** The syntaxes the oracles read the corpus under, each with the package a configuration names it by, so that the option list is put to the instance of a rule under each of them rather than to the core's alone. Those three are the list's own reach: it is what the oracles run, and they read no other. */
const SYNTAXES: [string, string | undefined][] = [[`css`, undefined], [`scss`, `postcss-scss`], [`less`, `postcss-less`]]

// The list is written out by hand so that a run of an oracle over an older commit stays comparable, and an option a rule does not take is the list having fallen behind the plugin. Nothing else fails on such a row: every oracle answers a refused run with no row at all, so the corpus quietly shrinks and the diff of a branch says nothing
describe(`the option list the oracles read`, () => {
	it(`holds no option a rule of the plugin refuses, under any of the three syntaxes the oracles read`, async () => {
		let refused: string[] = []

		for (let [syntaxName, syntax] of SYNTAXES) {
			for (let [rule, primaries] of Object.entries(RULE_OPTIONS)) {
				for (let primary of primaries) {
					let name = syntaxName === `css` ? rule : `${syntaxName}/${rule}`
					// eslint-disable-next-line no-await-in-loop
					let answer = await lintDirect({ code: CODE, rules: [[name, primary]], registry: REGISTRY, syntax })

					if (!answer.unparsable && answer.invalidOptions.length > 0) refused.push(`${name}: ${JSON.stringify(primary)}`)
				}
			}
		}

		expect(refused).toStrictEqual([])
	})
})
