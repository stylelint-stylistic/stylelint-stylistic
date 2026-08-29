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
