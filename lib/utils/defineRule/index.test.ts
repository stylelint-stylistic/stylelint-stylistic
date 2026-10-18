import { type Declaration, parse, type Rule } from "postcss"
import stylelint, { type Config, type PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { CHARSET_RULE_MESSAGE } from "../asksForTheCharsetRule/index.ts"
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
let namespaced: Syntax = { ...css, namespace: `scss` }

const CHARSET_WARNING = { rule: `@stylistic/property-found`, text: `${CHARSET_RULE_MESSAGE} (@stylistic/property-found)` }

/**
 * Lints a text under the rules, each registered as a plugin of its own and configured to look for `color`.
 * @param rules - The rules, as the factory builds them.
 * @param code - The text.
 * @param others - Settings of other rules the configuration lists, the core's among them.
 * @param [customSyntax] - The syntax the text is parsed with.
 * @returns The warnings, by rule and text.
 */
async function lint (rules: ReturnType<typeof createRule>[], code: string, others: Record<string, unknown> = {}, customSyntax?: string): Promise<{ rule: string, text: string }[]> {
	let { results } = await stylelint.lint({
		code,
		config: {
			plugins: rules.map((built) => stylelint.createPlugin(built.ruleName, built)),
			rules: { ...Object.fromEntries(rules.map((built) => [built.ruleName, `color`])), ...others },
			...(customSyntax && { customSyntax }),
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
		await expect(lint([createRule(refusing)], `a { color: red; color: blue; }`)).resolves.toEqual([{ rule: `@stylistic/never/property-found`, text: `The "@stylistic/never/property-found" rule does not read a stylesheet parsed with this syntax; the "@stylistic/less/" and "@stylistic/scss/" and "@stylistic/styled/" rules do (@stylistic/never/property-found)` }])
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

		// The text holds no `color`, so nothing is reported into a result carrying no Stylelint fields
		check(root, {} as unknown as PostcssResult)

		expect(seen).toEqual([root])
	})
})

describe(`a stylesheet holding a charset`, () => {
	it(`gets one warning asking for the core rule, in front of the first rule's own, however many rules are configured`, async () => {
		let second = defineRule({ shortName: `property-found-too`, meta: { url: `https://example.test/property-found-too` }, messages: MESSAGES, rule })

		await expect(lint([createRule(core), second(core)], `@charset "utf-8";\na { color: red; }`)).resolves.toEqual([
			CHARSET_WARNING,
			{ rule: `@stylistic/property-found`, text: `Found "color" (@stylistic/property-found)` },
			{ rule: `@stylistic/property-found-too`, text: `Found "color" (@stylistic/property-found-too)` },
		])
	})

	it(`gets the warning whatever the spelling and wherever the charset stands, since the core rule reports those too`, async () => {
		await expect(lint([createRule(core)], `a { color: red; @CHARSET 'utf-8'; }`)).resolves.toEqual([CHARSET_WARNING, { rule: `@stylistic/property-found`, text: `Found "color" (@stylistic/property-found)` }])
	})

	it(`gets no such warning with the core rule on`, async () => {
		await expect(lint([createRule(core)], `@charset "utf-8";\na { color: red; }`, { "at-charset-rule-no-invalid": true })).resolves.toEqual([{ rule: `@stylistic/property-found`, text: `Found "color" (@stylistic/property-found)` }])
	})

	it(`gets none without a charset`, async () => {
		await expect(lint([createRule(core)], `@import "x.css";\na { color: red; }`)).resolves.toEqual([{ rule: `@stylistic/property-found`, text: `Found "color" (@stylistic/property-found)` }])
	})

	it(`gets none under a namespace, whose compiler stands between the file and its output`, async () => {
		await expect(lint([createRule(namespaced)], `@charset "utf-8";\na { color: red; }`)).resolves.toEqual([{ rule: `@stylistic/scss/property-found`, text: `Found "color" (@stylistic/scss/property-found)` }])
	})

	it(`gets none in a block of a page, whose root is not the file's`, async () => {
		await expect(lint([createRule(core)], `<style>@charset "utf-8";\na { color: red; }</style>`, {}, `postcss-html`)).resolves.toEqual([{ rule: `@stylistic/property-found`, text: `Found "color" (@stylistic/property-found)` }])
	})
})

describe(`a run a check of the plugin's own cut short`, () => {
	// The tail is the one place where every rule of the plugin is known to have read the root, so an unwinding tail is what unwraps the raws of whoever holds the tree a run cut short leaves behind; the rules are driven here rather than through the linter, which never hands a tree back
	it(`leaves every node with the raws it was parsed with, where a deferred check throws`, () => {
		let throwing = defineRule({ shortName: `property-throws`, meta: { url: `https://example.test/property-throws` }, messages: MESSAGES, defersToRunEnd: true, rule: (): RuleCheck => (): void => { throw new Error(`the check throws`) } })
		let standing = defineRule({ shortName: `property-found-behind`, meta: { url: `https://example.test/property-found-behind` }, messages: MESSAGES, rule })
		let defers = throwing(core)
		let last = standing(core)
		let root = parse(`a { color: red; }`)
		let block = root.first as Rule
		let declaration = block.first as Declaration
		let plain = block.raws
		let plainOfDeclaration = declaration.raws
		let result = { stylelint: { config: { rules: { "@stylistic/property-throws": `color`, "@stylistic/property-found-behind": true } } } } as unknown as PostcssResult

		defers(`color`, undefined, {})(root, result)

		expect(() => last(`never`, undefined, {})(root, result)).toThrow(`the check throws`)
		expect(block.raws).toBe(plain)
		expect(declaration.raws).toBe(plainOfDeclaration)
	})
})
