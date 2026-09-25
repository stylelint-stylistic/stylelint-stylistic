import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"
import { messages as colonSpaceAfterMessages } from "../declaration-colon-space-after/index.ts"

import { messages, ruleName } from "./index.ts"

// Behind a wordless declaration the brace alone closes, the run in front of the brace is the run the `declaration-colon-*-after` rules read behind the colon. The library lists the rule a block names first and its extra rules behind it, so the neighbor runs last; neither of the two writes a run the other accepts.
let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-colon-space-after": `always` },

	reject: [
		{
			description: `a wordless declaration in front of the brace, whose single space the neighbor asks to stand behind the colon, so the break is not written and the warning stands`,
			code: `
				a {
					x: }
			`,
			fixed: `
				a {
					x: }
			`,
			line: 2,
			column: 4,
			message: messages.expectedBefore,
		},
		{
			// The neighbor listed behind used to write over the break this rule accepts, and the fixing run came back clean
			description: `the same declaration with the break this rule asks for in front of the brace, which the neighbor asks to be a single space: the space is not written, and the file rests with the neighbor's warning`,
			code: `
				a {
					x:
				}
			`,
			fixed: `
				a {
					x:
				}
			`,
			line: 2,
			column: 4,
			message: colonSpaceAfterMessages.expectedAfter(),
		},
	],
})

/**
 * Fixes one snippet under this rule and `no-extra-semicolons`, in the order given, and reads the output back.
 * @param code - The snippet.
 * @param options - The setting of this rule.
 * @param thisRuleFirst - Whether this rule is listed first.
 * @returns The file the pass left and the count of the warnings the pair has about it.
 */
async function fixBesideNoExtra (code: string, options: unknown, thisRuleFirst: boolean): Promise<{ code: string, left: number }> {
	let pair: [string, unknown][] = [[ruleName, options], [`@stylistic/no-extra-semicolons`, true]]
	let config = { plugins, rules: Object.fromEntries(thisRuleFirst ? pair : pair.toReversed()) }
	let fixed = await stylelint.lint({ code, config, fix: true })
	let read = await stylelint.lint({ code: fixed.code ?? code, config })

	return { code: fixed.code ?? code, left: read.results[0]?.warnings.length ?? 0 }
}

describe(`the run in front of the closing brace where a stray semicolon stands behind the brace of the last nested rule, beside \`no-extra-semicolons\``, () => {
	// PostCSS files the semicolon with the run in front of it in the nested rule's raws, so the run in front of this brace is read across both
	it.each([
		[`a { b { c: d; } ; }`, `always`, `a { b { c: d;\n }\n  }`],
		[`a {\n\tb {}\n;\n}`, `never-multi-line`, `a {\n\tb {}}`],
	])(`is written in %j under %j in one run in either order`, async (code, options, output) => {
		expect(await fixBesideNoExtra(code, options, true)).toEqual({ code: output, left: 0 })
		expect(await fixBesideNoExtra(code, options, false)).toEqual({ code: output, left: 0 })
	})
})
