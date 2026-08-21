import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/208
		{
			code: `a { color: pink /* c */ }`,
			description: `a comment closing the block behind a declaration without a semicolon, which has no semicolon to break behind`,
		},
		{
			code: `a { color: pink;\n}`,
			description: `a break behind the semicolon`,
		},
		{
			code: `a { color: pink;\r\n}`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `a { color: pink;\n\n}`,
			description: `an empty line behind the semicolon, which is a break all the same`,
		},
		{
			code: `a { color: pink;\r\n\r\n}`,
			description: `the same empty line spelled with carriage returns`,
		},
		{
			code: `a::before { content: ";a";\n}`,
			description: `a semicolon standing in a string, which closes no declaration`,
		},
		{
			code: `a {\ncolor: pink;\n top:0;\n}`,
			description: `a space of indentation behind the break`,
		},
		{
			code: `a {\ncolor: pink;\n  top:0;\n}`,
			description: `two spaces of indentation behind the break`,
		},
		{
			code: `a {\ncolor: pink;\n\ttop:0;\n}`,
			description: `a tab of indentation behind the break`,
		},
		{
			code: `a {\r\ncolor: pink;\r\n\ttop:0;\r\n}`,
			description: `the same block spelled with carriage returns`,
		},
		{
			code: `a { color: pink;\ntop: 0; }`,
			description: `the last semicolon of the block, which has a brace behind it rather than a declaration`,
		},
		{
			code: `a { color: pink;\ntop: 0;}`,
			description: `the same last semicolon with the brace abutting it`,
		},
		{
			code: `a { color: pink;\r\ntop: 0;}`,
			description: `the same pair spelled with a carriage return`,
		},
		{
			code: `a { color: pink;\ntop: 0}`,
			description: `a last declaration carrying no semicolon at all`,
		},
		{
			code: `a {\n  color: pink; /* 1 */\n  top: 0\n}`,
			description: `a comment behind the semicolon, with the break behind the comment`,
		},
		{
			code: `a {\n  color: pink;    /* 1 */\n  top: 0\n}`,
			description: `the same comment behind several spaces`,
		},
		{
			code: `a {\r\n  color: pink;\t/* 1 */\r\n  top: 0\r\n}`,
			description: `the same comment behind a tab, in a block spelled with carriage returns`,
		},
		{
			code: `a {\n  color: pink;\n  /* 1 */\n  top: 0\n}`,
			description: `a comment on the line behind the semicolon`,
		},
		{
			code: `a,\nb { color: pink;\ntop: 0}`,
			description: `a selector broken across lines, whose block is broken too`,
		},
		{
			code: `a,\r\nb { color: pink;\r\ntop: 0}`,
			description: `the same pair spelled with carriage returns`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/204
			code: `a { color: pink;  \rtop: 0; }`,
			fixed: `a { color: pink;\rtop: 0; }`,
			description: `spaces in front of a bare carriage return, which the fix trims up to the break rather than writing a line feed in front of them`,
			message: messages.expectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;  \ftop: 0; }`,
			fixed: `a { color: pink;\ftop: 0; }`,
			description: `spaces in front of a form feed, which ends a line to every syntax this plugin reads through`,
			message: messages.expectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;top: 0; }`,
			fixed: `a { color: pink;\ntop: 0; }`,
			description: `a declaration abutting the semicolon`,
			message: messages.expectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink; top: 0; }`,
			fixed: `a { color: pink;\n top: 0; }`,
			description: `a space behind the semicolon`,
			message: messages.expectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;\ttop: 0; }`,
			fixed: `a { color: pink;\n\ttop: 0; }`,
			description: `a tab behind the semicolon`,
			message: messages.expectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `a {\n  color: pink; /* 1 */ top: 0\n}`,
			fixed: `a {\n  color: pink; /* 1 */\n top: 0\n}`,
			description: `a comment behind the semicolon with the next declaration on the same line`,
			message: messages.expectedAfter(),
			line: 2,
			column: 15,
		},
		{
			code: `a {\r\n  color: pink; /* 1 */ top: 0\r\n}`,
			fixed: `a {\r\n  color: pink; /* 1 */\r\n top: 0\r\n}`,
			description: `the same line spelled with carriage returns`,
			message: messages.expectedAfter(),
			line: 2,
			column: 15,
		},
		{
			code: `a { color: pink; \n top: 0; }`,
			fixed: `a { color: pink;\n top: 0; }`,
			description: `a space in front of the break, which is what the fix trims`,
			message: messages.expectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `a {\n  color: pink; /* 1 */ /* 2 */ top: 0\n}`,
			fixed: `a {\n  color: pink; /* 1 */ /* 2 */\n top: 0\n}`,
			description: `two comments behind the semicolon, the declaration still on their line`,
			message: messages.expectedAfter(),
			line: 2,
			column: 15,
		},
		{
			code: `a {\n  color: pink; /* 1 */ \n top: 0\n}`,
			fixed: `a {\n  color: pink; /* 1 */\n top: 0\n}`,
			description: `a comment behind the semicolon and a space in front of the break`,
			message: messages.expectedAfter(),
			line: 2,
			column: 15,
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			code: `a {\ncolor: pink;\n}`,
			description: `a multi-line block broken behind its semicolon`,
		},
		{
			code: `a::before {\ncontent: ";a";\n}`,
			description: `a semicolon standing in a string, in a multi-line block`,
		},
		{
			code: `a::before {\r\ncontent: ";a";\r\n}`,
			description: `the same block spelled with carriage returns`,
		},
		{
			code: `a {\ncolor: pink;\n top:0;\n}`,
			description: `a space of indentation behind the break`,
		},
		{
			code: `a {\ncolor: pink;\n  top:0;\n}`,
			description: `two spaces of indentation behind the break`,
		},
		{
			code: `a {\r\ncolor: pink;\r\n  top:0;\r\n}`,
			description: `the same block spelled with carriage returns`,
		},
		{
			code: `a {\ncolor: pink;\n\ttop:0;\n}`,
			description: `a tab of indentation behind the break`,
		},
		{
			code: `a {\ncolor: pink;\ntop: 0; }`,
			description: `the last semicolon of the block, which has a brace behind it`,
		},
		{
			code: `a {\ncolor: pink;\ntop: 0;}`,
			description: `the same last semicolon with the brace abutting it`,
		},
		{
			code: `a { color: pink; top: 0; }`,
			description: `a single-line block, which this option passes over`,
		},
		{
			code: `a { color: pink; /* 1 */ top: 0; }`,
			description: `a comment inside a single-line block, likewise passed over`,
		},
		{
			code: `a,\nb { color: pink; top: 0}`,
			description: `a selector broken across lines, whose block is single-line all the same`,
		},
		{
			code: `a,\r\nb { color: pink; top: 0}`,
			description: `the same pair spelled with a carriage return`,
		},
	],

	reject: [
		{
			code: `a {\ncolor: pink;top: 0;\n}`,
			fixed: `a {\ncolor: pink;\ntop: 0;\n}`,
			description: `a declaration abutting the semicolon in a multi-line block`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 13,
		},
		{
			code: `a {\ncolor: pink; top: 0;\n}`,
			fixed: `a {\ncolor: pink;\n top: 0;\n}`,
			description: `a space behind the semicolon in a multi-line block`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 13,
		},
		{
			code: `a {\r\ncolor: pink; top: 0;\r\n}`,
			fixed: `a {\r\ncolor: pink;\r\n top: 0;\r\n}`,
			description: `the same block spelled with carriage returns`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 13,
		},
		{
			code: `a {\ncolor: pink;\ttop: 0;\n}`,
			fixed: `a {\ncolor: pink;\n\ttop: 0;\n}`,
			description: `a tab behind the semicolon in a multi-line block`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 13,
		},
		{
			code: `a {\r\ncolor: pink;\ttop: 0;\r\n}`,
			fixed: `a {\r\ncolor: pink;\r\n\ttop: 0;\r\n}`,
			description: `the same block spelled with carriage returns`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 13,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			code: `a {\ncolor: pink;\n}`,
			description: `a multi-line block whose only semicolon is the last one`,
		},
		{
			code: `a {\r\ncolor: pink;\r\n}`,
			description: `the same block spelled with carriage returns`,
		},
		{
			code: `a::before {\ncontent: ";\na";\n}`,
			description: `a semicolon standing in a string broken across lines`,
		},
		{
			code: `a {\ncolor: pink;top: 0; }`,
			description: `the last semicolon of the block, which has a brace behind it`,
		},
		{
			code: `a {\ncolor: pink;top: 0;}`,
			description: `the same last semicolon with the brace abutting it`,
		},
		{
			code: `a { color: pink; top: 0; }`,
			description: `a single-line block, which this option passes over`,
		},
		{
			code: `a,\nb { color: pink; top: 0}`,
			description: `a selector broken across lines, whose block is single-line all the same`,
		},
	],

	reject: [
		{
			code: `a {\ncolor: pink; top: 0;\n}`,
			fixed: `a {\ncolor: pink;top: 0;\n}`,
			description: `a space behind the semicolon in a multi-line block`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 13,
		},
		{
			code: `a {\ncolor: pink;  top: 0;\n}`,
			fixed: `a {\ncolor: pink;top: 0;\n}`,
			description: `two spaces behind the semicolon`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 13,
		},
		{
			code: `a {\ncolor: pink;\ntop: 0;\n}`,
			fixed: `a {\ncolor: pink;top: 0;\n}`,
			description: `a break behind the semicolon`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 13,
		},
		{
			code: `a {\r\ncolor: pink;\r\ntop: 0;\r\n}`,
			fixed: `a {\r\ncolor: pink;top: 0;\r\n}`,
			description: `the same break spelled with carriage returns`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 13,
		},
		{
			code: `a {\ncolor: pink;\ttop: 0;\n}`,
			fixed: `a {\ncolor: pink;top: 0;\n}`,
			description: `a tab behind the semicolon`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 13,
		},
		{
			code: `a {\ncolor: pink; /*comment*/ top: 0;\n}`,
			fixed: `a {\ncolor: pink; /*comment*/top: 0;\n}`,
			description: `a comment behind the semicolon, with spaces around it`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 13,
		},
		{
			code: `a {\n  color: pink; /* 1 */ /* 2 */\ntop: 0\n}`,
			fixed: `a {\n  color: pink; /* 1 */ /* 2 */top: 0\n}`,
			description: `two comments behind the semicolon, with the break behind them`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 15,
		},
		{
			code: `a {\n  color: pink; /* 1 */ \n top: 0\n}`,
			fixed: `a {\n  color: pink; /* 1 */top: 0\n}`,
			description: `a comment behind the semicolon and a break behind the comment`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 15,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-html`,
	autoStripIndent: true,

	accept: [
		{
			code: `
				<div style="color: pink;
				top: 0;">x</div>
			`,
			description: `a style attribute broken across lines`,
		},
		{
			code: `<div style="color: pink">x</div>`,
			description: `a style attribute with no semicolon in it at all`,
		},
		{
			code: `<div style="">x</div>`,
			description: `an empty style attribute`,
		},
		{
			code: `<span :style="{ color: 'pink' }">x</span>`,
			description: `a style binding, which is no style attribute`,
		},
		{
			code: `
				<style>a { color: pink;
				top: 0; }</style>
			`,
			description: `a style element, which is checked as any stylesheet is`,
		},
		{
			code: `<style lang="scss">$a: 1;$b: 2;</style>`,
			description: `Sass variables at the top level of a style element, which are no declaration block`,
		},
	],

	reject: [
		{
			code: `<div style="color: pink;top: 0;">x</div>`,
			fixed: `
				<div style="color: pink;
				top: 0;">x</div>
			`,
			description: `a style attribute whose declarations abut their semicolons`,
			message: messages.expectedAfter(),
			line: 1,
			column: 25,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,
	autoStripIndent: true,

	accept: [
		{
			code: `$a: 1;$b: 2;`,
			description: `Sass variables at the top level of a file, which are no declaration block`,
		},
	],
})
