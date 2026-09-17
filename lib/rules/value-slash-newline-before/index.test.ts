import scss from "postcss-scss"
import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"
import plugins from "../../index.ts"

import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a newline in front of the solidus`,
			code: `a { grid-area: 1\n/ 2; }`,
		},
		{
			description: `a newline and indentation in front of the solidus`,
			code: `a { grid-area: 1\n\t/ 2; }`,
		},
		{
			description: `the same value written with a carriage-return line break`,
			code: `a { grid-area: 1\r\n/ 2; }`,
		},
		{
			description: `a solidus inside a string`,
			code: `a::before { content: "1 / 2"; }`,
		},
		{
			description: `a solidus inside a bare address`,
			code: `a { background: url(dir/a.png); }`,
		},
		{
			description: `the division operator of a math function`,
			code: `a { width: calc(100% / 3); }`,
		},
		{
			description: `the solidus of a media feature, which no rule about a newline reads`,
			code: `@media (aspect-ratio: 16 / 9) {}`,
		},
	],

	reject: [
		{
			// The run is read over the copy with its escapes masked, so the break goes behind the escaped space, not in its place (1789661964)
			description: `an escaped space in front of the solidus, which is a character of the word and no run, so the break goes behind it`,
			code: `a { b: a\\ /b; }`,
			fixed: `a { b: a\\ \n/b; }`,
			line: 1,
			column: 11,
			message: messages.expectedBefore(),
		},
		{
			// See #560
			description: `a solidus among the arguments behind a quoted address, which are those of any call`,
			code: `a { b: url("x", 1/2); }`,
			fixed: `a { b: url("x", 1\n/2); }`,
			line: 1,
			column: 18,
			message: messages.expectedBefore(),
		},
		{
			description: `no whitespace in front of the solidus`,
			code: `a { grid-area: 1/2; }`,
			fixed: `a { grid-area: 1\n/2; }`,
			line: 1,
			column: 17,
			message: messages.expectedBefore(),
		},
		{
			description: `a space in front of the solidus, written over by the newline, since it is the end of a line`,
			code: `a { grid-area: 1 / 2; }`,
			fixed: `a { grid-area: 1\n/ 2; }`,
			line: 1,
			column: 18,
			message: messages.expectedBefore(),
		},
		{
			description: `a comment in front of the solidus, behind which the newline is written`,
			code: `a { grid-area: 1 /*c*/ / 2; }`,
			fixed: `a { grid-area: 1 /*c*/\n/ 2; }`,
			line: 1,
			column: 24,
			message: messages.expectedBefore(),
		},
		{
			description: `a newline behind the solidus and none in front of it`,
			code: `a { grid-area: 1 /\n2; }`,
			fixed: `a { grid-area: 1\n/\n2; }`,
			line: 1,
			column: 18,
			message: messages.expectedBefore(),
		},
		{
			description: `no whitespace in front of either of two solidi`,
			code: `a { grid-area: 1/2/3; }`,
			fixed: `a { grid-area: 1\n/2\n/3; }`,
			warnings: [
				{
					line: 1,
					column: 17,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 19,
					message: messages.expectedBefore(),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a single-line declaration, which this option does not measure`,
			code: `a { grid-area: 1 / 2; }`,
		},
		{
			description: `a single-line declaration in a multi-line block, which does not make the declaration multi-line`,
			code: `a {\n\tgrid-area: 1 / 2;\n}`,
		},
		{
			description: `a newline in front of the solidus of a multi-line declaration`,
			code: `a { grid-area:\n\t1\n\t/ 2; }`,
		},
	],

	reject: [
		{
			description: `the message spelled out, since asking the rule for its own text would miss one that says the opposite of what the option asks (see #175)`,
			code: `a { grid-area:\n\t1 / 2; }`,
			fixed: `a { grid-area:\n\t1\n/ 2; }`,
			line: 2,
			column: 4,
			message: `Expected newline before "/" in a multi-line declaration (${ruleName})`,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			description: `a single-line declaration, which this option does not measure`,
			code: `a { grid-area: 1 / 2; }`,
		},
		{
			description: `no whitespace in front of the solidus of a multi-line declaration`,
			code: `a { grid-area:\n\t1/ 2; }`,
		},
	],

	reject: [
		{
			description: `a newline in front of the solidus, which makes the declaration multi-line`,
			code: `a { grid-area: 1\n/ 2; }`,
			fixed: `a { grid-area: 1/ 2; }`,
			line: 2,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a newline and indentation in front of the solidus of a multi-line declaration`,
			code: `a { grid-area:\n\t1\n\t/ 2; }`,
			fixed: `a { grid-area:\n\t1/ 2; }`,
			line: 3,
			column: 2,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignoreFunctions: [`rgb`], ignoreProperties: [`/^grid-/`] }],

	accept: [
		{
			description: `a solidus inside a call the option names`,
			code: `a { color: rgb(0 0 0 / 50%); }`,
		},
		{
			description: `a solidus in the value of a property the option's pattern matches`,
			code: `a { grid-area: 1 / 2; }`,
		},
	],

	reject: [
		{
			description: `a solidus neither option speaks of`,
			code: `a { font: 12px / 1.5 serif; }`,
			fixed: `a { font: 12px\n/ 1.5 serif; }`,
			line: 1,
			column: 16,
			message: messages.expectedBefore(),
		},
	],
})

// The space twin writes the run in front of the solidus too, and the library lists it behind this rule, so its write would be the file's last (#704)
testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/value-slash-space-before": `always` },

	reject: [
		{
			// The run beside a solidus belongs to one of its two twin rules where their options disagree
			description: `a space in front of the solidus, which the twin behind this rule accepts and would take the break back from, so the warning stands and nothing is written`,
			code: `a { b: 1 / 2 }`,
			fixed: `a { b: 1 / 2 }`,
			line: 1,
			column: 10,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/value-slash-space-before": [`always`, { ignoreProperties: [`b`] }] },

	reject: [
		{
			description: `a declaration whose property the twin's own \`ignoreProperties\` names, so the twin writes nothing and the break is written`,
			code: `a { b: 1 / 2 }`,
			fixed: `a { b: 1\n/ 2 }`,
			line: 1,
			column: 10,
			message: messages.expectedBefore(),
		},
	],
})

// A write emptying the run between two solidi brings them together into a `//` comment, and the twin's write is weighed by that same guard
describe(`the run in front of a solidus under a syntax that spells a \`//\` comment`, () => {
	let rule = `@stylistic/scss/value-slash-newline-before`
	let twin = `@stylistic/scss/value-slash-space-before`

	/**
	 * Fixes a Sass text under this rule, the space twin listed behind it where one is given.
	 * @param code - The text.
	 * @param option - This rule's primary.
	 * @param [twinOption] - The twin's primary, where the twin is configured at all.
	 * @returns What the fix left and what a check of it says.
	 */
	async function fix (code: string, option: string, twinOption?: string): Promise<{
		fixed: string | undefined,
		left: string[],
	}> {
		let config = { plugins, rules: { [rule]: option, ...(twinOption === undefined ? {} : { [twin]: twinOption }) }, customSyntax: scss }
		let ours = await stylelint.lint({ code, config, fix: true })
		let again = await stylelint.lint({ code: ours.code ?? code, config })

		return { fixed: ours.code, left: pick(again.results).warnings.map((warning) => `${warning.line}:${warning.column} ${warning.text}`) }
	}

	it(`leaves the run between two solidi, whose closing would take the rest of the line into a comment`, async () => {
		expect(await fix(`a {\n\tb: 1/  /2,\n\t\t3;\n}`, `never-multi-line`)).toEqual({
			fixed: `a {\n\tb: 1/  /2,\n\t\t3;\n}`,
			left: [`2:9 Unexpected whitespace before "/" in a multi-line declaration (@stylistic/scss/value-slash-newline-before)`],
		})
	})

	it(`writes the break where the space twin's own \`never\` fix is refused over that very run`, async () => {
		expect(await fix(`a { b: 1/  /2 }`, `always`, `never`)).toEqual({
			fixed: `a { b: 1/\n/2 }`,
			left: [`1:9 Expected newline before "/" (@stylistic/scss/value-slash-newline-before)`, `2:1 Unexpected whitespace before "/" (@stylistic/scss/value-slash-space-before)`],
		})
	})

	it(`leaves the run where that twin can write it, its \`never\` taking the whole of it out`, async () => {
		expect(await fix(`a { b: 1  /2 }`, `always`, `never`)).toEqual({
			fixed: `a { b: 1/2 }`,
			left: [`1:9 Expected newline before "/" (@stylistic/scss/value-slash-newline-before)`],
		})
	})
})
