import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a { color: pink; }`,
			description: `a block of one declaration, closing behind its semicolon`,
		},
		{
			code: `a { background: orange; color: pink; }`,
			description: `a block of two declarations, the last closing behind its semicolon`,
		},
		{
			code: `a { &:hover { color: pink; }}`,
			description: `a nested rule with no declaration of its own in front of it`,
		},
		{
			code: `a { color: red; &:hover { color: pink; }}`,
			description: `a nested rule standing behind a declaration`,
		},
	],

	reject: [
		{
			code: `a { color: pink }`,
			fixed: `a { color: pink; }`,
			description: `a block of one declaration with no semicolon behind it`,
			message: messages.expected,
			line: 1,
			column: 15,
		},
		{
			code: `a { background: orange; color: pink }`,
			fixed: `a { background: orange; color: pink; }`,
			description: `a block of two declarations, the last carrying no semicolon`,
			message: messages.expected,
			line: 1,
			column: 35,
		},
		{
			code: `a { &:hover { color: pink }}`,
			fixed: `a { &:hover { color: pink; }}`,
			description: `a nested rule whose own last declaration carries no semicolon`,
			message: messages.expected,
			line: 1,
			column: 25,
		},
		{
			code: `a { color: red; &:hover { color: pink }}`,
			fixed: `a { color: red; &:hover { color: pink; }}`,
			description: `the same nesting standing behind a declaration`,
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
			description: `a block of one declaration, which the option leaves to itself`,
		},
		{
			code: `a { color: pink; }`,
			description: `the same block with the semicolon, which is left alone as readily`,
		},
		{
			code: `@keyframes foo { from { top: 0px } to { top: 1px; } }`,
			description: `blocks with and without the semicolon side by side, each holding one declaration`,
		},
	],

	reject: [
		{
			code: `a { background: orange; color: pink }`,
			fixed: `a { background: orange; color: pink; }`,
			description: `a block of two declarations, which the option still checks`,
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
			description: `a block of one declaration, which the option leaves to itself`,
		},
		{
			code: `a { color: pink; }`,
			description: `the same block with the semicolon, which is left alone as readily`,
		},
		{
			code: `@keyframes foo { from { top: 0px } to { top: 1px; } }`,
			description: `blocks with and without the semicolon side by side, each holding one declaration`,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `a { color: pink }`,
			description: `a single-line block closing against its declaration`,
		},
		{
			code: `a { background: orange; color: pink }`,
			description: `a block of two declarations, the last carrying no semicolon`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }`,
			fixed: `a { color: pink }`,
			description: `a single-line block closing behind a semicolon`,
			message: messages.rejected,
			line: 1,
			column: 15,
		},
		{
			code: `a { background: orange; color: pink; }`,
			fixed: `a { background: orange; color: pink }`,
			description: `a block of two declarations, the last carrying a semicolon`,
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
			description: `a nested at-rule closing behind its semicolon`,
		},
		{
			code: `a { @foo { color: pink; } }`,
			description: `an at-rule holding a block, whose own declaration carries the semicolon`,
		},
		{
			code: `a { @includes foo /* keep me */; }`,
			description: `a comment behind a nested at-rule, with the semicolon behind the comment`,
		},
	],

	reject: [
		{
			code: `a { @includes foo }`,
			fixed: `a { @includes foo; }`,
			description: `a nested at-rule carrying no semicolon`,
			message: messages.expected,
			line: 1,
			column: 17,
		},
		{
			code: `a { @foo { color: pink } }`,
			fixed: `a { @foo { color: pink; } }`,
			description: `an at-rule holding a block whose declaration carries no semicolon`,
			message: messages.expected,
			line: 1,
			column: 22,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/87
			code: `a { @includes foo /* keep me */ }`,
			fixed: `a { @includes foo /* keep me */; }`,
			description: `a comment standing between the at-rule and the closing brace`,
			message: messages.expected,
			line: 1,
			column: 31,
		},
		{
			code: `a { @includes foo /* https://foo.bar/ */ }`,
			fixed: `a { @includes foo /* https://foo.bar/ */; }`,
			description: `the same comment holding an address, whose double slash opens none of its own`,
			message: messages.expected,
			line: 1,
			column: 40,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/87
			description: `a block broken across lines, whose closing brace keeps its line when the semicolon is written`,
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
			description: `the same block with a comment behind the at-rule`,
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
			description: `the same block spelled with carriage returns`,
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
			description: `a nested at-rule closing against the brace`,
		},
		{
			code: `a { @foo { color: pink } }`,
			description: `an at-rule holding a block whose declaration carries no semicolon`,
		},
	],

	reject: [
		{
			code: `a { @includes foo; }`,
			fixed: `a { @includes foo }`,
			description: `a nested at-rule closing behind a semicolon`,
			message: messages.rejected,
			line: 1,
			column: 17,
		},
		{
			code: `a { @foo { color: pink; } }`,
			fixed: `a { @foo { color: pink } }`,
			description: `an at-rule holding a block whose declaration carries a semicolon`,
			message: messages.rejected,
			line: 1,
			column: 22,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/87
			code: `a { @includes foo /* keep me */; }`,
			fixed: `a { @includes foo /* keep me */ }`,
			description: `a comment standing between the at-rule and the semicolon`,
			message: messages.rejected,
			line: 1,
			column: 31,
		},
	],
})
