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
			description: `a newline behind the solidus`,
			code: `a { grid-area: 1 /\n2; }`,
		},
		{
			description: `a newline and indentation behind the solidus`,
			code: `a { grid-area: 1 /\n\t2; }`,
		},
		{
			description: `the same value written with a carriage-return line break`,
			code: `a { grid-area: 1 /\r\n2; }`,
		},
		{
			description: `two newlines behind the solidus`,
			code: `a { grid-area: 1 /\n\n2; }`,
		},
		{
			description: `a block comment standing between the solidus and the newline`,
			code: `a { grid-area: 1 / /*c*/\n2; }`,
		},
		{
			description: `a double slash behind the solidus, which spells the end-of-line comment of a preprocessor and is passed over as the comma twin passes it over`,
			code: `a { grid-area: 1 / // c\n2; }`,
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
			description: `no whitespace behind the solidus`,
			code: `a { grid-area: 1/2; }`,
			fixed: `a { grid-area: 1/\n2; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `a space behind the solidus, which the newline is written in front of, as the comma twin writes it`,
			code: `a { grid-area: 1 / 2; }`,
			fixed: `a { grid-area: 1 /\n 2; }`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab behind the solidus, which stays as the next line's indentation`,
			code: `a { grid-area: 1 /\t2; }`,
			fixed: `a { grid-area: 1 /\n\t2; }`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `a block comment behind the solidus with no newline behind it: the newline is written behind the comment`,
			code: `a { grid-area: 1 / /*c*/ 2; }`,
			fixed: `a { grid-area: 1 / /*c*/\n 2; }`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `a newline in front of the solidus and none behind it`,
			code: `a { grid-area: 1\n/ 2; }`,
			fixed: `a { grid-area: 1\n/\n 2; }`,
			line: 2,
			column: 1,
			message: messages.expectedAfter(),
		},
		{
			description: `no whitespace behind either of two solidi`,
			code: `a { grid-area: 1/2/3; }`,
			fixed: `a { grid-area: 1/\n2/\n3; }`,
			warnings: [
				{
					line: 1,
					column: 17,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 19,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			description: `a declaration inside a multi-line block`,
			code: `a {\n\tgrid-area: 1/2;\n}`,
			fixed: `a {\n\tgrid-area: 1/\n2;\n}`,
			line: 2,
			column: 14,
			message: messages.expectedAfter(),
		},
		{
			description: `the solidus of a colour function`,
			code: `a { color: rgb(0 0 0 / 50%); }`,
			fixed: `a { color: rgb(0 0 0 /\n 50%); }`,
			line: 1,
			column: 22,
			message: messages.expectedAfter(),
		},
		{
			// Pins the refusal to part the name of a bare address from the solidus, which switches how PostCSS reads its parentheses
			description: `a solidus glued to the name of a bare address holding a string with a closing parenthesis, which a written break would make the tokenizer close inside the string`,
			code: `a { b: 1/url(a ")" b) 2px; c: "d" }`,
			fixed: `a { b: 1/url(a ")" b) 2px; c: "d" }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			// Pins the reading of a separator solidus behind a star as text of the name's word, which no comment ends there
			description: `a solidus behind a star glued to the name of a bare address holding a string with a closing parenthesis, which a written break would make the tokenizer close inside the string`,
			code: `a { b: 1*/url(a ")" b) 2px; c: "d" }`,
			fixed: `a { b: 1*/url(a ")" b) 2px; c: "d" }`,
			line: 1,
			column: 10,
			message: messages.expectedAfter(),
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
			description: `a newline behind the solidus of a multi-line declaration`,
			code: `a { grid-area:\n\t1 /\n\t2; }`,
		},
	],

	reject: [
		{
			description: `the message spelled out, since asking the rule for its own text would miss one that says the opposite of what the option asks (see #175)`,
			code: `a { grid-area:\n\t1 / 2; }`,
			fixed: `a { grid-area:\n\t1 /\n 2; }`,
			line: 2,
			column: 4,
			message: `Expected newline after "/" in a multi-line declaration (${ruleName})`,
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
			description: `no whitespace behind the solidus of a multi-line declaration`,
			code: `a { grid-area:\n\t1 /2; }`,
		},
	],

	reject: [
		{
			description: `a newline behind the solidus, which makes the declaration multi-line`,
			code: `a { grid-area: 1 /\n2; }`,
			fixed: `a { grid-area: 1 /2; }`,
			line: 1,
			column: 18,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a newline and indentation behind the solidus of a multi-line declaration`,
			code: `a { grid-area:\n\t1 /\n\t\t2; }`,
			fixed: `a { grid-area:\n\t1 /2; }`,
			line: 2,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a block comment behind the solidus and a newline behind the comment, which is taken away behind the comment`,
			code: `a { grid-area: 1 / /*c*/\n2; }`,
			fixed: `a { grid-area: 1 / /*c*/2; }`,
			line: 1,
			column: 18,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			// Pins the refusal to join the name of a bare address to the solidus, which switches how PostCSS reads its parentheses
			description: `a break between a solidus and the name of a bare address holding a quotation mark nothing closes, which taking the break away would make the tokenizer read as a string`,
			code: `a {\n  b: 1/\nurl(a"b)\n    2px; c: "d" }`,
			fixed: `a {\n  b: 1/\nurl(a"b)\n    2px; c: "d" }`,
			line: 2,
			column: 7,
			message: messages.rejectedAfterMultiLine(),
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
			fixed: `a { font: 12px /\n 1.5 serif; }`,
			line: 1,
			column: 16,
			message: messages.expectedAfter(),
		},
	],
})

// The space twin writes the run behind the solidus too, and the library lists it behind this rule, so its write would be the file's last (#704)
testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/value-slash-space-after": `always` },

	reject: [
		{
			// The run beside a solidus belongs to one of its two twin rules where their options disagree
			description: `a space behind the solidus, which the twin behind this rule accepts and would take the break back from, so the warning stands and nothing is written`,
			code: `a { b: 1 / 2 }`,
			fixed: `a { b: 1 / 2 }`,
			line: 1,
			column: 10,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment behind the solidus, past which this rule reads while the twin reads the run at the solidus, so the two contend for nothing and the break is written`,
			code: `a { b: 1 / /* c */ 2 }`,
			fixed: `a { b: 1 / /* c */\n 2 }`,
			line: 1,
			column: 10,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/value-slash-space-after": [`always`, { ignoreFunctions: [`f`] }] },

	reject: [
		{
			description: `a solidus inside a call the twin's own \`ignoreFunctions\` names, which the twin never writes, so the break is written`,
			code: `a { b: f(1 / 2) }`,
			fixed: `a { b: f(1 /\n 2) }`,
			line: 1,
			column: 12,
			message: messages.expectedAfter(),
		},
	],
})

// See #704
describe(`the run behind a solidus under a syntax that spells a \`//\` comment`, () => {
	let rule = `@stylistic/scss/value-slash-newline-after`
	let twin = `@stylistic/scss/value-slash-space-after`

	/**
	 * Fixes a Sass text under this rule and its space twin, the twin listed behind it.
	 * @param code - The text.
	 * @param option - This rule's primary.
	 * @param twinOption - The twin's primary.
	 * @returns What the fix left and what a check of it says.
	 */
	async function race (code: string, option: string, twinOption: string): Promise<{
		fixed: string | undefined,
		left: string[],
	}> {
		let config = { plugins, rules: { [rule]: option, [twin]: twinOption }, customSyntax: scss }
		let ours = await stylelint.lint({ code, config, fix: true })
		let again = await stylelint.lint({ code: ours.code ?? code, config })

		return { fixed: ours.code, left: pick(again.results).warnings.map((warning) => `${warning.line}:${warning.column} ${warning.text}`) }
	}

	it(`writes the break where the twin's own \`never\` fix is refused, since closing that run would bring the two solidi together into a comment`, async () => {
		expect(await race(`a { b: 1/  /2 }`, `always`, `never`)).toEqual({
			fixed: `a { b: 1/\n  /2 }`,
			left: [`2:3 Expected newline after "/" (@stylistic/scss/value-slash-newline-after)`, `1:9 Unexpected whitespace after "/" (@stylistic/scss/value-slash-space-after)`],
		})
	})

	it(`leaves the run where that twin can write it, its \`never\` taking the whole of it out`, async () => {
		expect(await race(`a { b: 1/  2 }`, `always`, `never`)).toEqual({
			fixed: `a { b: 1/2 }`,
			left: [`1:9 Expected newline after "/" (@stylistic/scss/value-slash-newline-after)`],
		})
	})
})
