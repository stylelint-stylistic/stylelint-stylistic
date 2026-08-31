import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/208
		{
			description: `a comment closing the block behind a declaration without a semicolon, which has no semicolon to break in front of — the fix used to write a break in front of the comment, and another one on every run`,
			code: `a { color: pink /* c */ }`,
		},
		{
			description: `two comments closing the block behind a declaration without a semicolon`,
			code: `
				a {
					color: pink
					/* c */
					/* d */
				}
			`,
		},
		{
			description: `a custom property whose value is empty, with the break in front of the semicolon`,
			code: `a {--a:\n;}`,
		},
		{
			description: `the same custom property in a block broken across lines`,
			code: `
				a {
					--a:
				;
				}
			`,
		},
		{
			description: `a declaration at the top level of the file, outside any block`,
			code: `color: pink\n;`,
		},
		{
			description: `a break in front of the semicolon`,
			code: `a { color: pink\n; }`,
		},
		{
			description: `an empty line in front of the semicolon`,
			code: `a { color: pink\n\n; }`,
		},
		{
			description: `a semicolon standing in a string, which closes no declaration`,
			code: `a::before { content: ";a"\n; }`,
		},
		{
			description: `a break in front of the first semicolon, with a declaration behind it`,
			code: `a { color: pink\n;top: 0 }`,
		},
		{
			description: `the same block with no space in front of the brace`,
			code: `a { color: pink\n;top: 0}`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink\r\n;top: 0}`,
		},
		{
			description: `the same empty line spelled with carriage returns`,
			code: `a { color: pink\r\n\r\n;top: 0}`,
		},
		{
			description: `a selector broken across lines, whose block is broken too`,
			code: `a,\nb { color: pink\n;top: 0}`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/208
			description: `a nested rule closing the block, whose declaration keeps its semicolon and is still measured`,
			code: `a { color: pink; b {} }`,
			fixed: `
				a { color: pink
				; b {} }
			`,
			line: 1,
			column: 15,
			message: messages.expectedBefore(),
		},
		{
			description: `a custom property whose empty value abuts the semicolon`,
			code: `a {--a:;}`,
			fixed: `a {--a:\n;}`,
			line: 1,
			column: 7,
			message: messages.expectedBefore(),
		},
		{
			description: `the same custom property in a block broken across lines`,
			code: `
				a {
					--a:;
				}
			`,
			fixed: `
				a {
					--a:
				;
				}
			`,
			line: 2,
			column: 5,
			message: messages.expectedBefore(),
		},
		{
			description: `a declaration abutting the semicolon`,
			code: `a { color: pink;top: 0 }`,
			fixed: `a { color: pink\n;top: 0 }`,
			line: 1,
			column: 15,
			message: messages.expectedBefore(),
		},
		{
			description: `a space in front of the semicolon`,
			code: `a { color: pink ;top: 0 }`,
			fixed: `a { color: pink\n;top: 0 }`,
			line: 1,
			column: 16,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces in front of the semicolon`,
			code: `a { color: pink  ;top: 0 }`,
			fixed: `a { color: pink\n;top: 0 }`,
			line: 1,
			column: 17,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab in front of the semicolon`,
			code: `a { color: pink\t;top: 0 }`,
			fixed: `a { color: pink\n;top: 0 }`,
			line: 1,
			column: 16,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab and a space in front of the semicolon`,
			code: `a { color: pink\t ;top: 0 }`,
			fixed: `a { color: pink\n;top: 0 }`,
			line: 1,
			column: 17,
			message: messages.expectedBefore(),
		},
		{
			description: `a comment abutting the semicolon`,
			code: `a { color: pink/*comment*/;top: 0 }`,
			fixed: `a { color: pink/*comment*/\n;top: 0 }`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
		{
			description: `the same comment behind a space`,
			code: `a { color: pink/*comment*/ ;top: 0 }`,
			fixed: `a { color: pink/*comment*/\n;top: 0 }`,
			line: 1,
			column: 27,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/203
			description: `important flag, which the break used to be written in front of rather than behind`,
			code: `a { color: pink !important; }`,
			fixed: `a { color: pink !important\n; }`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
		{
			description: `important flag with no space in front of it`,
			code: `a { color: pink!important; }`,
			fixed: `a { color: pink!important\n; }`,
			line: 1,
			column: 25,
			message: messages.expectedBefore(),
		},
		{
			description: `important flag in upper case, whose spelling the fix keeps`,
			code: `a { color: pink !IMPORTANT ; }`,
			fixed: `a { color: pink !IMPORTANT\n; }`,
			line: 1,
			column: 27,
			message: messages.expectedBefore(),
		},
		{
			description: `comment in front of the important flag, which stays where it is`,
			code: `a { color: pink /* c */ !important; }`,
			fixed: `a { color: pink /* c */ !important\n; }`,
			line: 1,
			column: 34,
			message: messages.expectedBefore(),
		},
		{
			description: `comment behind the important flag`,
			code: `a { color: pink !important /* c */; }`,
			fixed: `a { color: pink !important /* c */\n; }`,
			line: 1,
			column: 34,
			message: messages.expectedBefore(),
		},
		{
			description: `custom property with the important flag`,
			code: `a { --x: 1 !important; }`,
			fixed: `a { --x: 1 !important\n; }`,
			line: 1,
			column: 21,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a custom property whose value is empty, in a multi-line block`,
			code: `
				a {
					--a:
				;
				}
			`,
		},
		{
			description: `a declaration at the top level of the file, outside any block`,
			code: `color: pink\n;`,
		},
		{
			description: `a break in front of the semicolon of a multi-line block`,
			code: `a {\ncolor: pink\n; }`,
		},
		{
			description: `a semicolon standing in a string, in a multi-line block`,
			code: `a::before {\ncontent: ";a"\n; }`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a::before {\r\ncontent: ";a"\r\n; }`,
		},
		{
			description: `a break in front of the first semicolon, with a declaration behind it`,
			code: `a {\ncolor: pink\n;top: 0 }`,
		},
		{
			description: `the same block with no space in front of the brace`,
			code: `a {\ncolor: pink\n;top: 0}`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a {\r\ncolor: pink\r\n;top: 0}`,
		},
		{
			description: `a single-line block, which this option passes over`,
			code: `a { color: pink;top: 0; }`,
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
			description: `a custom property whose empty value abuts the semicolon`,
			code: `
				a {
					--a:;
				}
			`,
			fixed: `
				a {
					--a:
				;
				}
			`,
			line: 2,
			column: 5,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `a declaration abutting the semicolon in a multi-line block`,
			code: `
				a {
				color: pink;top: 0
				}
			`,
			fixed: `
				a {
				color: pink
				;top: 0
				}
			`,
			line: 2,
			column: 11,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `a space in front of the semicolon`,
			code: `
				a {
				color: pink ;top: 0
				}
			`,
			fixed: `
				a {
				color: pink
				;top: 0
				}
			`,
			line: 2,
			column: 12,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `two spaces in front of the semicolon`,
			code: `
				a {
				color: pink  ;top: 0
				}
			`,
			fixed: `
				a {
				color: pink
				;top: 0
				}
			`,
			line: 2,
			column: 13,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a {\r\ncolor: pink  ;top: 0\r\n}`,
			fixed: `a {\r\ncolor: pink\r\n;top: 0\r\n}`,
			line: 2,
			column: 13,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `a tab in front of the semicolon`,
			code: `
				a {
				color: pink	;top: 0
				}
			`,
			fixed: `
				a {
				color: pink
				;top: 0
				}
			`,
			line: 2,
			column: 12,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `a comment abutting the semicolon`,
			code: `
				a {
				color: pink/*comment*/;top: 0
				}
			`,
			fixed: `
				a {
				color: pink/*comment*/
				;top: 0
				}
			`,
			line: 2,
			column: 22,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/203
			description: `important flag, which the break used to be written in front of rather than behind`,
			code: `
				a {
				color: pink !important;top: 0
				}
			`,
			fixed: `
				a {
				color: pink !important
				;top: 0
				}
			`,
			line: 2,
			column: 22,
			message: messages.expectedBeforeMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			description: `a declaration at the top level of the file, outside any block`,
			code: `color: pink;`,
		},
		{
			description: `a custom property whose empty value abuts the semicolon`,
			code: `
				a {
					--a:;
				}
			`,
		},
		{
			description: `the same custom property with a space in front of the semicolon`,
			code: `
				a {
					--a: ;
				}
			`,
		},
		{
			description: `a semicolon abutting the value in a multi-line block`,
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
			description: `a semicolon standing in a string, in a multi-line block`,
			code: `
				a::before {
				content: ";a";
				}
			`,
		},
		{
			description: `two declarations, each abutting its semicolon`,
			code: `
				a {
				color: pink;
				top: 0 }
			`,
		},
		{
			description: `the same block with no space in front of the brace`,
			code: `
				a {
				color: pink;
				top: 0}
			`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a {\r\ncolor: pink;\r\ntop: 0}`,
		},
		{
			description: `a single-line block, which this option passes over`,
			code: `a { color: pink; top: 0; }`,
		},
		{
			description: `a selector broken across lines, whose block is single-line all the same`,
			code: `a,\nb { color: pink ;top: 0}`,
		},
	],

	reject: [
		{
			description: `a break in front of the semicolon of a custom property`,
			code: `
				a {
					--a:
				;
				}
			`,
			fixed: `
				a {
					--a:;
				}
			`,
			line: 2,
			column: 6,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a break in front of the semicolon`,
			code: `a {\ncolor: pink\n;top: 0\n}`,
			fixed: `a {\ncolor: pink;top: 0\n}`,
			line: 2,
			column: 12,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a space in front of the semicolon`,
			code: `
				a {
				color: pink ;top: 0
				}
			`,
			fixed: `
				a {
				color: pink;top: 0
				}
			`,
			line: 2,
			column: 12,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a {\r\ncolor: pink ;top: 0\r\n}`,
			fixed: `a {\r\ncolor: pink;top: 0\r\n}`,
			line: 2,
			column: 12,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `two spaces in front of the semicolon`,
			code: `
				a {
				color: pink  ;top: 0
				}
			`,
			fixed: `
				a {
				color: pink;top: 0
				}
			`,
			line: 2,
			column: 13,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a tab in front of the semicolon`,
			code: `
				a {
				color: pink	;top: 0
				}
			`,
			fixed: `
				a {
				color: pink;top: 0
				}
			`,
			line: 2,
			column: 12,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a {\r\ncolor: pink\t;top: 0\r\n}`,
			fixed: `a {\r\ncolor: pink;top: 0\r\n}`,
			line: 2,
			column: 12,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a comment behind the value with the break in front of the semicolon`,
			code: `
				a {
				color: pink/*comment*/
				;top: 0
				}
			`,
			fixed: `
				a {
				color: pink/*comment*/;top: 0
				}
			`,
			line: 2,
			column: 23,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `the same comment with a space in front of the semicolon`,
			code: `
				a {
				color: pink/*comment*/ ;top: 0
				}
			`,
			fixed: `
				a {
				color: pink/*comment*/;top: 0
				}
			`,
			line: 2,
			column: 23,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `important flag, whose own whitespace the fix takes away`,
			code: `a {\ncolor: pink !important\n;top: 0\n}`,
			fixed: `a {\ncolor: pink !important;top: 0\n}`,
			line: 2,
			column: 23,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			description: `a double slash of plain CSS opens no comment, so the semicolon has a line to join and the fix is written`,
			code: `
				a {
					b: 1px//c
					;
				}
			`,
			fixed: `
				a {
					b: 1px//c;
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-html`,

	accept: [
		{
			description: `a style attribute broken in front of each semicolon`,
			code: `
				<div style="color: pink
				;top: 0
				;">x</div>
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
				<style>a { color: pink
				;top: 0
				; }</style>
			`,
		},
		{
			description: `Sass variables at the top level of a style element, which are no declaration block`,
			code: `<style lang="scss">$a: 1;$b: 2;</style>`,
		},
	],

	reject: [
		{
			description: `a style attribute whose semicolons abut their declarations`,
			code: `<div style="color: pink;top: 0;">x</div>`,
			fixed: `
				<div style="color: pink
				;top: 0
				;">x</div>
			`,
			warnings: [
				{
					line: 1,
					column: 23,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 30,
					message: messages.expectedBefore(),
				},
			],
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
			line: 3,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
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
			line: 3,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
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
			line: 4,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
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
			line: 3,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
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
			line: 3,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
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
			line: 3,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139
			description: `a Sass nested property with a declaration behind it, whose own text ends where its value does rather than where its block does`,
			code: `
				a {
					font: 12px
					{ family: serif; }
					top: 0
				;
				}
			`,
		},
	],
})
