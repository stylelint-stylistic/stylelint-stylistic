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
			description: `a string behind an inline comment inside the value, whose position the raw no longer measures`,
			code: `
				$m: (
				  // c
				  'a': 1
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
			description: `a string in front of an inline comment inside the value: the fix cannot reach the output, so the code is left alone and the warning stands`,
			code: `
				$m: (
				  'a': 1 // c
				);
			`,
			fixed: `
				$m: (
				  'a': 1 // c
				);
			`,
			message: messages.expected(`double`),
			line: 2,
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
				  'x' // c
				);
			`,
			message: messages.expected(`double`),
			line: 2,
			column: 3,
		},
		{
			description: `an interpolated address brings its own parentheses, and its double slash still opens no comment`,
			code: `a { background: url(#{map-get($m, a)}//cdn/a.png), url('b.png'); }`,
			fixed: `a { background: url(#{map-get($m, a)}//cdn/a.png), url("b.png"); }`,
			message: messages.expected(`double`),
			line: 1,
			column: 56,
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
				  'http://x': 1 // c
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
	],
})
