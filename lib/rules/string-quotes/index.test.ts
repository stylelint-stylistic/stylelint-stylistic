import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`single`],

	accept: [
		{
			description: `an empty stylesheet`,
			code: ``,
		},
		{
			description: `a rule with no string in it`,
			code: `a {}`,
		},
		{
			description: `a bare address inside a url call, which is no string`,
			code: `@import url(foo.css);`,
		},
		{
			description: `a declaration with no string in it`,
			code: `a { color: pink; }`,
		},
		{
			description: `a single-quoted value`,
			code: `a::before { content: 'foo'; }`,
		},
		{
			description: `a single-quoted address`,
			code: `a { background: url('foo'); }`,
		},
		{
			description: `a single-quoted attribute value`,
			code: `a[id='foo'] {}`,
		},
		{
			description: `double quotes standing inside a single-quoted value`,
			code: `a::before { content: 'foo"horse"cow'; }`,
		},
		{
			description: `double quotes standing inside a single-quoted at-rule parameter`,
			code: `@import 'foo"horse"cow.css'`,
		},
		{
			description: `double quotes standing inside a single-quoted attribute value`,
			code: `a[foo='foo"horse"cow'] {}`,
		},
		{
			description: `double quotes inside a comment, which the rule does not read`,
			code: `a { /* "horse" */ }`,
		},
		{
			description: `the parameter of a charset rule, which the specification asks to be double-quoted`,
			code: `@charset "utf-8"`,
		},
		{
			description: `an attribute selector the parser cannot read, standing beside one it can`,
			code: `a[b=#{c}][d="e"] { }`,
		},
	],

	reject: [
		{
			description: `an attribute value spelling a preprocessor construct, which is text rather than syntax`,
			code: `[title=":extend(x)"] {}`,
			fixed: `[title=':extend(x)'] {}`,
			line: 1,
			column: 8,
			message: messages.expected(`single`),
		},
		{
			description: `an attribute value spelling an interpolation, which is text rather than syntax`,
			code: `[title="#{a}"] {}`,
			fixed: `[title='#{a}'] {}`,
			line: 1,
			column: 8,
			message: messages.expected(`single`),
		},
		{
			description: `a double-quoted value`,
			code: `a::before { content: "foo"; }`,
			fixed: `a::before { content: 'foo'; }`,
			line: 1,
			column: 22,
			message: messages.expected(`single`),
		},
		{
			description: `the same declaration written over three lines`,
			code: `
				a::before
				{
				  content: "foo";
				}
			`,
			fixed: `
				a::before
				{
				  content: 'foo';
				}
			`,
			line: 3,
			column: 12,
			message: messages.expected(`single`),
		},
		{
			description: `a double-quoted attribute value`,
			code: `a[id="foo"] {}`,
			fixed: `a[id='foo'] {}`,
			line: 1,
			column: 6,
			message: messages.expected(`single`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/178
			description: `a comment standing in the selector, which the fix leaves where the author put it, the warning at the quote it is about`,
			code: `.foo /* x */ [title="y"] {}`,
			fixed: `.foo /* x */ [title='y'] {}`,
			line: 1,
			column: 21,
			message: messages.expected(`single`),
		},
		{
			description: `the same, with the comment behind the attribute`,
			code: `[title="y"] /* x */ {}`,
			fixed: `[title='y'] /* x */ {}`,
			line: 1,
			column: 8,
			message: messages.expected(`single`),
		},
		{
			description: `a comment in either selector of a list, both kept`,
			code: `.foo /* x */ [title="y"], .bar /* z */ [id="w"] {}`,
			fixed: `.foo /* x */ [title='y'], .bar /* z */ [id='w'] {}`,
			warnings: [
				{
					line: 1,
					column: 21,
					message: messages.expected(`single`),
				},
				{
					line: 1,
					column: 44,
					message: messages.expected(`single`),
				},
			],
		},
		{
			description: `a double-quoted attribute value with spaces inside the brackets`,
			code: `a[ id="foo" ] {}`,
			fixed: `a[ id='foo' ] {}`,
			line: 1,
			column: 7,
			message: messages.expected(`single`),
		},
		{
			description: `a double-quoted address, in a rule written over two lines`,
			code: `a\n{ background: url("foo"); }`,
			fixed: `a\n{ background: url('foo'); }`,
			line: 2,
			column: 19,
			message: messages.expected(`single`),
		},
		{
			description: `a double slash opens no comment where the syntax has none`,
			code: `a { --config: //cdn.example.com/a.png "fallback"; }`,
			fixed: `a { --config: //cdn.example.com/a.png 'fallback'; }`,
			line: 1,
			column: 39,
			message: messages.expected(`single`),
		},
		{
			description: `a double-quoted at-rule parameter`,
			code: `@import "base.css"`,
			fixed: `@import 'base.css'`,
			line: 1,
			column: 9,
			message: messages.expected(`single`),
		},
		{
			skip: true,
			description: `should be covered by a new at-charset-rule-no-invalid rule
			see stylelint/stylelint#7492`,
			code: `@charset 'utf-8'`,
			fixed: `@charset "utf-8"`,
		},
	],
})

testRule({
	ruleName,
	config: [`double`],

	accept: [
		{
			description: `an empty stylesheet`,
			code: ``,
		},
		{
			description: `a rule with no string in it`,
			code: `a {}`,
		},
		{
			description: `a bare address inside a url call, which is no string`,
			code: `@import url(foo.css);`,
		},
		{
			description: `a declaration with no string in it`,
			code: `a { color: pink; }`,
		},
		{
			description: `a double-quoted value`,
			code: `a::before { content: "foo"; }`,
		},
		{
			description: `a double-quoted address`,
			code: `a { background: url("foo"); }`,
		},
		{
			description: `a double-quoted attribute value`,
			code: `a[id="foo"] {}`,
		},
		{
			description: `single quotes standing inside a double-quoted value`,
			code: `a::before { content: "foo'horse'cow"; }`,
		},
		{
			description: `single quotes standing inside a double-quoted at-rule parameter`,
			code: `@import "foo'horse'cow.css"`,
		},
		{
			description: `single quotes standing inside a double-quoted attribute value`,
			code: `a[foo="foo'horse'cow"] {}`,
		},
		{
			description: `single quotes inside a comment, which the rule does not read`,
			code: `a { /* 'horse' */ }`,
		},
		{
			description: `the parameter of a charset rule, which this option asks for anyway`,
			code: `@charset "utf-8"`,
		},
	],

	reject: [
		{
			description: `a single-quoted value`,
			code: `a::before { content: 'foo'; }`,
			fixed: `a::before { content: "foo"; }`,
			line: 1,
			column: 22,
			message: messages.expected(`double`),
		},
		{
			description: `the same declaration written over three lines`,
			code: `
				a::before
				{
				  content: 'foo';
				}
			`,
			fixed: `
				a::before
				{
				  content: "foo";
				}
			`,
			line: 3,
			column: 12,
			message: messages.expected(`double`),
		},
		{
			description: `a single-quoted attribute value`,
			code: `a[id='foo'] {}`,
			fixed: `a[id="foo"] {}`,
			line: 1,
			column: 6,
			message: messages.expected(`double`),
		},
		{
			description: `a single-quoted address`,
			code: `a { background: url('foo'); }`,
			fixed: `a { background: url("foo"); }`,
			line: 1,
			column: 21,
			message: messages.expected(`double`),
		},
		{
			description: `a single-quoted at-rule parameter`,
			code: `@import 'base.css'`,
			fixed: `@import "base.css"`,
			line: 1,
			column: 9,
			message: messages.expected(`double`),
		},
		{
			description: `a single-quoted charset parameter`,
			code: `@charset 'utf-8'`,
			fixed: `@charset "utf-8"`,
			line: 1,
			column: 10,
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
			description: `accurate position after a comment inside at-rule params`,
			code: `@import 'x' /* c */ screen;`,
			fixed: `@import "x" /* c */ screen;`,
			line: 1,
			column: 9,
			message: messages.expected(`double`),
		},
	],
})

// No fix: true here because styles which require escaping aren't autofixed, only reported.
testRule({
	ruleName,
	config: [`single`, { avoidEscape: false }],
	reject: [
		{
			description: `double quotes around a value that carries single ones, which the option no longer spares`,
			code: `a::before { content: "foo'horse'cow"; }`,
			line: 1,
			column: 22,
			message: messages.expected(`single`),
		},
		{
			description: `double quotes around an at-rule parameter that carries single ones`,
			code: `@import "foo'horse'cow.css";`,
			line: 1,
			column: 9,
			message: messages.expected(`single`),
		},
		{
			description: `double quotes around an attribute value that carries single ones`,
			code: `a[foo="foo'horse'cow"] {}`,
			line: 1,
			column: 7,
			message: messages.expected(`single`),
		},
	],
})

// No fix: true here because styles which require escaping aren't autofixed, only reported.
testRule({
	ruleName,
	config: [`double`, { avoidEscape: false }],
	reject: [
		{
			description: `single quotes around a value that carries double ones, which the option no longer spares`,
			code: `a::before { content: 'foo"horse"cow'; }`,
			line: 1,
			column: 22,
			message: messages.expected(`double`),
		},
		{
			description: `single quotes around an at-rule parameter that carries double ones`,
			code: `@import 'foo"horse"cow.css';`,
			line: 1,
			column: 9,
			message: messages.expected(`double`),
		},
		{
			description: `single quotes around an attribute value that carries double ones`,
			code: `a[foo='foo"horse"cow'] {}`,
			line: 1,
			column: 7,
			message: messages.expected(`double`),
		},
	],
})

testRule({
	ruleName,
	config: [`double`],
	customSyntax: `postcss-scss`,

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
			description: `the parameter of a charset rule, which this option asks for anyway`,
			code: `@charset "utf-8"`,
		},
		{
			description: `a quotation mark inside an inline comment belongs to the text of that comment`,
			code: `
				$m: (
				  "a": 1 // don't
				);
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/178
			description: `an inline comment standing in the selector, which the fix leaves spelled as the file spells it, the warning at the quote it is about`,
			code: `.a // c\n[title='y'] {}`,
			fixed: `.a // c\n[title="y"] {}`,
			line: 2,
			column: 8,
			message: messages.expected(`double`),
		},
		{
			description: `the same, with the comment behind the attribute`,
			code: `[title='y'] // c\n{}`,
			fixed: `[title="y"] // c\n{}`,
			line: 1,
			column: 8,
			message: messages.expected(`double`),
		},
		{
			description: `quotes in the text of an inline comment, which are no strings of the selector and survive the fix beside them`,
			code: `.a // "quoted"\n[title='y'] {}`,
			fixed: `.a // "quoted"\n[title="y"] {}`,
			line: 2,
			column: 8,
			message: messages.expected(`double`),
		},
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/33
			description: `accurate position after a comment inside at-rule params`,
			code: `
				@mixin foo(
				  /* Comment */
				  $bar: 'baz'
				) {}
			`,
			fixed: `
				@mixin foo(
				  /* Comment */
				  $bar: "baz"
				) {}
			`,
			line: 3,
			column: 9,
			message: messages.expected(`double`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/61
			description: `comments within a map literal are kept`,
			code: `
				$somevar: ( /* This is a comment */
				 /* comment here */
					'a_property': 0 /* Don't forget this one! */
				)
			`,
			fixed: `
				$somevar: ( /* This is a comment */
				 /* comment here */
					"a_property": 0 /* Don't forget this one! */
				)
			`,
			line: 3,
			column: 2,
			message: messages.expected(`double`),
		},
		{
			description: `a string in front of an inline comment inside the value`,
			code: `
				$m: (
				  'a': 1 // c
				);
			`,
			fixed: `
				$m: (
				  "a": 1 // c
				);
			`,
			line: 2,
			column: 3,
			message: messages.expected(`double`),
		},
		{
			description: `a string behind an inline comment inside the value`,
			code: `
				$m: (
				  // c
				  'a': 1
				);
			`,
			fixed: `
				$m: (
				  // c
				  "a": 1
				);
			`,
			line: 3,
			column: 3,
			message: messages.expected(`double`),
		},
		{
			description: `a string in front of an inline comment inside at-rule params`,
			code: `
				@include foo(
				  'x' // c
				);
			`,
			fixed: `
				@include foo(
				  "x" // c
				);
			`,
			line: 2,
			column: 3,
			message: messages.expected(`double`),
		},
		{
			description: `a string behind an inline comment inside at-rule params`,
			code: `
				@include foo(
				  // c
				  'x'
				);
			`,
			fixed: `
				@include foo(
				  // c
				  "x"
				);
			`,
			line: 3,
			column: 3,
			message: messages.expected(`double`),
		},
		{
			description: `a quotation mark in the text of an inline comment opens no string, so a string behind that comment is still read where it stands`,
			code: `
				$m: (
				  'a': 1, // don't
				  'b': 2
				);
			`,
			fixed: `
				$m: (
				  "a": 1, // don't
				  "b": 2
				);
			`,
			warnings: [
				{
					line: 2,
					column: 3,
					message: messages.expected(`double`),
				},
				{
					line: 3,
					column: 3,
					message: messages.expected(`double`),
				},
			],
		},
		{
			description: `a block comment opened in the text of an inline comment is closed by the line, as the comment itself is`,
			code: `
				$m: (
				  // a /* b
				  'c': 1
				);
			`,
			fixed: `
				$m: (
				  // a /* b
				  "c": 1
				);
			`,
			line: 3,
			column: 3,
			message: messages.expected(`double`),
		},
		{
			description: `a block comment closed in the text of an inline comment leaves the position of a string behind it where it is`,
			code: `
				$m: (
				  // a */ b
				  'c': 1
				);
			`,
			fixed: `
				$m: (
				  // a */ b
				  "c": 1
				);
			`,
			line: 3,
			column: 3,
			message: messages.expected(`double`),
		},
		{
			description: `the double slash of an interpolated address is no comment here either`,
			code: `a { background: url(#{map-get($m, a)}//cdn/a.png), url('b.png'); }`,
			fixed: `a { background: url(#{map-get($m, a)}//cdn/a.png), url("b.png"); }`,
			line: 1,
			column: 56,
			message: messages.expected(`double`),
		},
		{
			description: `a double slash this syntax keeps in a value is no comment, since it spells them another way by the time the value is read`,
			code: `a { background: calc(1px//2) format('woff2'); }`,
			fixed: `a { background: calc(1px//2) format("woff2"); }`,
			line: 1,
			column: 37,
			message: messages.expected(`double`),
		},
		{
			description: `a double slash inside a string opens no comment`,
			code: `
				$m: (
				  'http://x': 1 // c
				);
			`,
			fixed: `
				$m: (
				  "http://x": 1 // c
				);
			`,
			line: 2,
			column: 3,
			message: messages.expected(`double`),
		},
	],
})

// A rule fixing the same value stands beside this one in a real run, and `postcss-scss` gives that value a copy apiece: both fixes now go to the copy the syntax prints, and the raw beside it is kept in step, so what the pair says between them about the comments in the value still holds afterwards.
describe(`${ruleName} beside a rule fixing the same value`, () => {
	it(`fixes a value another rule has written a prefix into`, async () => {
		// `declaration-colon-space-after` puts the space it asks for in front of the value
		expect(await fix(`a { --b:'x' // c\n  'y'; }\n`, {
			"@stylistic/declaration-colon-space-after": `always`,
			"@stylistic/string-quotes": `double`,
		})).toBe(`a { --b: "x" // c\n  "y"; }\n`)
	})

	it(`fixes a value another rule has been asked to take a line break out of`, async () => {
		// The line break after the comma is the one closing the comment, so `value-list-comma-newline-after` leaves it where it is
		expect(await fix(`a {\n  b: 'x', // c\n     'y';\n}\n`, {
			"@stylistic/value-list-comma-newline-after": `never-multi-line`,
			"@stylistic/string-quotes": `double`,
		})).toBe(`a {\n  b: "x", // c\n     "y";\n}\n`)
	})

	it(`fixes a value another rule has written inside`, async () => {
		// The hexadecimal colour is lowered by the rule that asks for it, and both fixes reach the file
		expect(await fix(`a {\n  b: #FFF 'x', // c\n     'y';\n}\n`, {
			"@stylistic/color-hex-case": `lower`,
			"@stylistic/string-quotes": `double`,
		})).toBe(`a {\n  b: #fff "x", // c\n     "y";\n}\n`)
	})
})

/**
 * Lints an SCSS stylesheet with the given rules and returns what their fixes made of it.
 * @param code - The stylesheet.
 * @param rules - The rules to lint it with.
 * @returns The fixed stylesheet.
 */
async function fix (code: string, rules: Record<string, unknown>): Promise<string | undefined> {
	let result = await stylelint.lint({
		code,
		customSyntax: `postcss-scss`,
		fix: true,
		config: { plugins: [`./lib/index.ts`], rules },
	})

	return result.code
}
