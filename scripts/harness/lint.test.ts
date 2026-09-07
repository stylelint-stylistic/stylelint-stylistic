import stylelint from "stylelint"
import { assert, describe, expect, it } from "vitest"

import rules from "../../lib/rules/index.ts"
import { css } from "../../lib/syntaxes/css/index.ts"
import { namespaces } from "../../lib/syntaxes/index.ts"
import { RULE_OPTIONS } from "../oracles/options.ts"

import { buildRegistry, lint, lintDirect, type RuleSetting } from "./lint.ts"

/** The rules under the names a configuration spells them with, built the way `vitest.setup.ts` builds the registry the suite is linted through. */
const REGISTRY = buildRegistry(rules, [css, ...namespaces])

/** The plugin as a configuration names it, which is the path `vitest.setup.ts` hands the testing library. */
const PLUGIN = new URL(`../../lib/index.ts`, import.meta.url).pathname

/** A stylesheet the three rules of the cases below have nothing to say about, so that a warning could only be one the option should have stopped; the case putting the whole option list over it reads the objections alone, seventeen of those rules warning about it. */
const CODE = `a {\n\tcolor: pink;\n}\n`

/** The same stylesheet with a trailing space on its second line, which `no-eol-whitespace` takes away wherever it runs, so a rewrite shows the fix pass ran; it stands in a one-line literal, where no editor trims it. */
const CODE_WITH_TRAILING_SPACE = `a {\n\tcolor: pink; \n}\n`

// #540: the runner's configuration carried no `validate` flag, which `stylelint.utils.validateOptions` opens by reading, so it answered `true` for every option and every `if (!validOptions) return` of `lib/rules/` was dead
describe(`a primary option the rule does not take`, () => {
	it(`is refused in the words the linter refuses it with`, async () => {
		let answer = await lintDirect({ code: CODE, rules: [[`max-empty-lines`, `abc`]], registry: REGISTRY })

		assert(!answer.unparsable)
		expect(answer.invalidOptions).toStrictEqual([`Invalid option "abc" for rule "@stylistic/max-empty-lines"`])
		expect(answer.warnings).toHaveLength(0)
	})

	it(`is refused on the fix pass as much as on the check, so that the rule writes nothing`, async () => {
		let answer = await lintDirect({ code: CODE_WITH_TRAILING_SPACE, rules: [[`no-eol-whitespace`, `abc`]], registry: REGISTRY, fix: true })
		// The same text under an option the rule takes, so that the case cannot pass over a fixture there was nothing to write into
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

/** The syntaxes the oracles read the corpus under, each with the package a configuration names it by, so that the option list is put to a rule's instance under each rather than to the core's alone; the oracles read no other. */
const SYNTAXES: [string, string | undefined][] = [[`css`, undefined], [`scss`, `postcss-scss`], [`less`, `postcss-less`]]

// The list is written by hand so that an oracle run over an older commit stays comparable, and an option a rule refuses is the list having fallen behind the plugin; nothing else fails on such a row, since an oracle answers a refused run with no row at all, the corpus quietly shrinks and the diff of a branch says nothing
describe(`the option list the oracles read`, () => {
	it(`holds no option a rule of the plugin refuses, under any of the three syntaxes the oracles read`, async () => {
		let refused: string[] = []

		for (let [syntaxName, syntax] of SYNTAXES) {
			for (let [rule, primaries] of Object.entries(RULE_OPTIONS)) {
				for (let primary of primaries) {
					let name = syntaxName === `css` ? rule : `${syntaxName}/${rule}`
					// An array in the list is a whole setting, primary first and secondary options behind, as `runs.ts` hands it to a configuration
					// eslint-disable-next-line no-await-in-loop
					let answer = await lintDirect({ code: CODE, rules: [Array.isArray(primary) ? [name, ...primary] as RuleSetting : [name, primary]], registry: REGISTRY, syntax })

					if (!answer.unparsable && answer.invalidOptions.length > 0) refused.push(`${name}: ${JSON.stringify(primary)}`)
				}
			}
		}

		expect(refused).toStrictEqual([])
	})
})
