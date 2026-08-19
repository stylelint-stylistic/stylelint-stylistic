import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/208
		{
			code: `a { color: pink /* c */ }`,
			description: `a comment closing the block behind a declaration without a semicolon, which has no semicolon to break in front of — the fix used to write a break in front of the comment, and another one on every run`,
		},
		{
			autoStripIndent: true,
			code: `
				a {
					color: pink
					/* c */
					/* d */
				}
			`,
			description: `two comments closing the block behind a declaration without a semicolon`,
		},
		{
			code: `a {--a:\n;}`,
		},
		{
			code: `a {\n\t--a:\n;\n}`,
		},
		{
			code: `color: pink\n;`,
			description: `declaration on root`,
		},
		{
			code: `a { color: pink\n; }`,
		},
		{
			code: `a { color: pink\n\n; }`,
		},
		{
			code: `a::before { content: ";a"\n; }`,
		},
		{
			code: `a { color: pink\n;top: 0 }`,
		},
		{
			code: `a { color: pink\n;top: 0}`,
		},
		{
			code: `a { color: pink\r\n;top: 0}`,
			description: `CRLF`,
		},
		{
			code: `a { color: pink\r\n\r\n;top: 0}`,
			description: `CRLF`,
		},
		{
			code: `a,\nb { color: pink\n;top: 0}`,
			description: `multi-line rule, multi-line declaration-block`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/208
			autoStripIndent: true,
			code: `a { color: pink; b {} }`,
			fixed: `
				a { color: pink
				; b {} }
			`,
			description: `a nested rule closing the block, whose declaration keeps its semicolon and is still measured`,
			message: messages.expectedBefore(),
			line: 1,
			column: 15,
		},
		{
			code: `a {--a:;}`,
			fixed: `a {--a:\n;}`,
			message: messages.expectedBefore(),
			line: 1,
			column: 7,
		},
		{
			code: `a {\n\t--a:;\n}`,
			fixed: `a {\n\t--a:\n;\n}`,
			message: messages.expectedBefore(),
			line: 2,
			column: 5,
		},
		{
			code: `a { color: pink;top: 0 }`,
			fixed: `a { color: pink\n;top: 0 }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 15,
		},
		{
			code: `a { color: pink ;top: 0 }`,
			fixed: `a { color: pink\n;top: 0 }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink  ;top: 0 }`,
			fixed: `a { color: pink\n;top: 0 }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink\t;top: 0 }`,
			fixed: `a { color: pink\n;top: 0 }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink\t ;top: 0 }`,
			fixed: `a { color: pink\n;top: 0 }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink/*comment*/;top: 0 }`,
			fixed: `a { color: pink/*comment*/\n;top: 0 }`,
			description: `comment`,
			message: messages.expectedBefore(),
			line: 1,
			column: 26,
		},
		{
			code: `a { color: pink/*comment*/ ;top: 0 }`,
			fixed: `a { color: pink/*comment*/\n;top: 0 }`,
			description: `comment`,
			message: messages.expectedBefore(),
			line: 1,
			column: 27,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/203
			code: `a { color: pink !important; }`,
			fixed: `a { color: pink !important\n; }`,
			description: `important flag, which the break used to be written in front of rather than behind`,
			message: messages.expectedBefore(),
			line: 1,
			column: 26,
		},
		{
			code: `a { color: pink!important; }`,
			fixed: `a { color: pink!important\n; }`,
			description: `important flag with no space in front of it`,
			message: messages.expectedBefore(),
			line: 1,
			column: 25,
		},
		{
			code: `a { color: pink !IMPORTANT ; }`,
			fixed: `a { color: pink !IMPORTANT\n; }`,
			description: `important flag in upper case, whose spelling the fix keeps`,
			message: messages.expectedBefore(),
			line: 1,
			column: 27,
		},
		{
			code: `a { color: pink /* c */ !important; }`,
			fixed: `a { color: pink /* c */ !important\n; }`,
			description: `comment in front of the important flag, which stays where it is`,
			message: messages.expectedBefore(),
			line: 1,
			column: 34,
		},
		{
			code: `a { color: pink !important /* c */; }`,
			fixed: `a { color: pink !important /* c */\n; }`,
			description: `comment behind the important flag`,
			message: messages.expectedBefore(),
			line: 1,
			column: 34,
		},
		{
			code: `a { --x: 1 !important; }`,
			fixed: `a { --x: 1 !important\n; }`,
			description: `custom property with the important flag`,
			message: messages.expectedBefore(),
			line: 1,
			column: 21,
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			code: `a {\n\t--a:\n;\n}`,
		},
		{
			code: `color: pink\n;`,
			description: `declaration on root`,
		},
		{
			code: `a {\ncolor: pink\n; }`,
		},
		{
			code: `a::before {\ncontent: ";a"\n; }`,
		},
		{
			code: `a::before {\r\ncontent: ";a"\r\n; }`,
			description: `CRLF`,
		},
		{
			code: `a {\ncolor: pink\n;top: 0 }`,
		},
		{
			code: `a {\ncolor: pink\n;top: 0}`,
		},
		{
			code: `a {\r\ncolor: pink\r\n;top: 0}`,
			description: `CRLF`,
		},
		{
			code: `a { color: pink;top: 0; }`,
		},
		{
			code: `a,\nb { color: pink; top: 0}`,
			description: `multi-line rule, single-line declaration-block`,
		},
		{
			code: `a,\r\nb { color: pink; top: 0}`,
			description: `multi-line rule, single-line declaration-block and CRLF`,
		},
	],

	reject: [
		{
			code: `a {\n\t--a:;\n}`,
			fixed: `a {\n\t--a:\n;\n}`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 5,
		},
		{
			code: `a {\ncolor: pink;top: 0\n}`,
			fixed: `a {\ncolor: pink\n;top: 0\n}`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 11,
		},
		{
			code: `a {\ncolor: pink ;top: 0\n}`,
			fixed: `a {\ncolor: pink\n;top: 0\n}`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 12,
		},
		{
			code: `a {\ncolor: pink  ;top: 0\n}`,
			fixed: `a {\ncolor: pink\n;top: 0\n}`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 13,
		},
		{
			code: `a {\r\ncolor: pink  ;top: 0\r\n}`,
			description: `CRLF`,
			fixed: `a {\r\ncolor: pink\r\n;top: 0\r\n}`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 13,
		},
		{
			code: `a {\ncolor: pink\t;top: 0\n}`,
			fixed: `a {\ncolor: pink\n;top: 0\n}`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 12,
		},
		{
			code: `a {\ncolor: pink/*comment*/;top: 0\n}`,
			fixed: `a {\ncolor: pink/*comment*/\n;top: 0\n}`,
			description: `comment`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 22,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/203
			code: `a {\ncolor: pink !important;top: 0\n}`,
			fixed: `a {\ncolor: pink !important\n;top: 0\n}`,
			description: `important flag, which the break used to be written in front of rather than behind`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 22,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			code: `color: pink;`,
			description: `declaration on root`,
		},
		{
			code: `a {\n\t--a:;\n}`,
		},
		{
			code: `a {\n\t--a: ;\n}`,
		},
		{
			code: `a {\ncolor: pink;\n}`,
		},
		{
			code: `a {\r\ncolor: pink;\r\n}`,
			description: `CRLF`,
		},
		{
			code: `a::before {\ncontent: ";a";\n}`,
		},
		{
			code: `a {\ncolor: pink;\ntop: 0 }`,
		},
		{
			code: `a {\ncolor: pink;\ntop: 0}`,
		},
		{
			code: `a {\r\ncolor: pink;\r\ntop: 0}`,
			description: `CRLF`,
		},
		{
			code: `a { color: pink; top: 0; }`,
		},
		{
			code: `a,\nb { color: pink ;top: 0}`,
			description: `multi-line rule, single-line declaration-block`,
		},
	],

	reject: [
		{
			code: `a {\n\t--a:\n;\n}`,
			fixed: `a {\n\t--a:;\n}`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 6,
		},
		{
			code: `a {\ncolor: pink\n;top: 0\n}`,
			fixed: `a {\ncolor: pink;top: 0\n}`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 12,
		},
		{
			code: `a {\ncolor: pink ;top: 0\n}`,
			fixed: `a {\ncolor: pink;top: 0\n}`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 12,
		},
		{
			code: `a {\r\ncolor: pink ;top: 0\r\n}`,
			description: `CRLF`,
			fixed: `a {\r\ncolor: pink;top: 0\r\n}`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 12,
		},
		{
			code: `a {\ncolor: pink  ;top: 0\n}`,
			fixed: `a {\ncolor: pink;top: 0\n}`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 13,
		},
		{
			code: `a {\ncolor: pink\t;top: 0\n}`,
			fixed: `a {\ncolor: pink;top: 0\n}`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 12,
		},
		{
			code: `a {\r\ncolor: pink\t;top: 0\r\n}`,
			description: `CRLF`,
			fixed: `a {\r\ncolor: pink;top: 0\r\n}`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 12,
		},
		{
			code: `a {\ncolor: pink/*comment*/\n;top: 0\n}`,
			fixed: `a {\ncolor: pink/*comment*/;top: 0\n}`,
			description: `comment`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 23,
		},
		{
			code: `a {\ncolor: pink/*comment*/ ;top: 0\n}`,
			fixed: `a {\ncolor: pink/*comment*/;top: 0\n}`,
			description: `comment`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 23,
		},
		{
			code: `a {\ncolor: pink !important\n;top: 0\n}`,
			fixed: `a {\ncolor: pink !important;top: 0\n}`,
			description: `important flag, whose own whitespace the fix takes away`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 23,
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
				<div style="color: pink
				;top: 0
				;">x</div>
			`,
		},
		{
			code: `<div style="color: pink">x</div>`,
			description: `no trailing semicolon`,
		},
		{
			code: `<div style="">x</div>`,
			description: `empty style attribute`,
		},
		{
			code: `<span :style="{ color: 'pink' }">x</span>`,
			description: `a style binding is not a style attribute`,
		},
		{
			code: `
				<style>a { color: pink
				;top: 0
				; }</style>
			`,
			description: `a style element is checked as before`,
		},
		{
			code: `<style lang="scss">$a: 1;$b: 2;</style>`,
			description: `top-level Sass variables are not a declaration block`,
		},
	],

	reject: [
		{
			code: `<div style="color: pink;top: 0;">x</div>`,
			fixed: `
				<div style="color: pink
				;top: 0
				;">x</div>
			`,
			warnings: [
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 23,
				},
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 30,
				},
			],
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
			description: `top-level Sass variables are not a declaration block`,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,
	autoStripIndent: true,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/207
			description: `inline comment before the semicolon: the semicolon cannot join the comment's line, so the code is left alone and the warning stands`,
			code: `
				a {
					color: red // keep me
					;
				}
			`,
			fixed: `
				a {
					color: red // keep me
					;
				}
			`,
			message: messages.rejectedBeforeMultiLine(),
			// `postcss-scss` counts the position in the copy of the value whose inline comments it has
			// rewritten into block comments, so the column stands two characters further along than the file spells it
			line: 3,
			column: 3,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/207
			description: `inline comment behind the flag: the semicolon cannot join its line either`,
			code: `
				a {
					color: red !important // keep me
					;
				}
			`,
			fixed: `
				a {
					color: red !important // keep me
					;
				}
			`,
			message: messages.rejectedBeforeMultiLine(),
			line: 3,
			column: 1,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/207
			description: `inline comment in front of the flag: the whitespace behind the flag goes, and the comment stays where it is`,
			code: `
				a {
					color: red // keep me
						!important
					;
				}
			`,
			fixed: `
				a {
					color: red // keep me
						!important;
				}
			`,
			message: messages.rejectedBeforeMultiLine(),
			// `postcss-scss` counts the position in the copy of the value whose inline comments it has
			// rewritten into block comments, so the column stands two characters further along than the file spells it
			line: 4,
			column: 3,
		},
		{
			description: `block comment before the semicolon: nothing of it depends on a line break, so the fix goes through`,
			code: `
				a {
					color: red /* keep me */
					;
				}
			`,
			fixed: `
				a {
					color: red /* keep me */;
				}
			`,
			message: messages.rejectedBeforeMultiLine(),
			line: 3,
			column: 1,
		},
		{
			description: `unquoted URL, its double slash opening no comment`,
			code: `
				a {
					background: url(http://foo.bar/a.png)
					;
				}
			`,
			fixed: `
				a {
					background: url(http://foo.bar/a.png);
				}
			`,
			message: messages.rejectedBeforeMultiLine(),
			line: 3,
			column: 1,
		},
		{
			description: `string holding a double slash, which opens no comment either`,
			code: `
				a::before {
					content: "a//b"
					;
				}
			`,
			fixed: `
				a::before {
					content: "a//b";
				}
			`,
			message: messages.rejectedBeforeMultiLine(),
			line: 3,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-less`,
	autoStripIndent: true,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/207
			description: `inline comment before the semicolon: the semicolon cannot join the comment's line, so the code is left alone and the warning stands`,
			code: `
				a {
					color: red // keep me
					;
				}
			`,
			fixed: `
				a {
					color: red // keep me
					;
				}
			`,
			message: messages.rejectedBeforeMultiLine(),
			line: 3,
			column: 1,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/207
			description: `a flag standing in the text of the comment, which Less reads as comment text while the parser reads it as the flag — the value and the flag's raw together show the comment running on to the semicolon`,
			code: `
				a {
					color: red // c !important
					;
				}
			`,
			fixed: `
				a {
					color: red // c !important
					;
				}
			`,
			message: messages.rejectedBeforeMultiLine(),
			line: 3,
			column: 1,
		},
	],
})
