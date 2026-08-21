import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a block of one declaration, closing behind its semicolon`,
			code: `a { color: pink; }`,
		},
		{
			description: `a block of two declarations, the last closing behind its semicolon`,
			code: `a { background: orange; color: pink; }`,
		},
		{
			description: `a nested rule with no declaration of its own in front of it`,
			code: `a { &:hover { color: pink; }}`,
		},
		{
			description: `a nested rule standing behind a declaration`,
			code: `a { color: red; &:hover { color: pink; }}`,
		},
	],

	reject: [
		{
			description: `a block of one declaration with no semicolon behind it`,
			code: `a { color: pink }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 15,
			message: messages.expected,
		},
		{
			description: `a block of two declarations, the last carrying no semicolon`,
			code: `a { background: orange; color: pink }`,
			fixed: `a { background: orange; color: pink; }`,
			line: 1,
			column: 35,
			message: messages.expected,
		},
		{
			description: `a nested rule whose own last declaration carries no semicolon`,
			code: `a { &:hover { color: pink }}`,
			fixed: `a { &:hover { color: pink; }}`,
			line: 1,
			column: 25,
			message: messages.expected,
		},
		{
			description: `the same nesting standing behind a declaration`,
			code: `a { color: red; &:hover { color: pink }}`,
			fixed: `a { color: red; &:hover { color: pink; }}`,
			line: 1,
			column: 37,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignore: `single-declaration` }],

	accept: [
		{
			description: `a block of one declaration, which the option leaves to itself`,
			code: `a { color: pink }`,
		},
		{
			description: `the same block with the semicolon, which is left alone as readily`,
			code: `a { color: pink; }`,
		},
		{
			description: `blocks with and without the semicolon side by side, each holding one declaration`,
			code: `@keyframes foo { from { top: 0px } to { top: 1px; } }`,
		},
	],

	reject: [
		{
			description: `a block of two declarations, which the option still checks`,
			code: `a { background: orange; color: pink }`,
			fixed: `a { background: orange; color: pink; }`,
			line: 1,
			column: 35,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName,
	config: [`never`, { ignore: [`single-declaration`] }],

	accept: [
		{
			description: `a block of one declaration, which the option leaves to itself`,
			code: `a { color: pink }`,
		},
		{
			description: `the same block with the semicolon, which is left alone as readily`,
			code: `a { color: pink; }`,
		},
		{
			description: `blocks with and without the semicolon side by side, each holding one declaration`,
			code: `@keyframes foo { from { top: 0px } to { top: 1px; } }`,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a single-line block closing against its declaration`,
			code: `a { color: pink }`,
		},
		{
			description: `a block of two declarations, the last carrying no semicolon`,
			code: `a { background: orange; color: pink }`,
		},
	],

	reject: [
		{
			description: `a single-line block closing behind a semicolon`,
			code: `a { color: pink; }`,
			fixed: `a { color: pink }`,
			line: 1,
			column: 15,
			message: messages.rejected,
		},
		{
			description: `a block of two declarations, the last carrying a semicolon`,
			code: `a { background: orange; color: pink; }`,
			fixed: `a { background: orange; color: pink }`,
			line: 1,
			column: 35,
			message: messages.rejected,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a nested at-rule closing behind its semicolon`,
			code: `a { @includes foo; }`,
		},
		{
			description: `an at-rule holding a block, whose own declaration carries the semicolon`,
			code: `a { @foo { color: pink; } }`,
		},
		{
			description: `a comment behind a nested at-rule, with the semicolon behind the comment`,
			code: `a { @includes foo /* keep me */; }`,
		},
	],

	reject: [
		{
			description: `a nested at-rule carrying no semicolon`,
			code: `a { @includes foo }`,
			fixed: `a { @includes foo; }`,
			line: 1,
			column: 17,
			message: messages.expected,
		},
		{
			description: `an at-rule holding a block whose declaration carries no semicolon`,
			code: `a { @foo { color: pink } }`,
			fixed: `a { @foo { color: pink; } }`,
			line: 1,
			column: 22,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/87
			description: `a comment standing between the at-rule and the closing brace`,
			code: `a { @includes foo /* keep me */ }`,
			fixed: `a { @includes foo /* keep me */; }`,
			line: 1,
			column: 31,
			message: messages.expected,
		},
		{
			description: `the same comment holding an address, whose double slash opens none of its own`,
			code: `a { @includes foo /* https://foo.bar/ */ }`,
			fixed: `a { @includes foo /* https://foo.bar/ */; }`,
			line: 1,
			column: 40,
			message: messages.expected,
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
			line: 2,
			column: 14,
			message: messages.expected,
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
			line: 2,
			column: 28,
			message: messages.expected,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a {\r\n\t@includes foo\r\n}`,
			fixed: `a {\r\n\t@includes foo;\r\n}`,
			line: 2,
			column: 14,
			message: messages.expected,
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
			line: 2,
			column: 25,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a nested at-rule closing against the brace`,
			code: `a { @includes foo }`,
		},
		{
			description: `an at-rule holding a block whose declaration carries no semicolon`,
			code: `a { @foo { color: pink } }`,
		},
	],

	reject: [
		{
			description: `a nested at-rule closing behind a semicolon`,
			code: `a { @includes foo; }`,
			fixed: `a { @includes foo }`,
			line: 1,
			column: 17,
			message: messages.rejected,
		},
		{
			description: `an at-rule holding a block whose declaration carries a semicolon`,
			code: `a { @foo { color: pink; } }`,
			fixed: `a { @foo { color: pink } }`,
			line: 1,
			column: 22,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/87
			description: `a comment standing between the at-rule and the semicolon`,
			code: `a { @includes foo /* keep me */; }`,
			fixed: `a { @includes foo /* keep me */ }`,
			line: 1,
			column: 31,
			message: messages.rejected,
		},
	],
})
