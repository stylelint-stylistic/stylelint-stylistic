import less from "postcss-less"
import scss from "postcss-scss"
import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import { pick } from "../../../vitest.helpers.ts"
import plugins from "../../index.ts"

import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [true],

	accept: [
		{
			// The run is read over the copy with the escapes masked, so the character a backslash covers is none of it
			description: `an escaped tab and a space behind it, where the tab is a character of the word and the space the only whitespace`,
			code: `a { b: c\\\t ; d: e }`,
		},
		{
			// The first whitespace character behind a hexadecimal escape closes it and is none of the run
			description: `a hexadecimal escape closed by the first of two spaces, the second of which parts the words`,
			code: `a { b: c\\2c  d }`,
		},
		{
			// An escape of four digits closes on the space just as one of two does, which a mask reading a fixed length would miss
			description: `a four-digit hexadecimal escape closed by the first of two spaces`,
			code: `a { b: c\\1f60  d; e: f }`,
		},
		{
			// The escapes of a bare address are masked as the rest of a value's are, so what a backslash covers there is no run either
			description: `an escaped space inside a bare address, and one space behind it`,
			code: `a { b: url(c\\  d) }`,
		},
		{
			description: `a hexadecimal escape inside a bare address, closed by the first of two spaces`,
			code: `a { b: url(c\\2c  d) }`,
		},
		{
			description: `double spaces inside comments, which the rule does not read`,
			code: `/* This  is  comment */\na { gap: 0 /* And   another   comment */ }`,
		},
		{
			// A comment standing between the words of a value reaches the rule, where a trailing one is kept out of the value, and the walk read its text as code
			description: `double spaces inside a comment standing between the words of a value`,
			code: `a { b: c /* x  y */ d }`,
		},
		{
			// No escape span covers a backslash inside a comment, so the write took the tab it covers along with the run
			description: `an escaped tab in front of a run, both inside such a comment`,
			code: `a { b: c /* x\\\t  y */ d }`,
		},
		{
			// The mark used to open a string of the walk's own, which closed on the one opening the value's string and left the run inside it outside one
			description: `a run inside a string behind a comment holding one quotation mark`,
			code: `a { b: c /* " */ "x  y" }`,
		},
		{
			description: `spaces inside a string`,
			code: `a::before { content: "   " }`,
		},
		{
			description: `spaces inside the strings of a named grid area`,
			code: `a { grid-template-areas: "a  b" "c  d" }`,
		},
		{
			description: `a single space between the parts of a value`,
			code: `a { gap: 1em 2em }`,
		},
		{
			description: `single spaces around a slash`,
			code: `a { aspect-ratio: 1 / 2 }`,
		},
		{
			description: `a slash with no spaces around it`,
			code: `a { aspect-ratio: 1/2 }`,
		},
		{
			description: `single spaces between the arguments of a function`,
			code: `a { color: rgb(0 0 0) }`,
		},
		{
			description: `a slash with no spaces around it inside a function`,
			code: `a { color: rgb(0 0 0/0) }`,
		},
		{
			description: `single spaces around a slash inside a function`,
			code: `a { color: rgb(0 0 0 / 0) }`,
		},
		{
			description: `a comma with no space after it inside a function`,
			code: `a { transform: translate(50%,50%) }`,
		},
		{
			description: `a single space after a comma inside a function`,
			code: `a { transform: translate(50%, 50%) }`,
		},
		{
			description: `indentation on the line after the opening brace`,
			code: `a {\n  color: pink }`,
		},
		{
			description: `indentation on the line after a declaration`,
			code: `a { color: red;\n  top: 0 }`,
		},
		{
			description: `indentation inside a value broken over three lines`,
			code: `
				a {
				  background-position:
				    top left,
				    top right;
				}
			`,
		},
	],

	reject: [
		{
			// Pins both runs of the value collapsed while the run inside the comment between them stays where it was
			description: `two spaces on either side of a comment holding two more`,
			code: `a { b: c  /* x  y */  d }`,
			fixed: `a { b: c /* x  y */ d }`,
			message: messages.rejected,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.rejected,
				},
				{
					line: 1,
					column: 21,
					message: messages.rejected,
				},
			],
		},
		{
			// The run used to stand inside the string the comment's mark opened, and was passed over with it
			description: `two spaces behind a comment holding one quotation mark`,
			code: `a { b: c /* " */ d  e }`,
			fixed: `a { b: c /* " */ d e }`,
			line: 1,
			column: 19,
			message: messages.rejected,
		},
		{
			// Pins the escaped tab kept and the run behind it collapsed, where the write used to take the tab as well
			description: `two spaces behind an escaped tab`,
			code: `a { b: c\\\t  d; e: f }`,
			fixed: `a { b: c\\\t d; e: f }`,
			line: 1,
			column: 11,
			message: messages.rejected,
		},
		{
			// Pins the character closing a hexadecimal escape kept out of the run
			description: `a hexadecimal escape closed by the first of three spaces`,
			code: `a { b: c\\2c   d }`,
			fixed: `a { b: c\\2c  d }`,
			line: 1,
			column: 13,
			message: messages.rejected,
		},
		{
			// An escaped apostrophe opens no string, and the rest of the value was passed over behind one
			description: `two spaces further along a value holding an escaped apostrophe, which opens no string`,
			code: `a { b: c\\'d  e; f: g }`,
			fixed: `a { b: c\\'d e; f: g }`,
			line: 1,
			column: 12,
			message: messages.rejected,
		},
		{
			// Pins a four-digit escape read to its end, where a mask of a fixed length would take the closing space for a run
			description: `three spaces behind a four-digit hexadecimal escape`,
			code: `a { b: c\\1f60   d; e: f }`,
			fixed: `a { b: c\\1f60  d; e: f }`,
			line: 1,
			column: 15,
			message: messages.rejected,
		},
		{
			// Pins a form feed closing a hexadecimal escape, which the write used to carry off with the run
			description: `two spaces behind a hexadecimal escape closed by a form feed`,
			code: `a { b: c\\2c\f  d; e: f }`,
			fixed: `a { b: c\\2c\f d; e: f }`,
			line: 1,
			column: 13,
			message: messages.rejected,
		},
		{
			// Pins the write the mask lets through: an even run of backslashes spells an escaped backslash, and the whitespace behind it is a run of its own
			description: `two spaces behind an escaped backslash`,
			code: `a { b: c\\\\  d; e: f }`,
			fixed: `a { b: c\\\\ d; e: f }`,
			line: 1,
			column: 11,
			message: messages.rejected,
		},
		{
			// Pins the escaped tab kept where the run stands inside a bare address, whose escapes the walk used to hand over none of
			description: `two spaces behind an escaped tab inside a bare address`,
			code: `a { b: url(c\\\t  d) }`,
			fixed: `a { b: url(c\\\t d) }`,
			line: 1,
			column: 15,
			message: messages.rejected,
		},
		{
			// The parentheses hold a line break, so they are no address span, and the escape is recorded all the same
			description: `the same run inside parentheses a line break keeps from being an address`,
			code: `a { b: url(c\\\t  \n d) }`,
			fixed: `a { b: url(c\\\t \n d) }`,
			line: 1,
			column: 15,
			message: messages.rejected,
		},
		{
			// Pins the write a bare address keeps: nothing covers this run, and the mask leaves it where it was
			description: `two spaces between the words of a bare address`,
			code: `a { b: url(c  d) }`,
			fixed: `a { b: url(c d) }`,
			line: 1,
			column: 13,
			message: messages.rejected,
		},
		{
			// A bare carriage return is whitespace of the line to PostCSS, as a form feed is, and the rule read it as a line break with indentation behind it
			description: `a bare carriage return and a tab run behind it`,
			code: `a {\n\tb: c\r\t\td;\n}`,
			fixed: `a {\n\tb: c d;\n}`,
			line: 2,
			column: 6,
			message: messages.rejected,
		},
		{
			description: `the same carriage return between two spaces`,
			code: `a { b: c \r d; e: f }`,
			fixed: `a { b: c d; e: f }`,
			line: 1,
			column: 9,
			message: messages.rejected,
		},
		{
			// A backslash in front of a line break is a delimiter, and a space written in place of the break would be read as its escape
			description: `a run opening on a bare carriage return behind a backslash, which a written space would escape`,
			code: `a { b: c\\\r  d; e: f }`,
			fixed: `a { b: c\\\rd; e: f }`,
			line: 1,
			column: 10,
			message: messages.rejected,
		},
		{
			description: `the same run opening on a form feed`,
			code: `a { b: c\\\f  d; e: f }`,
			fixed: `a { b: c\\\fd; e: f }`,
			line: 1,
			column: 10,
			message: messages.rejected,
		},
		{
			// A quotation mark inside a bare address is a character of it, and the walk opened a string there that nothing closed
			description: `two spaces behind a bare address holding a quotation mark`,
			code: `a { b: url(c"d)  e; f: g }`,
			fixed: `a { b: url(c"d) e; f: g }`,
			line: 1,
			column: 16,
			message: messages.rejected,
		},
		{
			description: `the same run behind an address holding a single quotation mark, and a run inside a second address holding one`,
			code: `a { b: url(c'd)  e, url(f'g  h); i: j }`,
			fixed: `a { b: url(c'd) e, url(f'g h); i: j }`,
			warnings: [
				{
					line: 1,
					column: 16,
					message: messages.rejected,
				},
				{
					line: 1,
					column: 28,
					message: messages.rejected,
				},
			],
		},
		{
			// The carriage return closing the escape is a character of it rather than a break of the value, so the run behind it is one the rule used to read as indentation
			description: `two spaces behind a hexadecimal escape a carriage return closes inside a bare address`,
			code: `a { b: url(c\\2c\r  d) }`,
			fixed: `a { b: url(c\\2c\r d) }`,
			line: 1,
			column: 17,
			message: messages.rejected,
		},
		{
			description: `two spaces between the parts of a value`,
			code: `a { gap: 1em  2em }`,
			fixed: `a { gap: 1em 2em }`,
			line: 1,
			column: 13,
			message: messages.rejected,
		},
		{
			description: `two spaces between two strings`,
			code: `a { grid-template-areas: "a  b"  "c  d" }`,
			fixed: `a { grid-template-areas: "a  b" "c  d" }`,
			line: 1,
			column: 32,
			message: messages.rejected,
		},
		{
			description: `two spaces in front of a slash`,
			code: `a { aspect-ratio: 1  / 2 }`,
			fixed: `a { aspect-ratio: 1 / 2 }`,
			line: 1,
			column: 20,
			message: messages.rejected,
		},
		{
			description: `two spaces behind a slash`,
			code: `a { aspect-ratio: 1 /  2 }`,
			fixed: `a { aspect-ratio: 1 / 2 }`,
			line: 1,
			column: 22,
			message: messages.rejected,
		},
		{
			description: `two spaces after the first argument of a function`,
			code: `a { color: rgb(0  0 0) }`,
			fixed: `a { color: rgb(0 0 0) }`,
			line: 1,
			column: 17,
			message: messages.rejected,
		},
		{
			description: `two spaces after the second argument of a function`,
			code: `a { color: rgb(0 0  0) }`,
			fixed: `a { color: rgb(0 0 0) }`,
			line: 1,
			column: 19,
			message: messages.rejected,
		},
		{
			description: `two spaces in front of a slash inside a function`,
			code: `a { color: rgb(0 0 0  / 0) }`,
			fixed: `a { color: rgb(0 0 0 / 0) }`,
			line: 1,
			column: 21,
			message: messages.rejected,
		},
		{
			description: `two spaces behind a slash inside a function`,
			code: `a { color: rgb(0 0 0 /  0) }`,
			fixed: `a { color: rgb(0 0 0 / 0) }`,
			line: 1,
			column: 23,
			message: messages.rejected,
		},
		{
			description: `two spaces after a comma inside a function`,
			code: `a { transform: translate(50%,  50%) }`,
			fixed: `a { transform: translate(50%, 50%) }`,
			line: 1,
			column: 30,
			message: messages.rejected,
		},
		{
			description: `two spaces on the second line of a value`,
			code: `
				a {
				  background-position:
				    top  left,
				    top right;
				}
			`,
			fixed: `
				a {
				  background-position:
				    top left,
				    top right;
				}
			`,
			line: 3,
			column: 8,
			message: messages.rejected,
		},
		{
			description: `two spaces on the third line of a value`,
			code: `
				a {
				  background-position:
				    top left,
				    top  right;
				}
			`,
			fixed: `
				a {
				  background-position:
				    top left,
				    top right;
				}
			`,
			line: 4,
			column: 8,
			message: messages.rejected,
		},
		{
			description: `two spaces on both lines of a value`,
			code: `
				a {
				  background-position:
				    top  left,
				    top  right;
				}
			`,
			fixed: `
				a {
				  background-position:
				    top left,
				    top right;
				}
			`,
			message: messages.rejected,
			warnings: [
				{
					line: 3,
					column: 8,
					message: messages.rejected,
				},
				{
					line: 4,
					column: 8,
					message: messages.rejected,
				},
			],
		},
	],
})

// The expression of an interpolation is read only under the parser whose tokenizer reads one, and the escapes standing in it have to be recorded: otherwise the write takes the character a backslash covers for whitespace of the run
describe(`a run behind an escape inside an interpolation of a bare address`, () => {
	let scssRule = `@stylistic/scss/no-multiple-whitespaces`

	/**
	 * Fixes a text under this rule in the SCSS namespace, whose parser is the one that reads an interpolation.
	 * @param code - The text.
	 * @returns What the fix left and what a check of it says.
	 */
	async function fix (code: string): Promise<{
		fixed: string | undefined,
		left: string[],
	}> {
		let config = { plugins, rules: { [scssRule]: true }, customSyntax: scss }
		let ours = await stylelint.lint({ code, config, fix: true })
		let again = await stylelint.lint({ code: ours.code ?? code, config })

		return { fixed: ours.code, left: pick(again.results).warnings.map((warning) => `${warning.line}:${warning.column} ${warning.text}`) }
	}

	it(`keeps the escaped tab and collapses the run behind it`, async () => {
		expect(await fix(`a { b: url(c#{d\\\t  e}f) }`)).toEqual({ fixed: `a { b: url(c#{d\\\t e}f) }`, left: [] })
	})

	it(`leaves the text where the escape covers the first of two spaces`, async () => {
		expect(await fix(`a { b: url(c#{d\\  e}f) }`)).toEqual({ fixed: `a { b: url(c#{d\\  e}f) }`, left: [] })
	})

	it(`leaves the space closing a hexadecimal escape out of the run`, async () => {
		expect(await fix(`a { b: url(c#{d\\2c  e}f) }`)).toEqual({ fixed: `a { b: url(c#{d\\2c  e}f) }`, left: [] })
	})

	it(`reads the run inside the expression where no escape covers it`, async () => {
		expect(await fix(`a { b: url(c#{d  e}f) }`)).toEqual({ fixed: `a { b: url(c#{d e}f) }`, left: [] })
	})
})

// A parser spelling a double slash leaves the comment in the value a rule reads, and the walk read the run inside it as code; plain CSS spells none there, so the same text is code to the core
/**
 * Fixes a text under one namespace of this rule.
 * @param configured - The rule's name in that namespace.
 * @param text - The stylesheet.
 * @param customSyntax - The parser, or nothing for plain CSS.
 * @returns What the fix left.
 */
async function fixUnder (configured: string, text: string, customSyntax?: typeof less | typeof scss): Promise<string | undefined> {
	return (await stylelint.lint({ code: text, config: { plugins, rules: { [configured]: true }, ...(customSyntax && { customSyntax }) }, fix: true })).code
}

describe(`a run inside a double-slash comment of a value`, () => {
	let code = `a { b: c // x  y\n; }`

	it(`leaves the comment where the Less parser hands it over`, async () => {
		expect(await fixUnder(`@stylistic/less/no-multiple-whitespaces`, code, less)).toBe(code)
	})

	it(`leaves the comment where the SCSS parser hands it over`, async () => {
		expect(await fixUnder(`@stylistic/scss/no-multiple-whitespaces`, code, scss)).toBe(code)
	})

	it(`collapses the run under plain CSS, which reads the double slash as code`, async () => {
		expect(await fixUnder(ruleName, code)).toBe(`a { b: c // x y\n; }`)
	})

	it(`leaves the run behind the double slash of an address Sass reads as code`, async () => {
		let address = `a { b: url(http://x/y  z.png) }`

		expect(await fixUnder(`@stylistic/scss/no-multiple-whitespaces`, address, scss)).toBe(address)
	})

	it(`collapses the same run under Less, whose parentheses hold the address whole`, async () => {
		expect(await fixUnder(`@stylistic/less/no-multiple-whitespaces`, `a { b: url(http://x/y  z.png) }`, less)).toBe(`a { b: url(http://x/y z.png) }`)
	})
})

// A quotation mark inside the parentheses of a lower-case `url()` is a character of the address to the tokenizer, while a compiler may read a string there
describe(`a run inside a string a compiler reads in the parentheses of a url()`, () => {
	let code = `a { b: url(c"d  e")  f }`

	it(`leaves the string and collapses the run behind it under the SCSS parser`, async () => {
		expect(await fixUnder(`@stylistic/scss/no-multiple-whitespaces`, code, scss)).toBe(`a { b: url(c"d  e") f }`)
	})

	it(`collapses both runs under plain CSS, which reads no string there`, async () => {
		expect(await fixUnder(ruleName, code)).toBe(`a { b: url(c"d e") f }`)
	})

	it(`leaves a string inside an interpolation under the SCSS parser`, async () => {
		expect(await fixUnder(`@stylistic/scss/no-multiple-whitespaces`, `a { b: url(c#{"d  e"})  f }`, scss)).toBe(`a { b: url(c#{"d  e"}) f }`)
	})

	it(`leaves an escaped string under the Less parser`, async () => {
		expect(await fixUnder(`@stylistic/less/no-multiple-whitespaces`, `a { b: url(~"c  d")  e }`, less)).toBe(`a { b: url(~"c  d") e }`)
	})
})

// Less and Sass end a double-slash comment at a bare carriage return, and a run opening on it took the break away and carried the comment on over the code behind
describe(`a run behind a double-slash comment a bare carriage return closes`, () => {
	let code = `a {\n\tb: c // x\r  y\n\t\td;\n}`

	it(`leaves the break closing the comment under the SCSS parser`, async () => {
		expect(await fixUnder(`@stylistic/scss/no-multiple-whitespaces`, code, scss)).toBe(code)
	})

	it(`leaves the break closing the comment under the Less parser`, async () => {
		expect(await fixUnder(`@stylistic/less/no-multiple-whitespaces`, code, less)).toBe(code)
	})
})
