import { parse } from "postcss"
import stylelint, { type Config, type PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import type { RuleCheck } from "../ruleCheck/index.ts"

import { defineMessages, defineRule, type RuleScope } from "./index.ts"

let { utils: { report } } = stylelint

const MESSAGES = defineMessages({
	found: (word) => `Found "${word}"`,
})

/**
 * A rule reporting every declaration whose property is the primary option.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param primary - The property to report.
 * @returns The check.
 */
function rule ({ ruleName, messages }: RuleScope<typeof MESSAGES>, primary: string): RuleCheck {
	return (root, result) => {
		root.walkDecls(primary, (decl) => {
			report({ message: messages.found, messageArgs: [decl.prop], node: decl, result, ruleName })
		})
	}
}

let createRule = defineRule({ shortName: `property-found`, meta: { url: `https://example.test/property-found` }, messages: MESSAGES, rule })

let core: Syntax = { ...css }
let refusing: Syntax = { ...css, namespace: `never`, accepts: () => false }

/**
 * Lints a text under the rules given, each registered as a plugin of its own and configured to look for `color`.
 * @param rules - The rules, as the factory builds them.
 * @param code - The text.
 * @returns The warnings, by rule and text.
 */
async function lint (rules: ReturnType<typeof createRule>[], code: string): Promise<{ rule: string, text: string }[]> {
	let { results } = await stylelint.lint({
		code,
		config: {
			plugins: rules.map((built) => stylelint.createPlugin(built.ruleName, built)),
			rules: Object.fromEntries(rules.map((built) => [built.ruleName, `color`])),
		} as unknown as Config,
	})

	return (results[0]?.warnings ?? []).map(({ rule: name, text }) => ({ rule: name, text }))
}

describe(`a rule built for a syntax`, () => {
	it(`is named under the syntax's namespace, and its messages close with that name`, () => {
		let built = createRule(refusing)

		expect(built.ruleName).toBe(`@stylistic/never/property-found`)
		expect(built.messages.found(`x`)).toBe(`Found "x" (@stylistic/never/property-found)`)
		expect(built.meta).toEqual({ url: `https://example.test/property-found` })
	})

	it(`is named without a namespace for the core, whose messages close with that name`, () => {
		let built = createRule(core)

		expect(built.ruleName).toBe(`@stylistic/property-found`)
		expect(built.messages.found(`x`)).toBe(`Found "x" (@stylistic/property-found)`)
	})

	it(`runs its check where the syntax accepts the root`, async () => {
		await expect(lint([createRule(core)], `a { color: red; }`)).resolves.toEqual([{ rule: `@stylistic/property-found`, text: `Found "color" (@stylistic/property-found)` }])
	})

	it(`refuses a root the syntax does not accept with one warning, and reads nothing of it`, async () => {
		await expect(lint([createRule(refusing)], `a { color: red; color: blue; }`)).resolves.toEqual([{ rule: `@stylistic/never/property-found`, text: `The "@stylistic/never/property-found" rule does not read a stylesheet parsed with this syntax; the "@stylistic/less/" and "@stylistic/styled/" rules do (@stylistic/never/property-found)` }])
	})

	it(`refuses a root once, however many rules of the namespace are configured`, async () => {
		let second = defineRule({ shortName: `property-found-again`, meta: { url: `https://example.test/property-found-again` }, messages: MESSAGES, rule })
		let warnings = await lint([createRule(refusing), second(refusing)], `a { color: red; }`)

		expect(warnings).toHaveLength(1)
		expect(warnings[0]?.rule).toBe(`@stylistic/never/property-found`)
	})

	it(`asks the syntax about the root a check was handed`, () => {
		let seen: unknown[] = []
		let asked: Syntax = {
			...css,
			accepts: (root) => {
				seen.push(root)

				return true
			},
		}
		let check = createRule(asked)(`color`, undefined, {})
		let root = parse(`a { b: c; }`)

		// The text holds no `color`, so the rule has nothing to report into a result that carries no Stylelint fields
		check(root, {} as unknown as PostcssResult)

		expect(seen).toEqual([root])
	})
})
