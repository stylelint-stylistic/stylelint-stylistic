import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"

import { ruleName } from "./index.ts"

describe(`the run behind an at-rule's semicolon, where a free semicolon the rule about extra semicolons takes out stands in it`, () => {
	// The semicolon is read as gone and stays for that rule to take, so the spaces in front of the break go whichever side of that rule this one is listed
	it.each([
		[`@import "x";  ;\na {}`, `@import "x";\na {}`],
		[`@import "x";;  \na {}`, `@import "x";\na {}`],
		[`a { @apply b;  ;\nd: e; }`, `a { @apply b;\nd: e; }`],
	])(`is written alike in %j in either order`, async (code, output) => {
		for (let thisRuleFirst of [true, false]) {
			let pair: [string, unknown][] = [[ruleName, `always`], [`@stylistic/no-extra-semicolons`, true]]
			let config = { plugins, rules: Object.fromEntries(thisRuleFirst ? pair : pair.toReversed()) }
			// eslint-disable-next-line no-await-in-loop -- the orders are read one after another
			let fixed = await stylelint.lint({ code, config, fix: true })

			expect(fixed.code).toBe(output)
		}
	})
})
