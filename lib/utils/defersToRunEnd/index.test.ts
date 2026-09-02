import { parse } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { deferCheck, defersToRunEnd, flushDeferredChecks, lastConfiguredPluginRule, registerPluginRule } from "./index.ts"

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
	it(`the checks of one root run at its flush, in the order they were put off, and a flush with nothing waiting is a no-op`, () => {
		let root = parse(`a {}`)
		let ran: string[] = []

		deferCheck(root, () => ran.push(`first`))
		deferCheck(root, () => ran.push(`second`))
		expect(ran).toStrictEqual([])
		flushDeferredChecks(root)
		expect(ran).toStrictEqual([`first`, `second`])
		flushDeferredChecks(root)
		expect(ran).toStrictEqual([`first`, `second`])
	})

	it(`two roots live apart: each root's checks wait for its own flush`, () => {
		let one = parse(`a {}`)
		let two = parse(`b {}`)
		let ran: string[] = []

		deferCheck(one, () => ran.push(`one`))
		deferCheck(two, () => ran.push(`two`))
		flushDeferredChecks(two)
		expect(ran).toStrictEqual([`two`])
		flushDeferredChecks(one)
		expect(ran).toStrictEqual([`two`, `one`])
	})
})
