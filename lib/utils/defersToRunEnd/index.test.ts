import { parse } from "postcss"
import stylelint, { type PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import registry from "../../rules/index.ts"

import { deferCheck, deferFinalCheck, defersToRunEnd, flushDeferredChecks, lastConfiguredPluginRule, LINENESS_RULES, linenessRank, registerPluginRule } from "./index.ts"

/**
 * Builds the slice of a Stylelint result the util reads: the normalised rule settings of a configuration.
 * @param rules - The settings by rule name, in the order a configuration spells them.
 * @returns What passes for the result.
 */
function resultWith (rules: Record<string, unknown>): PostcssResult {
	return { stylelint: { config: { rules } } } as unknown as PostcssResult
}

describe(`defersToRunEnd`, () => {
	it(`the lineness-conditioned primaries defer, and nothing else does`, () => {
		expect(defersToRunEnd(`always-single-line`)).toBe(true)
		expect(defersToRunEnd(`never-single-line`)).toBe(true)
		expect(defersToRunEnd(`always-multi-line`)).toBe(true)
		expect(defersToRunEnd(`never-multi-line`)).toBe(true)
		expect(defersToRunEnd(`always`)).toBe(false)
		expect(defersToRunEnd(`never`)).toBe(false)
		expect(defersToRunEnd(2)).toBe(false)
		expect(defersToRunEnd(null)).toBe(false)
	})
})

describe(`lastConfiguredPluginRule`, () => {
	registerPluginRule(`@stylistic/test-first`)
	registerPluginRule(`@stylistic/test-last`)

	it(`the last enabled rule the plugin has built, whatever stands behind it`, () => {
		expect(lastConfiguredPluginRule(resultWith({
			"@stylistic/test-first": [`always`],
			"@stylistic/test-last": [`never`],
			"color-named": [`never`],
		}))).toBe(`@stylistic/test-last`)
	})

	it(`a rule turned off, one the plugin never built, and one of another plugin are all passed over`, () => {
		expect(lastConfiguredPluginRule(resultWith({
			"@stylistic/test-first": [`always`],
			"@stylistic/test-last": null,
			"@stylistic/test-typo": [`always`],
			"other-plugin/rule": [`always`],
		}))).toBe(`@stylistic/test-first`)
		expect(lastConfiguredPluginRule(resultWith({
			"@stylistic/test-first": [null],
			"@stylistic/test-last": [`never`],
		}))).toBe(`@stylistic/test-last`)
	})

	it(`nothing, where the configuration lists no rule of the plugin`, () => {
		expect(lastConfiguredPluginRule(resultWith({ "color-named": [`never`] }))).toBeUndefined()
		expect(lastConfiguredPluginRule({} as PostcssResult)).toBeUndefined()
	})
})

describe(`deferCheck and flushDeferredChecks`, () => {
	it(`the checks of one root run at its flush, and a flush with nothing waiting is a no-op`, () => {
		let root = parse(`a {}`)
		let ran: string[] = []

		deferCheck(root, `1`, () => ran.push(`first`))
		deferCheck(root, `2`, () => ran.push(`second`))
		expect(ran).toStrictEqual([])
		flushDeferredChecks(root)
		expect(ran).toStrictEqual([`first`, `second`])
		flushDeferredChecks(root)
		expect(ran).toStrictEqual([`first`, `second`])
	})

	it(`the reading tier runs behind the lineness tier, whatever order the checks were put off in`, () => {
		let root = parse(`a {}`)
		let ran: string[] = []

		deferFinalCheck(root, `1`, () => ran.push(`reads-everything`))
		deferCheck(root, `1`, () => ran.push(`lineness`))
		flushDeferredChecks(root)
		expect(ran).toStrictEqual([`lineness`, `reads-everything`])
	})

	it(`the tier runs in the order of the places the checks were put off under, not the order they were put off in`, () => {
		let root = parse(`a {}`)
		let ran: string[] = []

		deferCheck(root, linenessRank(`block-opening-brace-space-after`, undefined, `always-single-line`), () => ran.push(`space-after`))
		deferCheck(root, linenessRank(`block-opening-brace-newline-before`, undefined, `always-single-line`), () => ran.push(`newline-before`))
		deferCheck(root, linenessRank(`function-comma-space-after`, undefined, `always-single-line`), () => ran.push(`function-comma`))
		flushDeferredChecks(root)
		expect(ran).toStrictEqual([`function-comma`, `newline-before`, `space-after`])
	})

	it(`the same rule under two namespaces ordered by the namespace, the core's first — every namespace reads a plain CSS file, so a configuration may have both of them read the root`, () => {
		let root = parse(`a {}`)
		let ran: string[] = []

		deferCheck(root, linenessRank(`block-opening-brace-space-after`, `scss`, `always-single-line`), () => ran.push(`scss`))
		deferCheck(root, linenessRank(`block-opening-brace-space-after`, undefined, `always-single-line`), () => ran.push(`core`))
		deferCheck(root, linenessRank(`block-opening-brace-space-after`, `less`, `always-single-line`), () => ran.push(`less`))
		flushDeferredChecks(root)
		expect(ran).toStrictEqual([`core`, `less`, `scss`])
	})

	it(`the reading tier ordered the same way, since it holds one rule under as many namespaces as are configured`, () => {
		let root = parse(`a {}`)
		let ran: string[] = []

		deferFinalCheck(root, linenessRank(`indentation`, `scss`, ``), () => ran.push(`scss`))
		deferFinalCheck(root, linenessRank(`indentation`, undefined, ``), () => ran.push(`core`))
		flushDeferredChecks(root)
		expect(ran).toStrictEqual([`core`, `scss`])
	})

	it(`two roots live apart: each root's checks wait for its own flush`, () => {
		let one = parse(`a {}`)
		let two = parse(`b {}`)
		let ran: string[] = []

		deferCheck(one, `1`, () => ran.push(`one`))
		deferCheck(two, `1`, () => ran.push(`two`))
		flushDeferredChecks(two)
		expect(ran).toStrictEqual([`two`])
		flushDeferredChecks(one)
		expect(ran).toStrictEqual([`two`, `one`])
	})
})

/**
 * Names the rules a tier of these places would run in order.
 * @param checks - Each check as the rule's short name and the primary option it is configured with, in any order.
 * @returns The short names, in the order the tier runs them.
 */
function ordered (checks: [string, string][]): string[] {
	return checks
		.map(([shortName, primary]): [string, string] => [shortName, linenessRank(shortName, undefined, primary)])
		.toSorted(([, one], [, other]) => {
			if (one < other) return -1

			return one > other ? 1 : 0
		})
		.map(([shortName]) => shortName)
}

describe(`linenessRank`, () => {
	it(`the innermost text first: a call's arguments, then the declaration around them, then the statement's own text`, () => {
		expect(ordered([
			[`block-opening-brace-space-after`, `always-single-line`],
			[`value-list-comma-space-after`, `always-single-line`],
			[`function-comma-space-after`, `always-single-line`],
		])).toStrictEqual([`function-comma-space-after`, `value-list-comma-space-after`, `block-opening-brace-space-after`])
	})

	it(`the checks whose subject is a line break ahead of those whose subject is a space, the text being the same`, () => {
		expect(ordered([
			[`block-opening-brace-space-after`, `always-single-line`],
			[`block-closing-brace-newline-after`, `always-single-line`],
		])).toStrictEqual([`block-closing-brace-newline-after`, `block-opening-brace-space-after`])
		expect(ordered([
			[`value-list-comma-space-before`, `always-single-line`],
			[`declaration-colon-newline-after`, `always-multi-line`],
		])).toStrictEqual([`declaration-colon-newline-after`, `value-list-comma-space-before`])
	})

	it(`the option conditioned on a single-line text ahead of the one conditioned on a multi-line text, the text and the subject being the same`, () => {
		expect(ordered([
			[`block-closing-brace-newline-after`, `always-multi-line`],
			[`block-opening-brace-newline-before`, `always-single-line`],
		])).toStrictEqual([`block-opening-brace-newline-before`, `block-closing-brace-newline-after`])
	})

	it(`the rule's name settles what is left`, () => {
		expect(ordered([
			[`selector-list-comma-space-after`, `never-single-line`],
			[`media-query-list-comma-space-after`, `always-single-line`],
			[`at-rule-name-space-after`, `always-single-line`],
		])).toStrictEqual([`at-rule-name-space-after`, `media-query-list-comma-space-after`, `selector-list-comma-space-after`])
	})

	it(`a rule the table does not name reads the statement's own text and speaks of no break`, () => {
		expect(linenessRank(`there-is-no-such-rule`, undefined, `always-single-line`)).toBe(linenessRank(`block-opening-brace-space-after`, undefined, `always-single-line`).replace(`block-opening-brace-space-after`, `there-is-no-such-rule`))
	})
})

describe(`LINENESS_RULES`, () => {
	// The plugin itself is asked which rules take a primary conditioned on lineness, so that a rule gaining or losing one is caught here rather than left to fall to the table's default. A rule refusing its option is what the answer is read off, and the runner of the oracles answers that as the linter does, since its configuration carries the `validate` flag `validateOptions` opens by reading
	let plugin = new URL(`../../index.ts`, import.meta.url).pathname
	let linenessPrimaries = [`always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`]

	it(`names every rule of the plugin that takes a primary conditioned on lineness, and nothing else`, async () => {
		let taking: string[] = []

		for (let shortName of Object.keys(registry)) {
			for (let primary of linenessPrimaries) {
				// eslint-disable-next-line no-await-in-loop
				let { results } = await stylelint.lint({ code: `a { color: pink; }\n`, config: { plugins: [plugin], rules: { [`@stylistic/${shortName}`]: primary } } })

				if (results[0]?.invalidOptionWarnings.length === 0) {
					taking.push(shortName)
					break
				}
			}
		}

		expect(Object.keys(LINENESS_RULES).toSorted()).toStrictEqual(taking.toSorted())
	})
})
