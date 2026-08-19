import stylelint from "stylelint"
import { describe, expect, it } from "vitest"

import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName, autoStripIndent: true })

testRule({
	ruleName,
	config: [`single`],

	accept: [
		{
			code: ``,
		},
		{
			code: `a {}`,
		},
		{
			code: `@import url(foo.css);`,
		},
		{
			code: `a { color: pink; }`,
		},
		{
			code: `a::before { content: 'foo'; }`,
		},
		{
			code: `a { background: url('foo'); }`,
		},
		{
			code: `a[id='foo'] {}`,
		},
		{
			code: `a::before { content: 'foo"horse"cow'; }`,
			description: `declaration string in strings`,
		},
		{
			code: `@import 'foo"horse"cow.css'`,
			description: `at-rule string in strings`,
		},
		{
			code: `a[foo='foo"horse"cow'] {}`,
			description: `rule string in strings`,
		},
		{
			code: `a { /* "horse" */ }`,
			description: `ignores comment`,
		},
		{
			code: `@charset "utf-8"`,
			description: `ignore @charset rules`,
		},
		{
			code: `a[b=#{c}][d="e"] { }`,
			description: `ignore "invalid" selector (see #3130)`,
		},
	],

	reject: [
		{
			code: `[title=":extend(x)"] {}`,
			fixed: `[title=':extend(x)'] {}`,
			description: `an attribute value spelling a preprocessor construct, which is text rather than syntax`,
			message: messages.expected(`single`),
			line: 1,
			column: 8,
		},
		{
			code: `[title="#{a}"] {}`,
			fixed: `[title='#{a}'] {}`,
			description: `an attribute value spelling an interpolation, which is text rather than syntax`,
			message: messages.expected(`single`),
			line: 1,
			column: 8,
		},
		{
			code: `a::before { content: "foo"; }`,
			fixed: `a::before { content: 'foo'; }`,
			message: messages.expected(`single`),
			line: 1,
			column: 22,
		},
		{
			code: `a::before\n{\n  content: "foo";\n}`,
			fixed: `a::before\n{\n  content: 'foo';\n}`,
			message: messages.expected(`single`),
			line: 3,
			column: 12,
		},
		{
			code: `a[id="foo"] {}`,
			fixed: `a[id='foo'] {}`,
			message: messages.expected(`single`),
			line: 1,
			column: 6,
		},
		{
			code: `a[ id="foo" ] {}`,
			fixed: `a[ id='foo' ] {}`,
			message: messages.expected(`single`),
			line: 1,
			column: 7,
		},
		{
			code: `a\n{ background: url("foo"); }`,
			fixed: `a\n{ background: url('foo'); }`,
			message: messages.expected(`single`),
			line: 2,
			column: 19,
		},
		{
			description: `a double slash opens no comment where the syntax has none`,
			code: `a { --config: //cdn.example.com/a.png "fallback"; }`,
			fixed: `a { --config: //cdn.example.com/a.png 'fallback'; }`,
			message: messages.expected(`single`),
			line: 1,
			column: 39,
		},
		{
			code: `@import "base.css"`,
			fixed: `@import 'base.css'`,
			message: messages.expected(`single`),
			line: 1,
			column: 9,
		},
		{
			code: `@charset 'utf-8'`,
			fixed: `@charset "utf-8"`,
			description: `should be covered by a new at-charset-rule-no-invalid rule
			see stylelint/stylelint#7492`,
			skip: true,
		},
	],
})

testRule({
	ruleName,
	config: [`double`],

	accept: [
		{
			code: ``,
		},
		{
			code: `a {}`,
		},
		{
			code: `@import url(foo.css);`,
		},
		{
			code: `a { color: pink; }`,
		},
		{
			code: `a::before { content: "foo"; }`,
		},
		{
			code: `a { background: url("foo"); }`,
		},
		{
			code: `a[id="foo"] {}`,
		},
		{
			code: `a::before { content: "foo'horse'cow"; }`,
			description: `declaration string in strings`,
		},
		{
			code: `@import "foo'horse'cow.css"`,
			description: `at-rule string in strings`,
		},
		{
			code: `a[foo="foo'horse'cow"] {}`,
			description: `rule string in strings`,
		},
		{
			code: `a { /* 'horse' */ }`,
			description: `ignores comment`,
		},
		{
			code: `@charset "utf-8"`,
			description: `ignore @charset rules`,
		},
	],

	reject: [
		{
			code: `a::before { content: 'foo'; }`,
			fixed: `a::before { content: "foo"; }`,
			message: messages.expected(`double`),
			line: 1,
			column: 22,
		},
		{
			code: `a::before\n{\n  content: 'foo';\n}`,
			fixed: `a::before\n{\n  content: "foo";\n}`,
			message: messages.expected(`double`),
			line: 3,
			column: 12,
		},
		{
			code: `a[id='foo'] {}`,
			fixed: `a[id="foo"] {}`,
			message: messages.expected(`double`),
			line: 1,
			column: 6,
		},
		{
			code: `a { background: url('foo'); }`,
			fixed: `a { background: url("foo"); }`,
			message: messages.expected(`double`),
			line: 1,
			column: 21,
		},
		{
			code: `@import 'base.css'`,
			fixed: `@import "base.css"`,
			message: messages.expected(`double`),
			line: 1,
			column: 9,
		},
		{
			code: `@charset 'utf-8'`,
			fixed: `@charset "utf-8"`,
			message: messages.expected(`double`),
			line: 1,
			column: 10,
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
					message: messages.expected(`double`),
					line: 2,
					column: 11,
				},
				{
					message: messages.expected(`double`),
					line: 2,
					column: 23,
				},
			],
		},
		{
			description: `accurate position after a comment inside at-rule params`,
			code: `@import 'x' /* c */ screen;`,
			fixed: `@import "x" /* c */ screen;`,
			message: messages.expected(`double`),
			line: 1,
			column: 9,
		},
	],
})

// No fix: true here because styles which require escaping aren't autofixed, only reported.
testRule({
	ruleName,
	config: [`single`, { avoidEscape: false }],
	reject: [
		{
			code: `a::before { content: "foo'horse'cow"; }`,
			description: `declaration string in strings`,
			message: messages.expected(`single`),
			line: 1,
			column: 22,
		},
		{
			code: `@import "foo'horse'cow.css";`,
			description: `at-rule string in strings`,
			message: messages.expected(`single`),
			line: 1,
			column: 9,
		},
		{
			code: `a[foo="foo'horse'cow"] {}`,
			description: `rule string in strings`,
			message: messages.expected(`single`),
			line: 1,
			column: 7,
		},
	],
})

// No fix: true here because styles which require escaping aren't autofixed, only reported.
testRule({
	ruleName,
	config: [`double`, { avoidEscape: false }],
	reject: [
		{
			code: `a::before { content: 'foo"horse"cow'; }`,
			description: `declaration string in strings`,
			message: messages.expected(`double`),
			line: 1,
			column: 22,
		},
		{
			code: `@import 'foo"horse"cow.css';`,
			description: `at-rule string in strings`,
			message: messages.expected(`double`),
			line: 1,
			column: 9,
		},
		{
			code: `a[foo='foo"horse"cow'] {}`,
			description: `rule string in strings`,
			message: messages.expected(`double`),
			line: 1,
			column: 7,
		},
	],
})

testRule({
	ruleName,
	config: [`double`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `a {\n  // 'horse'\n}`,
			description: `ignores single-line SCSS comment`,
		},
		{
			code: `@charset "utf-8"`,
			description: `ignore @charset rules`,
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
			code: `a::before {\n  // 'horse'\n  content: 'thing'; }`,
			fixed: `a::before {\n  // 'horse'\n  content: "thing"; }`,
			description: `pays attention when single-line SCSS comment ends`,
			message: messages.expected(`double`),
			line: 3,
			column: 12,
		},
		{
			code: `a::before {\n// one\n// two\n// three\n  content: 'thing'; }`,
			fixed: `a::before {\n// one\n// two\n// three\n  content: "thing"; }`,
			description: `accurate position after // comments`,
			message: messages.expected(`double`),
			line: 5,
			column: 12,
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
			message: messages.expected(`double`),
			line: 3,
			column: 9,
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
			message: messages.expected(`double`),
			line: 3,
			column: 2,
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
			message: messages.expected(`double`),
			line: 2,
			column: 3,
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
			message: messages.expected(`double`),
			line: 3,
			column: 3,
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
			message: messages.expected(`double`),
			line: 2,
			column: 3,
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
			message: messages.expected(`double`),
			line: 3,
			column: 3,
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
					message: messages.expected(`double`),
					line: 2,
					column: 3,
				},
				{
					message: messages.expected(`double`),
					line: 3,
					column: 3,
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
			message: messages.expected(`double`),
			line: 3,
			column: 3,
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
			message: messages.expected(`double`),
			line: 3,
			column: 3,
		},
		{
			description: `the double slash of an interpolated address is no comment here either`,
			code: `a { background: url(#{map-get($m, a)}//cdn/a.png), url('b.png'); }`,
			fixed: `a { background: url(#{map-get($m, a)}//cdn/a.png), url("b.png"); }`,
			message: messages.expected(`double`),
			line: 1,
			column: 56,
		},
		{
			description: `a double slash this syntax keeps in a value is no comment, since it spells them another way by the time the value is read`,
			code: `a { background: calc(1px//2) format('woff2'); }`,
			fixed: `a { background: calc(1px//2) format("woff2"); }`,
			message: messages.expected(`double`),
			line: 1,
			column: 37,
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
			message: messages.expected(`double`),
			line: 2,
			column: 3,
		},
	],
})

testRule({
	ruleName,
	config: [`double`],
	customSyntax: `postcss-less`,

	accept: [
		{
			code: `a {\n  // 'horse'\n}`,
			description: `ignores single-line Less comment`,
		},
	],

	reject: [
		{
			code: `a::before {\n  // 'horse'\n  content: 'thing'; }`,
			fixed: `a::before {\n  // 'horse'\n  content: "thing"; }`,
			description: `pays attention when single-line Less comment ends`,
			message: messages.expected(`double`),
			line: 3,
			column: 12,
		},
		{
			code: `a::before {\n// one\n// two\n// three\n  content: 'thing'; }`,
			fixed: `a::before {\n// one\n// two\n// three\n  content: "thing"; }`,
			description: `accurate position after // comments`,
			message: messages.expected(`double`),
			line: 5,
			column: 12,
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
					message: messages.expected(`double`),
					line: 2,
					column: 11,
				},
				{
					message: messages.expected(`double`),
					line: 2,
					column: 23,
				},
			],
		},
		{
			description: `a Less at-variable`,
			code: `@foo: 'bar';`,
			fixed: `@foo: "bar";`,
			message: messages.expected(`double`),
			line: 1,
			column: 7,
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
			message: messages.expected(`double`),
			line: 3,
			column: 2,
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
			message: messages.expected(`single`),
			line: 2,
			column: 9,
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
			message: messages.expected(`single`),
			line: 3,
			column: 3,
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
					message: messages.expected(`single`),
					line: 2,
					column: 18,
				},
				{
					message: messages.expected(`single`),
					line: 2,
					column: 50,
				},
			],
		},
		{
			description: `a double slash inside a bare URL opens no comment`,
			code: `a { background: url(//cdn.example.com/a.png), url("b.png"); }`,
			fixed: `a { background: url(//cdn.example.com/a.png), url('b.png'); }`,
			message: messages.expected(`single`),
			line: 1,
			column: 51,
		},
		{
			description: `a double slash inside a block comment opens no comment`,
			code: `a { background: url(a.png) /* see //cdn */, url("b.png"); }`,
			fixed: `a { background: url(a.png) /* see //cdn */, url('b.png'); }`,
			message: messages.expected(`single`),
			line: 1,
			column: 49,
		},
		{
			description: `an address brings parentheses of its own, and the URL ends at the one that matches`,
			code: `a { background: url(e(@x)//y.png), "z"; }`,
			fixed: `a { background: url(e(@x)//y.png), 'z'; }`,
			message: messages.expected(`single`),
			line: 1,
			column: 36,
		},
		{
			description: `a quoted address opens no comment either, and the URL still ends at its own parenthesis`,
			code: `a { background: url("a" //b) "z"; }`,
			fixed: `a { background: url('a' //b) 'z'; }`,
			warnings: [
				{
					message: messages.expected(`single`),
					line: 1,
					column: 21,
				},
				{
					message: messages.expected(`single`),
					line: 1,
					column: 30,
				},
			],
		},
		{
			description: `a quotation mark left open inside an address closes the URL nowhere, and a URL left open is taken for none`,
			code: `a { background: url(a/a,')//x "z"; }`,
			fixed: `a { background: url(a/a,')//x 'z'; }`,
			message: messages.expected(`single`),
			line: 1,
			column: 31,
		},
		{
			description: `a parenthesis inside a quoted address closes the URL no more than a bare one does`,
			code: `a { background: url("http://x/a)b//c") "z"; }`,
			fixed: `a { background: url('http://x/a)b//c') 'z'; }`,
			warnings: [
				{
					message: messages.expected(`single`),
					line: 1,
					column: 21,
				},
				{
					message: messages.expected(`single`),
					line: 1,
					column: 40,
				},
			],
		},
		{
			description: `a block comment left open runs to the end of the value rather than back to its start`,
			code: `a { background: url(a/* unclosed // b) "z"; }`,
			fixed: `a { background: url(a/* unclosed // b) 'z'; }`,
			message: messages.expected(`single`),
			line: 1,
			column: 40,
		},
		{
			description: `a string closes at the quotation mark that opened it, so an apostrophe in one starts nothing`,
			code: `a { content: "it's" // c "q"\n  "z"; }`,
			fixed: `a { content: "it's" // c "q"\n  'z'; }`,
			message: messages.expected(`single`),
			line: 2,
			column: 3,
		},
		{
			description: `the name of a URL is recognized whatever its case`,
			code: `a { background: URL(//cdn.example.com/a.png), url("b.png"); }`,
			fixed: `a { background: URL(//cdn.example.com/a.png), url('b.png'); }`,
			message: messages.expected(`single`),
			line: 1,
			column: 51,
		},
		{
			description: `an escaped parenthesis closes no URL, so the double slash of its address still opens no comment`,
			code: `a { background: url(a\\)//b.png) "c"; }`,
			fixed: `a { background: url(a\\)//b.png) 'c'; }`,
			message: messages.expected(`single`),
			line: 1,
			column: 33,
		},
		{
			description: `a parenthesis inside a block comment closes no URL either`,
			code: `a { background: url(a /* ) */ //b.png) "c"; }`,
			fixed: `a { background: url(a /* ) */ //b.png) 'c'; }`,
			message: messages.expected(`single`),
			line: 1,
			column: 40,
		},
		{
			description: `an escaped quotation mark closes no string, so the double slash of the next one opens no comment`,
			code: `a { content: "x\\"y" "//z" "w"; }`,
			fixed: `a { content: 'x\\"y' '//z' 'w'; }`,
			warnings: [
				{
					message: messages.expected(`single`),
					line: 1,
					column: 14,
				},
				{
					message: messages.expected(`single`),
					line: 1,
					column: 21,
				},
				{
					message: messages.expected(`single`),
					line: 1,
					column: 27,
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
			message: messages.expected(`double`),
			line: 2,
			column: 9,
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
					message: messages.expected(`double`),
					line: 2,
					column: 9,
				},
				{
					message: messages.expected(`double`),
					line: 3,
					column: 3,
				},
				{
					message: messages.expected(`double`),
					line: 4,
					column: 3,
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
			message: messages.expected(`single`),
			line: 3,
			column: 9,
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
			message: messages.expected(`single`),
			line: 6,
			column: 18,
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
 * @param {string} code - The stylesheet.
 * @param {Record<string, unknown>} rules - The rules to lint it with.
 * @returns {Promise<string | undefined>} The fixed stylesheet.
 */
async function fix (code, rules) {
	let result = await stylelint.lint({
		code,
		customSyntax: `postcss-scss`,
		fix: true,
		config: { plugins: [`./lib/index.js`], rules },
	})

	return result.code
}
