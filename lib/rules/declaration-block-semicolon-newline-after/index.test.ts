import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/208
		{
			description: `a comment closing the block behind a declaration without a semicolon, which has no semicolon to break behind`,
			code: `a { color: pink /* c */ }`,
		},
		{
			description: `a break behind the semicolon`,
			code: `a { color: pink;\n}`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink;\r\n}`,
		},
		{
			description: `an empty line behind the semicolon, which is a break all the same`,
			code: `
				a { color: pink;

				}
			`,
		},
		{
			description: `the same empty line spelled with carriage returns`,
			code: `a { color: pink;\r\n\r\n}`,
		},
		{
			description: `a semicolon standing in a string, which closes no declaration`,
			code: `a::before { content: ";a";\n}`,
		},
		{
			description: `a space of indentation behind the break`,
			code: `
				a {
				color: pink;
				 top:0;
				}
			`,
		},
		{
			description: `two spaces of indentation behind the break`,
			code: `
				a {
				color: pink;
				  top:0;
				}
			`,
		},
		{
			description: `a tab of indentation behind the break`,
			code: `
				a {
				color: pink;
					top:0;
				}
			`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a {\r\ncolor: pink;\r\n\ttop:0;\r\n}`,
		},
		{
			description: `the last semicolon of the block, which has a brace behind it rather than a declaration`,
			code: `a { color: pink;\ntop: 0; }`,
		},
		{
			description: `the same last semicolon with the brace abutting it`,
			code: `a { color: pink;\ntop: 0;}`,
		},
		{
			description: `the same pair spelled with a carriage return`,
			code: `a { color: pink;\r\ntop: 0;}`,
		},
		{
			description: `a last declaration carrying no semicolon at all`,
			code: `a { color: pink;\ntop: 0}`,
		},
		{
			description: `a comment behind the semicolon, with the break behind the comment`,
			code: `
				a {
				  color: pink; /* 1 */
				  top: 0
				}
			`,
		},
		{
			description: `the same comment behind several spaces`,
			code: `
				a {
				  color: pink;    /* 1 */
				  top: 0
				}
			`,
		},
		{
			description: `the same comment behind a tab, in a block spelled with carriage returns`,
			code: `a {\r\n  color: pink;\t/* 1 */\r\n  top: 0\r\n}`,
		},
		{
			description: `a comment on the line behind the semicolon`,
			code: `
				a {
				  color: pink;
				  /* 1 */
				  top: 0
				}
			`,
		},
		{
			description: `a selector broken across lines, whose block is broken too`,
			code: `
				a,
				b { color: pink;
				top: 0}
			`,
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `a,\r\nb { color: pink;\r\ntop: 0}`,
		},
	],

	reject: [
		{
			description: `spaces and a form feed behind the semicolon, which are whitespace and no line break, so the fix writes a line feed in front of them`,
			code: `a { color: pink;  \ftop: 0; }`,
			fixed: `a { color: pink;\n  \ftop: 0; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `a declaration abutting the semicolon`,
			code: `a { color: pink;top: 0; }`,
			fixed: `a { color: pink;\ntop: 0; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `a space behind the semicolon`,
			code: `a { color: pink; top: 0; }`,
			fixed: `a { color: pink;\n top: 0; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab behind the semicolon`,
			code: `a { color: pink;\ttop: 0; }`,
			fixed: `a { color: pink;\n\ttop: 0; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment behind the semicolon with the next declaration on the same line`,
			code: `
				a {
				  color: pink; /* 1 */ top: 0
				}
			`,
			fixed: `
				a {
				  color: pink; /* 1 */
				 top: 0
				}
			`,
			line: 2,
			column: 15,
			message: messages.expectedAfter(),
		},
		{
			description: `the same line spelled with carriage returns`,
			code: `a {\r\n  color: pink; /* 1 */ top: 0\r\n}`,
			fixed: `a {\r\n  color: pink; /* 1 */\r\n top: 0\r\n}`,
			line: 2,
			column: 15,
			message: messages.expectedAfter(),
		},
		{
			description: `a space in front of the break, which is what the fix trims`,
			code: `a { color: pink; \n top: 0; }`,
			fixed: `a { color: pink;\n top: 0; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `two comments behind the semicolon, the declaration still on their line`,
			code: `
				a {
				  color: pink; /* 1 */ /* 2 */ top: 0
				}
			`,
			fixed: `
				a {
				  color: pink; /* 1 */ /* 2 */
				 top: 0
				}
			`,
			line: 2,
			column: 15,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment behind the semicolon and a space in front of the break`,
			code: `a {\n  color: pink; /* 1 */ \n top: 0\n}`,
			fixed: `a {\n  color: pink; /* 1 */\n top: 0\n}`,
			line: 2,
			column: 15,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a multi-line block broken behind its semicolon`,
			code: `
				a {
				color: pink;
				}
			`,
		},
		{
			description: `a semicolon standing in a string, in a multi-line block`,
			code: `
				a::before {
				content: ";a";
				}
			`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a::before {\r\ncontent: ";a";\r\n}`,
		},
		{
			description: `a space of indentation behind the break`,
			code: `
				a {
				color: pink;
				 top:0;
				}
			`,
		},
		{
			description: `two spaces of indentation behind the break`,
			code: `
				a {
				color: pink;
				  top:0;
				}
			`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a {\r\ncolor: pink;\r\n  top:0;\r\n}`,
		},
		{
			description: `a tab of indentation behind the break`,
			code: `
				a {
				color: pink;
					top:0;
				}
			`,
		},
		{
			description: `the last semicolon of the block, which has a brace behind it`,
			code: `
				a {
				color: pink;
				top: 0; }
			`,
		},
		{
			description: `the same last semicolon with the brace abutting it`,
			code: `
				a {
				color: pink;
				top: 0;}
			`,
		},
		{
			description: `a single-line block, which this option passes over`,
			code: `a { color: pink; top: 0; }`,
		},
		{
			description: `a comment inside a single-line block, likewise passed over`,
			code: `a { color: pink; /* 1 */ top: 0; }`,
		},
		{
			description: `a selector broken across lines, whose block is single-line all the same`,
			code: `a,\nb { color: pink; top: 0}`,
		},
		{
			description: `the same pair spelled with a carriage return`,
			code: `a,\r\nb { color: pink; top: 0}`,
		},
	],

	reject: [
		{
			description: `a declaration abutting the semicolon in a multi-line block`,
			code: `
				a {
				color: pink;top: 0;
				}
			`,
			fixed: `
				a {
				color: pink;
				top: 0;
				}
			`,
			line: 2,
			column: 13,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `a space behind the semicolon in a multi-line block`,
			code: `
				a {
				color: pink; top: 0;
				}
			`,
			fixed: `
				a {
				color: pink;
				 top: 0;
				}
			`,
			line: 2,
			column: 13,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a {\r\ncolor: pink; top: 0;\r\n}`,
			fixed: `a {\r\ncolor: pink;\r\n top: 0;\r\n}`,
			line: 2,
			column: 13,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `a tab behind the semicolon in a multi-line block`,
			code: `
				a {
				color: pink;	top: 0;
				}
			`,
			fixed: `
				a {
				color: pink;
					top: 0;
				}
			`,
			line: 2,
			column: 13,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a {\r\ncolor: pink;\ttop: 0;\r\n}`,
			fixed: `a {\r\ncolor: pink;\r\n\ttop: 0;\r\n}`,
			line: 2,
			column: 13,
			message: messages.expectedAfterMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			description: `a multi-line block whose only semicolon is the last one`,
			code: `
				a {
				color: pink;
				}
			`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a {\r\ncolor: pink;\r\n}`,
		},
		{
			description: `a semicolon standing in a string broken across lines`,
			code: `
				a::before {
				content: ";
				a";
				}
			`,
		},
		{
			description: `the last semicolon of the block, which has a brace behind it`,
			code: `a {\ncolor: pink;top: 0; }`,
		},
		{
			description: `the same last semicolon with the brace abutting it`,
			code: `a {\ncolor: pink;top: 0;}`,
		},
		{
			description: `a single-line block, which this option passes over`,
			code: `a { color: pink; top: 0; }`,
		},
		{
			description: `a selector broken across lines, whose block is single-line all the same`,
			code: `a,\nb { color: pink; top: 0}`,
		},
	],

	reject: [
		{
			description: `a space behind the semicolon in a multi-line block`,
			code: `
				a {
				color: pink; top: 0;
				}
			`,
			fixed: `
				a {
				color: pink;top: 0;
				}
			`,
			line: 2,
			column: 13,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `two spaces behind the semicolon`,
			code: `
				a {
				color: pink;  top: 0;
				}
			`,
			fixed: `
				a {
				color: pink;top: 0;
				}
			`,
			line: 2,
			column: 13,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a break behind the semicolon`,
			code: `
				a {
				color: pink;
				top: 0;
				}
			`,
			fixed: `
				a {
				color: pink;top: 0;
				}
			`,
			line: 2,
			column: 13,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `the same break spelled with carriage returns`,
			code: `a {\r\ncolor: pink;\r\ntop: 0;\r\n}`,
			fixed: `a {\r\ncolor: pink;top: 0;\r\n}`,
			line: 2,
			column: 13,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a tab behind the semicolon`,
			code: `
				a {
				color: pink;	top: 0;
				}
			`,
			fixed: `
				a {
				color: pink;top: 0;
				}
			`,
			line: 2,
			column: 13,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a comment behind the semicolon, with spaces around it`,
			code: `
				a {
				color: pink; /*comment*/ top: 0;
				}
			`,
			fixed: `
				a {
				color: pink; /*comment*/top: 0;
				}
			`,
			line: 2,
			column: 13,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `two comments behind the semicolon, with the break behind them`,
			code: `
				a {
				  color: pink; /* 1 */ /* 2 */
				top: 0
				}
			`,
			fixed: `
				a {
				  color: pink; /* 1 */ /* 2 */top: 0
				}
			`,
			line: 2,
			column: 15,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a comment behind the semicolon and a break behind the comment`,
			code: `a {\n  color: pink; /* 1 */ \n top: 0\n}`,
			fixed: `a {\n  color: pink; /* 1 */top: 0\n}`,
			line: 2,
			column: 15,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-html`,

	accept: [
		{
			description: `a style attribute broken across lines`,
			code: `
				<div style="color: pink;
				top: 0;">x</div>
			`,
		},
		{
			description: `a style attribute with no semicolon in it at all`,
			code: `<div style="color: pink">x</div>`,
		},
		{
			description: `an empty style attribute`,
			code: `<div style="">x</div>`,
		},
		{
			description: `a style binding, which is no style attribute`,
			code: `<span :style="{ color: 'pink' }">x</span>`,
		},
		{
			description: `a style element, which is checked as any stylesheet is`,
			code: `
				<style>a { color: pink;
				top: 0; }</style>
			`,
		},
		{
			description: `Sass variables at the top level of a style element, which are no declaration block`,
			code: `<style lang="scss">$a: 1;$b: 2;</style>`,
		},
	],

	reject: [
		{
			description: `a style attribute whose declarations abut their semicolons`,
			code: `<div style="color: pink;top: 0;">x</div>`,
			fixed: `
				<div style="color: pink;
				top: 0;">x</div>
			`,
			line: 1,
			column: 25,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `Sass variables at the top level of a file, which are no declaration block`,
			code: `$a: 1;$b: 2;`,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/248
			description: `an inline comment abutting the semicolon, whose line break is what closes it, so the declaration behind it cannot join its line`,
			code: `
				a { color: pink;// c
				top: 0;
				}
			`,
			fixed: `
				a { color: pink;// c
				top: 0;
				}
			`,
			line: 1,
			column: 17,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/248
			description: `an inline comment on a line of its own behind the semicolon, which the declaration behind it cannot join either`,
			code: `
				a { color: pink;
				// c
				top: 0;
				}
			`,
			fixed: `
				a { color: pink;
				// c
				top: 0;
				}
			`,
			line: 1,
			column: 17,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/248
			description: `an inline comment held by the value, closed by the break the semicolon stands behind, which leaves the fix a line to pull the declaration onto`,
			code: `
				a { color: red // c
				;
				top: 0;
				}
			`,
			fixed: `
				a { color: red // c
				;top: 0;
				}
			`,
			line: 2,
			column: 2,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a block comment on a line of its own behind the semicolon, which closes on its own and leaves the fix a line to pull the declaration onto`,
			code: `
				a { color: pink;
				/* b */
				top: 0;
				}
			`,
			fixed: `
				a { color: pink;
				/* b */top: 0;
				}
			`,
			line: 1,
			column: 17,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})
