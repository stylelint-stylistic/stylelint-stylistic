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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/378
			description: `a string standing beside a comment opening with a solidus, a star and a solidus, whose text spells a string of its own that the value parser hands back as one`,
			code: `a { b: 'a' /*/ 'x' */ 3; }`,
			fixed: `a { b: "a" /*/ 'x' */ 3; }`,
			line: 1,
			column: 8,
			message: messages.expected(`double`),
		},
		{
			description: `the same comment between the parameters of an at-rule`,
			code: `@import 'a' /*/ 'x' */ 'b';`,
			fixed: `@import "a" /*/ 'x' */ "b";`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.expected(`double`),
				},
				{
					line: 1,
					column: 24,
					message: messages.expected(`double`),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/378
			description: `such a comment standing beside a quoted address inside its parentheses, which is a comment to every tokenizer`,
			code: `a { b: url("a" /*/ 'x' */) 'y'; }`,
			fixed: `a { b: url("a" /*/ 'x' */) "y"; }`,
			line: 1,
			column: 28,
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
