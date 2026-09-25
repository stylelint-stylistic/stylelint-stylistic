import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import plugins from "../../index.ts"

import { messages, ruleName } from "./index.ts"

// Behind a wordless declaration the brace alone closes, the run in front of the brace is the run the `declaration-colon-*-after` rules read behind the colon. The library lists the rule a block names first and its extra rules behind it, so the neighbor has the last word.
let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-colon-newline-after": `always` },

	reject: [
		{
			description: `a wordless custom property in front of the brace, whose break the neighbor asks to stand behind the colon, so the space is not written and the warning stands`,
			code: `
				a {
					--x:
				}
			`,
			fixed: `
				a {
					--x:
				}
			`,
			line: 2,
			column: 6,
			message: messages.expectedBefore(),
		},
	],
})

/**
 * Fixes one snippet under this rule and a rule taking stray semicolons out, in the order given, and reads the output back.
 * @param code - The snippet.
 * @param options - The setting of this rule.
 * @param neighbor - The neighbor and its setting.
 * @param thisRuleFirst - Whether this rule is listed first.
 * @param syntax - The namespace and the custom syntax the snippet is read with, if any.
 * @returns The file the pass left and the count of the warnings the pair has about it.
 */
async function fixBesideATaker (code: string, options: unknown, neighbor: [string, unknown], thisRuleFirst: boolean, syntax?: { namespace: string, customSyntax: string }): Promise<{ code: string, left: number }> {
	let prefix = syntax ? `@stylistic/${syntax.namespace}/` : `@stylistic/`
	let pair: [string, unknown][] = [[ruleName.replace(`@stylistic/`, prefix), options], [neighbor[0].replace(`@stylistic/`, prefix), neighbor[1]]]
	let config = { plugins, rules: Object.fromEntries(thisRuleFirst ? pair : pair.toReversed()) }
	let fixed = await stylelint.lint({ code, config, fix: true, ...(syntax && { customSyntax: syntax.customSyntax }) })
	let read = await stylelint.lint({ code: fixed.code ?? code, config, ...(syntax && { customSyntax: syntax.customSyntax }) })

	return { code: fixed.code ?? code, left: read.results[0]?.warnings.length ?? 0 }
}

describe(`the run in front of the closing brace holding a stray semicolon a neighbor takes out in the same run`, () => {
	let noExtra: [string, unknown] = [`@stylistic/no-extra-semicolons`, true]
	let trailing: [string, unknown] = [`@stylistic/declaration-block-trailing-semicolon`, `never`]

	// The semicolon is gone once the pass is over, so the run is judged and written as it will stand, and either order leaves the file the check finds clean
	it.each([
		[`a {color: pink; ;\n}`, `always`, noExtra, `a {color: pink; }`],
		[`a {color: pink; ;\n}`, `always`, trailing, `a {color: pink }`],
		[`a {color: pink; ;\n}`, `never`, noExtra, `a {color: pink;}`],
		[`a {color: pink; ;\n}`, `never`, trailing, `a {color: pink}`],
		[`a {\n\tcolor: pink;\n\n;\n\n}`, `always`, noExtra, `a {\n\tcolor: pink; }`],
		[`a {\n\tcolor: pink;\n\n;\n\n}`, `never`, trailing, `a {\n\tcolor: pink}`],
		[`a {/*c*/\n;}`, `always`, noExtra, `a {/*c*/ }`],
	])(`is written in %j under %j beside %j in one run in either order`, async (code, options, neighbor, output) => {
		expect(await fixBesideATaker(code, options, neighbor as [string, unknown], true)).toEqual({ code: output, left: 0 })
		expect(await fixBesideATaker(code, options, neighbor as [string, unknown], false)).toEqual({ code: output, left: 0 })
	})

	it(`reads a stray semicolon a disable comment keeps from the fix of \`no-extra-semicolons\` as the character in front of the run`, async () => {
		let code = `a { color: pink; ;  } /* stylelint-disable-line @stylistic/no-extra-semicolons */`

		expect(await fixBesideATaker(code, `always`, noExtra, true)).toEqual({ code: `a { color: pink; ; } /* stylelint-disable-line @stylistic/no-extra-semicolons */`, left: 0 })
	})

	// PostCSS files a semicolon behind the closing brace of the last nested rule with the run in front of it in that rule's raws, so the run in front of this brace is read across both
	it.each([
		[`always`, `a { b { c: d; } }`],
		[`never`, `a { b { c: d;}}`],
	])(`is written in one run in either order where the semicolon stands behind a nested rule's brace, under %j`, async (options, output) => {
		expect(await fixBesideATaker(`a { b { c: d; } ; }`, options, noExtra, true)).toEqual({ code: output, left: 0 })
		expect(await fixBesideATaker(`a { b { c: d; } ; }`, options, noExtra, false)).toEqual({ code: output, left: 0 })
	})

	// Without the semicolon the run holds no break, and the brace written behind the whitespace would land in the comment the last node leaves open
	it.each([{ namespace: `scss`, customSyntax: `postcss-scss` }, { namespace: `less`, customSyntax: `postcss-less` }])(`is left alone behind an inline comment where no break survives the semicolon a neighbor takes, under $customSyntax`, async (syntax) => {
		let code = `a { color: pink; // c;\n;\n}`
		let output = `a { color: pink; // c;\n\n}`

		expect(await fixBesideATaker(code, `always`, noExtra, true, syntax)).toEqual({ code: output, left: 1 })
		expect(await fixBesideATaker(code, `always`, noExtra, false, syntax)).toEqual({ code: output, left: 1 })
	})
})
