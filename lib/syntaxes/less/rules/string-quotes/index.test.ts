import { createRule } from "../../../../rules/string-quotes/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`double`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `single quotes inside an end-of-line comment, which the rule does not read`,
			code: `
				a {
				  // 'horse'
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/343
			// The reading is CSS's rather than this syntax's: Sass compiles `aurl(a/b)` and `éurl(a/b)` alike and fails on `aurl(a//b)` and `éurl(a//b)` alike, at one offset that is the length of the file, the comment the double slash opens having carried off the closing parenthesis, while `lightningcss` leaves all four whole.
			description: `single quotes behind a call whose name opens on a code point outside ASCII, which leaves them inside the text of a comment`,
			code: `a { b: \u00E9url(http://a/b.png) 'horse'; }`,
		},
	],

	reject: [
		{
			description: `a single-quoted value standing behind an end-of-line comment that carries quotes of its own`,
			code: `a::before {\n  // 'horse'\n  content: 'thing'; }`,
			fixed: `a::before {\n  // 'horse'\n  content: "thing"; }`,
			line: 3,
			column: 12,
			message: messages.expected(`double`),
		},
		{
			description: `a single-quoted value standing behind three end-of-line comments`,
			code: `a::before {\n// one\n// two\n// three\n  content: 'thing'; }`,
			fixed: `a::before {\n// one\n// two\n// three\n  content: "thing"; }`,
			line: 5,
			column: 12,
			message: messages.expected(`double`),
		},
		{
			description: `accurate positions on both sides of a comment inside the value`,
			code: `
				a {
					content: 'x' /* c */ 'y';
				}
			`,
			fixed: `
				a {
					content: "x" /* c */ "y";
				}
			`,
			warnings: [
				{
					line: 2,
					column: 11,
					message: messages.expected(`double`),
				},
				{
					line: 2,
					column: 23,
					message: messages.expected(`double`),
				},
			],
		},
		{
			description: `a single-quoted value in a Less at-variable`,
			code: `@foo: 'bar';`,
			fixed: `@foo: "bar";`,
			line: 1,
			column: 7,
			message: messages.expected(`double`),
		},
		{
			description: `a Less at-variable holding a comment`,
			code: `
				@foo: (
					/* c */
					'a'
				);
			`,
			fixed: `
				@foo: (
					/* c */
					"a"
				);
			`,
			line: 3,
			column: 2,
			message: messages.expected(`double`),
		},
	],
})
testRule({
	ruleName,
	config: [`single`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/32
			description: `ignores double quotes inside a // comment of a multi-line variable`,
			code: `
				@foo: 'bar', // Some "comment"
				  'baz';
			`,
		},
		{
			description: `ignores double quotes inside a // comment of a multi-line value`,
			code: `
				a {
					color: 'bar', // Some "comment"
						'baz';
				}
			`,
		},
		{
			description: `ignores double quotes inside a // comment standing in the arguments of a call`,
			code: `
				a {
					background: image-url(a, // Some "comment"
						'baz');
				}
			`,
		},
		{
			description: `ignores double quotes inside a // comment standing in the arguments of a call with an interpolated name`,
			code: `
				a {
					background: @{p}url(x, // Some "comment"
						'baz');
				}
			`,
		},
		{
			description: `ignores double quotes inside a // comment standing in the arguments of a call whose name merely ends in the letters of a URL`,
			code: `
				a {
					background: myurl(//x) "z";
				}
			`,
		},
		{
			description: `ignores double quotes inside a // comment behind a URL whose parenthesis is never closed`,
			code: `
				a {
					background: url(a(b), // Some "comment"
						'baz';
				}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/171
			description: `an attribute value spelling a Less extend, which the syntax marks the whole rule as one for`,
			code: `[title=":extend(x)"] {}`,
			fixed: `[title=':extend(x)'] {}`,
			line: 1,
			column: 8,
			message: messages.expected(`single`),
		},
		{
			description: `a string in front of a // comment inside the value is reported, and the fix leaves the comment alone`,
			code: `
				a {
					color: "bar", // Some "comment"
						'baz';
				}
			`,
			fixed: `
				a {
					color: 'bar', // Some "comment"
						'baz';
				}
			`,
			line: 2,
			column: 9,
			message: messages.expected(`single`),
		},
		{
			description: `a // comment ends with its line, so a string on the next one is still reported`,
			code: `
				a {
					color: 'bar', // Some "comment"
						"baz";
				}
			`,
			fixed: `
				a {
					color: 'bar', // Some "comment"
						'baz';
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`single`),
		},
		{
			description: `a double slash inside a string opens no comment, so a string behind it on the same line is still reported`,
			code: `
				a {
					background: url("//cdn.example.com/a.png"), url("b.png"), // Some "comment"
						'baz';
				}
			`,
			fixed: `
				a {
					background: url('//cdn.example.com/a.png'), url('b.png'), // Some "comment"
						'baz';
				}
			`,
			warnings: [
				{
					line: 2,
					column: 18,
					message: messages.expected(`single`),
				},
				{
					line: 2,
					column: 50,
					message: messages.expected(`single`),
				},
			],
		},
		{
			description: `a double slash inside a bare URL opens no comment`,
			code: `a { background: url(//cdn.example.com/a.png), url("b.png"); }`,
			fixed: `a { background: url(//cdn.example.com/a.png), url('b.png'); }`,
			line: 1,
			column: 51,
			message: messages.expected(`single`),
		},
		{
			description: `a double slash inside a block comment opens no comment`,
			code: `a { background: url(a.png) /* see //cdn */, url("b.png"); }`,
			fixed: `a { background: url(a.png) /* see //cdn */, url('b.png'); }`,
			line: 1,
			column: 49,
			message: messages.expected(`single`),
		},
		{
			description: `an address brings parentheses of its own, and the URL ends at the one that matches`,
			code: `a { background: url(e(@x)//y.png), "z"; }`,
			fixed: `a { background: url(e(@x)//y.png), 'z'; }`,
			line: 1,
			column: 36,
			message: messages.expected(`single`),
		},
		{
			description: `a quoted address opens no comment either, and the URL still ends at its own parenthesis`,
			code: `a { background: url("a" //b) "z"; }`,
			fixed: `a { background: url('a' //b) 'z'; }`,
			warnings: [
				{
					line: 1,
					column: 21,
					message: messages.expected(`single`),
				},
				{
					line: 1,
					column: 30,
					message: messages.expected(`single`),
				},
			],
		},
		{
			description: `a quotation mark left open inside an address closes the URL nowhere, and a URL left open is taken for none`,
			code: `a { background: url(a/a,')//x "z"; }`,
			fixed: `a { background: url(a/a,')//x 'z'; }`,
			line: 1,
			column: 31,
			message: messages.expected(`single`),
		},
		{
			description: `a parenthesis inside a quoted address closes the URL no more than a bare one does`,
			code: `a { background: url("http://x/a)b//c") "z"; }`,
			fixed: `a { background: url('http://x/a)b//c') 'z'; }`,
			warnings: [
				{
					line: 1,
					column: 21,
					message: messages.expected(`single`),
				},
				{
					line: 1,
					column: 40,
					message: messages.expected(`single`),
				},
			],
		},
		{
			description: `a block comment left open runs to the end of the value rather than back to its start`,
			code: `a { background: url(a/* unclosed // b) "z"; }`,
			fixed: `a { background: url(a/* unclosed // b) 'z'; }`,
			line: 1,
			column: 40,
			message: messages.expected(`single`),
		},
		{
			description: `a string closes at the quotation mark that opened it, so an apostrophe in one starts nothing`,
			code: `a { content: "it's" // c "q"\n  "z"; }`,
			fixed: `a { content: "it's" // c "q"\n  'z'; }`,
			line: 2,
			column: 3,
			message: messages.expected(`single`),
		},
		{
			description: `the name of a URL is recognized whatever its case`,
			code: `a { background: URL(//cdn.example.com/a.png), url("b.png"); }`,
			fixed: `a { background: URL(//cdn.example.com/a.png), url('b.png'); }`,
			line: 1,
			column: 51,
			message: messages.expected(`single`),
		},
		{
			description: `an escaped parenthesis closes no URL, so the double slash of its address still opens no comment`,
			code: `a { background: url(a\\)//b.png) "c"; }`,
			fixed: `a { background: url(a\\)//b.png) 'c'; }`,
			line: 1,
			column: 33,
			message: messages.expected(`single`),
		},
		{
			description: `a parenthesis inside a block comment closes no URL either`,
			code: `a { background: url(a /* ) */ //b.png) "c"; }`,
			fixed: `a { background: url(a /* ) */ //b.png) 'c'; }`,
			line: 1,
			column: 40,
			message: messages.expected(`single`),
		},
		{
			description: `an escaped quotation mark closes no string, so the double slash of the next one opens no comment`,
			code: `a { content: "x\\"y" "//z" "w"; }`,
			fixed: `a { content: 'x\\"y' '//z' 'w'; }`,
			warnings: [
				{
					line: 1,
					column: 14,
					message: messages.expected(`single`),
				},
				{
					line: 1,
					column: 21,
					message: messages.expected(`single`),
				},
				{
					line: 1,
					column: 27,
					message: messages.expected(`single`),
				},
			],
		},
	],
})
testRule({
	ruleName,
	config: [`double`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `ignores single quotes inside a // comment of a multi-line value`,
			code: `
				a {
					color: "bar", // Some 'comment'
						"baz";
				}
			`,
		},
	],

	reject: [
		{
			description: `a string in front of a // comment inside the value is reported, and the fix leaves the comment alone`,
			code: `
				a {
					color: 'bar', // Some 'comment'
						"baz";
				}
			`,
			fixed: `
				a {
					color: "bar", // Some 'comment'
						"baz";
				}
			`,
			line: 2,
			column: 9,
			message: messages.expected(`double`),
		},
		{
			description: `a single quotation mark in the text of a // comment closes nothing, so the strings behind it are read where they stand`,
			code: `
				a {
					color: 'x', // a ' b
						'y', // c ' d
						'z';
				}
			`,
			fixed: `
				a {
					color: "x", // a ' b
						"y", // c ' d
						"z";
				}
			`,
			warnings: [
				{
					line: 2,
					column: 9,
					message: messages.expected(`double`),
				},
				{
					line: 3,
					column: 3,
					message: messages.expected(`double`),
				},
				{
					line: 4,
					column: 3,
					message: messages.expected(`double`),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`single`],
	customSyntax: `postcss-html`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/101
			description: `ignores double quotes inside a // comment of a block written in Less`,
			code: `
				<style lang="less">
				a {
					color: 'bar', // Some "comment"
						'baz';
				}
				</style>
			`,
		},
	],

	reject: [
		{
			description: `a string in front of a // comment of such a block is reported, and the fix leaves the comment alone`,
			code: `
				<style lang="less">
				a {
					color: "bar", // Some "comment"
						'baz';
				}
				</style>
			`,
			fixed: `
				<style lang="less">
				a {
					color: 'bar', // Some "comment"
						'baz';
				}
				</style>
			`,
			line: 3,
			column: 9,
			message: messages.expected(`single`),
		},
		{
			description: `each block of a page is asked about its own language, so a double slash opens a comment in one and not in the next`,
			code: `
				<style lang="less">
				a { color: 'x', // c "q"
					'y'; }
				</style>
				<style>
				b { --u: //cdn/x "z"; }
				</style>
			`,
			fixed: `
				<style lang="less">
				a { color: 'x', // c "q"
					'y'; }
				</style>
				<style>
				b { --u: //cdn/x 'z'; }
				</style>
			`,
			line: 6,
			column: 18,
			message: messages.expected(`single`),
		},
	],
})
