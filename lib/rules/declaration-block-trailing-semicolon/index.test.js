import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName, autoStripIndent: true })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a { color: pink; }`,
			description: `single declaration block with trailing semicolon`,
		},
		{
			code: `a { background: orange; color: pink; }`,
			description: `multi declaration block with trailing semicolon`,
		},
		{
			code: `a { &:hover { color: pink; }}`,
			description: `nesting without first-level decl`,
		},
		{
			code: `a { color: red; &:hover { color: pink; }}`,
			description: `nesting with first-level decl`,
		},
	],

	reject: [
		{
			code: `a { color: pink }`,
			fixed: `a { color: pink; }`,
			description: `single declaration block without trailing semicolon`,
			message: messages.expected,
			line: 1,
			column: 15,
		},
		{
			code: `a { background: orange; color: pink }`,
			fixed: `a { background: orange; color: pink; }`,
			description: `multi declaration block without trailing semicolon`,
			message: messages.expected,
			line: 1,
			column: 35,
		},
		{
			code: `a { &:hover { color: pink }}`,
			fixed: `a { &:hover { color: pink; }}`,
			description: `nesting without first-level decl`,
			message: messages.expected,
			line: 1,
			column: 25,
		},
		{
			code: `a { color: red; &:hover { color: pink }}`,
			fixed: `a { color: red; &:hover { color: pink; }}`,
			description: `nesting with first-level decl`,
			message: messages.expected,
			line: 1,
			column: 37,
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignore: `single-declaration` }],

	accept: [
		{
			code: `a { color: pink }`,
			description: `single declaration without trailing semicolon`,
		},
		{
			code: `a { color: pink; }`,
			description: `single declaration with trailing semicolon`,
		},
		{
			code: `@keyframes foo { from { top: 0px } to { top: 1px; } }`,
			description: `inconsistent case (with and without)`,
		},
	],

	reject: [
		{
			code: `a { background: orange; color: pink }`,
			fixed: `a { background: orange; color: pink; }`,
			description: `multi declaration block without trailing semicolon`,
			message: messages.expected,
			line: 1,
			column: 35,
		},
	],
})

testRule({
	ruleName,
	config: [`never`, { ignore: [`single-declaration`] }],

	accept: [
		{
			code: `a { color: pink }`,
			description: `single declaration without trailing semicolon`,
		},
		{
			code: `a { color: pink; }`,
			description: `single declaration with trailing semicolon`,
		},
		{
			code: `@keyframes foo { from { top: 0px } to { top: 1px; } }`,
			description: `inconsistent case (with and without)`,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `a { color: pink }`,
			description: `single-line declaration block without trailing semicolon`,
		},
		{
			code: `a { background: orange; color: pink }`,
			description: `multi-line declaration block without trailing semicolon`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }`,
			fixed: `a { color: pink }`,
			description: `single-line declaration block with trailing semicolon`,
			message: messages.rejected,
			line: 1,
			column: 15,
		},
		{
			code: `a { background: orange; color: pink; }`,
			fixed: `a { background: orange; color: pink }`,
			description: `multi-line declaration block with trailing semicolon`,
			message: messages.rejected,
			line: 1,
			column: 35,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `a { @includes foo; }`,
			description: `at-rule with trailing semicolon`,
		},
		{
			code: `a { @foo { color: pink; } }`,
			description: `at-rule with decl block with trailing semicolon`,
		},
		{
			code: `a { @includes foo /* keep me */; }`,
			description: `at-rule with a comment and a trailing semicolon`,
		},
	],

	reject: [
		{
			code: `a { @includes foo }`,
			fixed: `a { @includes foo; }`,
			description: `at-rule without trailing semicolon`,
			message: messages.expected,
			line: 1,
			column: 17,
		},
		{
			code: `a { @foo { color: pink } }`,
			fixed: `a { @foo { color: pink; } }`,
			description: `at-rule with decl block without trailing semicolon`,
			message: messages.expected,
			line: 1,
			column: 22,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/87
			code: `a { @includes foo /* keep me */ }`,
			fixed: `a { @includes foo /* keep me */; }`,
			description: `comment between the at-rule and the closing brace`,
			message: messages.expected,
			line: 1,
			column: 31,
		},
		{
			code: `a { @includes foo /* https://foo.bar/ */ }`,
			fixed: `a { @includes foo /* https://foo.bar/ */; }`,
			description: `comment between the at-rule and the closing brace with an URL`,
			message: messages.expected,
			line: 1,
			column: 40,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/87
			description: `multi-line block: the closing brace keeps its own line`,
			code: `
				a {
					@includes foo
				}
			`,
			fixed: `
				a {
					@includes foo;
				}
			`,
			message: messages.expected,
			line: 2,
			column: 14,
		},
		{
			description: `multi-line block with a comment`,
			code: `
				a {
					@includes foo /* keep me */
				}
			`,
			fixed: `
				a {
					@includes foo /* keep me */;
				}
			`,
			message: messages.expected,
			line: 2,
			column: 28,
		},
		{
			code: `a {\r\n\t@includes foo\r\n}`,
			fixed: `a {\r\n\t@includes foo;\r\n}`,
			description: `CRLF multi-line block`,
			message: messages.expected,
			line: 2,
			column: 14,
		},
		{
			description: `inline comment: the semicolon cannot leave its line, so the code is left alone and the warning stands`,
			code: `
				a {
					@includes foo // keep me
				}
			`,
			fixed: `
				a {
					@includes foo // keep me
				}
			`,
			message: messages.expected,
			line: 2,
			column: 25,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `a { @includes foo }`,
			description: `at-rule without trailing semicolon`,
		},
		{
			code: `a { @foo { color: pink } }`,
			description: `at-rule with decl block without trailing semicolon`,
		},
	],

	reject: [
		{
			code: `a { @includes foo; }`,
			fixed: `a { @includes foo }`,
			description: `at-rule with trailing semicolon`,
			message: messages.rejected,
			line: 1,
			column: 17,
		},
		{
			code: `a { @foo { color: pink; } }`,
			fixed: `a { @foo { color: pink } }`,
			description: `at-rule with decl block with trailing semicolon`,
			message: messages.rejected,
			line: 1,
			column: 22,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/87
			code: `a { @includes foo /* keep me */; }`,
			fixed: `a { @includes foo /* keep me */ }`,
			description: `comment between the at-rule and the semicolon`,
			message: messages.rejected,
			line: 1,
			column: 31,
		},
	],
})
