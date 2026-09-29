import { describe, expect, it } from "vitest"

import { race } from "../../../vitest.helpers.ts"
import { CHARSET_RULE_MESSAGE } from "../../utils/asksForTheCharsetRule/index.ts"

import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a break behind the semicolon of a blockless at-rule`,
			code: `@foo;\na {}`,
		},
		{
			description: `a break behind the semicolon of an import`,
			code: `@import 'x.css';\na {}`,
		},
		{
			description: `a name in alternating case, which this rule says nothing about`,
			code: `@iMpOrT 'x.css';\na {}`,
		},
		{
			description: `a name in upper case, which this rule says nothing about`,
			code: `@IMPORT 'x.css';\na {}`,
		},
		{
			description: `a break between two at-rules`,
			code: `@layer base;\na {}`,
		},
		{
			description: `a break in front of an at-rule that closes on nothing`,
			code: `@layer base;\n@import 'x.css'`,
		},
		{
			description: `a break in front of an at-rule that closes on nothing, with a rule behind it`,
			code: `@layer base;\n@import 'x.css'\na {}`,
		},
		{
			description: `a break behind a namespace declaration`,
			code: `@namespace url(XML-namespace-URL);\na {}`,
		},
		{
			autoStripIndent: false,
			description: `a comment behind the semicolon, with the break behind the comment`,
			code: `@import 'x.css'); /* comment */\n`,
		},
		{
			autoStripIndent: false,
			description: `a comment abutting the semicolon, with the break behind the comment`,
			code: `@import 'x.css');/* comment */\n`,
		},
		{
			autoStripIndent: false,
			description: `three spaces between the semicolon and the comment behind it`,
			code: `@import 'x.css');   /* comment */\n`,
		},
		{
			autoStripIndent: false,
			description: `a tab between the semicolon and the comment behind it`,
			code: `@import 'x.css');\t/* comment */\n`,
		},
		{
			autoStripIndent: false,
			description: `a space and a tab between the semicolon and the comment behind it`,
			code: `@import 'x.css'); \t/* comment */\n`,
		},
		{
			description: `a break in front of an at-rule carrying a block`,
			code: `@layer base;\n@media {}`,
		},
		{
			autoStripIndent: false,
			description: `a carriage return and a line feed behind the semicolon`,
			code: `@import 'x.css';\r\n`,
		},
		{
			autoStripIndent: false,
			description: `the same pair behind a comment of its own`,
			code: `@import 'x.css'; /* comment */\r\n`,
		},
		{
			description: `a comment on a line of its own behind the semicolon, with a stray semicolon behind the comment, which is no part of the run behind the at-rule`,
			code: `@import 'x.css';\n/* comment */;\na {}`,
		},
		{
			autoStripIndent: false,
			description: `the same comment and stray semicolon written with carriage-return line breaks`,
			code: `@import 'x.css';\r\n/* comment */;\r\na {}`,
		},
		{
			description: `a comment on a line of its own behind the semicolon, with a rule behind it on the same line`,
			code: `@import 'x.css';\n/* comment */ a {}`,
		},
		{
			description: `an end-of-line comment, then a comment on a line of its own with a rule behind it on the same line`,
			code: `@import 'x.css'; /* one */\n/* two */ a {}`,
		},
		{
			description: `a stray semicolon on a line of its own in front of a comment on the next line, both behind the break`,
			code: `@import 'x.css';\n;\n/* comment */\na {}`,
		},
		{
			description: `a semicolon closing the file, with no line for the break to open`,
			code: `@import 'x.css';`,
		},
		{
			description: `nested at-rules closing on a break, which the parser reads as one statement each`,
			code: `
				a{
				@extend .b;
				@extend .c
				}
			`,
		},
		{
			description: `an at-rule carrying a block, whose stray semicolon is none of this rule's business`,
			code: `@font-face {}; a {}`,
		},
	],

	reject: [
		{
			description: `spaces and a tab between the semicolon and a break the file spells, which go rather than stand as a line of their own`,
			code: `@import "x"; \t\na {}`,
			fixed: `@import "x";\na {}`,
			line: 1,
			column: 13,
			message: messages.expectedAfter(),
		},
		{
			description: `an at-rule spelled without a space in front of its options, with a declaration standing behind its semicolon`,
			code: `span { @layer(l); color: red; }`,
			fixed: `span { @layer(l);\n color: red; }`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `a space where the break belongs`,
			code: `@mixin foo; a {}`,
			fixed: `@mixin foo;\n a {}`,
			line: 1,
			column: 12,
			message: messages.expectedAfter(),
		},
		{
			description: `the same at-rule named in alternating case`,
			code: `@mIxIn foo; a {}`,
			fixed: `@mIxIn foo;\n a {}`,
			line: 1,
			column: 12,
			message: messages.expectedAfter(),
		},
		{
			description: `the same at-rule named in upper case`,
			code: `@MIXIN foo; a {}`,
			fixed: `@MIXIN foo;\n a {}`,
			line: 1,
			column: 12,
			message: messages.expectedAfter(),
		},
		{
			description: `an end-of-line comment with a rule behind it on the same line`,
			code: `@import 'x.css'; /* comment */ a {}`,
			fixed: `@import 'x.css'; /* comment */\n a {}`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `a stray semicolon kept between the semicolon and its break, with a comment on the next line, which stands where a node would`,
			code: `@import 'x.css';;\n/* comment */\na {}`,
			fixed: `@import 'x.css';\n;\n/* comment */\na {}`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			autoStripIndent: false,
			description: `the same stray semicolon and comment written with carriage-return line breaks`,
			code: `@import 'x.css';;\r\n/* comment */\r\na {}`,
			fixed: `@import 'x.css';\r\n;\r\n/* comment */\r\na {}`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `the same stray semicolon with a rule behind the comment on its line, which is the comment's business`,
			code: `@import 'x.css';;\n/* comment */ a {}`,
			fixed: `@import 'x.css';\n;\n/* comment */ a {}`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `a space in front of the break, with a comment on the next line, which goes as in front of any node`,
			code: `@import 'x.css'; \n/* comment */\na {}`,
			fixed: `@import 'x.css';\n/* comment */\na {}`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `a stray semicolon abutting the semicolon, with an end-of-line comment behind it`,
			code: `@import 'x.css';;/* comment */\na {}`,
			fixed: `@import 'x.css';\n;/* comment */\na {}`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `an end-of-line comment, then a stray semicolon and a comment on a line of its own with a rule behind it on the same line`,
			code: `@import 'x.css'; /* one */;\n/* two */ a {}`,
			fixed: `@import 'x.css'; /* one */\n;\n/* two */ a {}`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `a stray semicolon in front of a comment closing the file`,
			code: `@import 'x.css';;\n/* comment */`,
			fixed: `@import 'x.css';\n;\n/* comment */`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `a space between two at-rules of the file's first line`,
			code: `@import url("x.css"); @layer base;`,
			fixed: `@import url("x.css");\n @layer base;`,
			line: 1,
			column: 22,
			message: messages.expectedAfter(),
		},
		{
			description: `a space in front of a rule, whose own stray semicolon closes the file`,
			code: `@layer base; a {};`,
			fixed: `@layer base;\n a {};`,
			line: 1,
			column: 13,
			message: messages.expectedAfter(),
		},
		{
			description: `a space behind the semicolon of a charset, which is no at-rule to the rules reading an at-rule's own text but whose semicolon is the file's, the file getting the warning asking for the core rule as well`,
			code: `@charset "UTF-8"; a {}`,
			fixed: `@charset "UTF-8";\n a {}`,
			warnings: [
				{
					line: 1,
					column: 1,
					message: `${CHARSET_RULE_MESSAGE} (${ruleName})`,
				},
				{
					line: 1,
					column: 18,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			description: `a space between two nested at-rules`,
			code: `
				a{
				@extend .b; @extend .c
				}
			`,
			fixed: `
				a{
				@extend .b;
				 @extend .c
				}
			`,
			line: 2,
			column: 12,
			message: messages.expectedAfter(),
		},
		{
			description: `the same pair on a file broken with carriage returns`,
			code: `a{\r\n@extend .b; @extend .c\r\n}`,
			fixed: `a{\r\n@extend .b;\r\n @extend .c\r\n}`,
			line: 2,
			column: 12,
			message: messages.expectedAfter(),
		},
	],
})

describe(`${ruleName} beside the rules that write the run in front of a comment`, () => {
	let noExtraSemicolons = `@stylistic/no-extra-semicolons`
	let noEolWhitespace = `@stylistic/no-eol-whitespace`

	it(`reads the run in front of a comment as the rule about extra semicolons leaves it, one file in both orders`, async () => {
		expect(await race(ruleName, `@import 'x.css';;\n/* comment */\na {}`, `always`, noExtraSemicolons, true)).toEqual({ ours: `@import 'x.css';\n/* comment */\na {}`, theirs: `@import 'x.css';\n/* comment */\na {}`, left: [] })
	})

	it(`trims the space that rule leaves in front of the break where it takes the semicolon behind the space`, async () => {
		expect(await race(ruleName, `@import 'x.css'; ;\n/* comment */\na {}`, `always`, noExtraSemicolons, true)).toEqual({ ours: `@import 'x.css';\n/* comment */\na {}`, theirs: `@import 'x.css';\n/* comment */\na {}`, left: [] })
	})

	it(`trims the space in front of the break once beside the rule about whitespace at the end of a line, one file in both orders`, async () => {
		expect(await race(ruleName, `@import 'x.css'; \n/* comment */\na {}`, `always`, noEolWhitespace, true)).toEqual({ ours: `@import 'x.css';\n/* comment */\na {}`, theirs: `@import 'x.css';\n/* comment */\na {}`, left: [] })
	})
})
