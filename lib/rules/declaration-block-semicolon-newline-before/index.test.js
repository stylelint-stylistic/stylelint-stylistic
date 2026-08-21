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
			description: `a custom property whose value is empty, with the break in front of the semicolon`,
		},
		{
			code: `a {\n\t--a:\n;\n}`,
			description: `the same custom property in a block broken across lines`,
		},
		{
			code: `color: pink\n;`,
			description: `a declaration at the top level of the file, outside any block`,
		},
		{
			code: `a { color: pink\n; }`,
			description: `a break in front of the semicolon`,
		},
		{
			code: `a { color: pink\n\n; }`,
			description: `an empty line in front of the semicolon`,
		},
		{
			code: `a::before { content: ";a"\n; }`,
			description: `a semicolon standing in a string, which closes no declaration`,
		},
		{
			code: `a { color: pink\n;top: 0 }`,
			description: `a break in front of the first semicolon, with a declaration behind it`,
		},
		{
			code: `a { color: pink\n;top: 0}`,
			description: `the same block with no space in front of the brace`,
		},
		{
			code: `a { color: pink\r\n;top: 0}`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `a { color: pink\r\n\r\n;top: 0}`,
			description: `the same empty line spelled with carriage returns`,
		},
		{
			code: `a,\nb { color: pink\n;top: 0}`,
			description: `a selector broken across lines, whose block is broken too`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/208
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
			description: `a custom property whose empty value abuts the semicolon`,
			message: messages.expectedBefore(),
			line: 1,
			column: 7,
		},
		{
			code: `a {\n\t--a:;\n}`,
			fixed: `a {\n\t--a:\n;\n}`,
			description: `the same custom property in a block broken across lines`,
			message: messages.expectedBefore(),
			line: 2,
			column: 5,
		},
		{
			code: `a { color: pink;top: 0 }`,
			fixed: `a { color: pink\n;top: 0 }`,
			description: `a declaration abutting the semicolon`,
			message: messages.expectedBefore(),
			line: 1,
			column: 15,
		},
		{
			code: `a { color: pink ;top: 0 }`,
			fixed: `a { color: pink\n;top: 0 }`,
			description: `a space in front of the semicolon`,
			message: messages.expectedBefore(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink  ;top: 0 }`,
			fixed: `a { color: pink\n;top: 0 }`,
			description: `two spaces in front of the semicolon`,
			message: messages.expectedBefore(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink\t;top: 0 }`,
			fixed: `a { color: pink\n;top: 0 }`,
			description: `a tab in front of the semicolon`,
			message: messages.expectedBefore(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink\t ;top: 0 }`,
			fixed: `a { color: pink\n;top: 0 }`,
			description: `a tab and a space in front of the semicolon`,
			message: messages.expectedBefore(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink/*comment*/;top: 0 }`,
			fixed: `a { color: pink/*comment*/\n;top: 0 }`,
			description: `a comment abutting the semicolon`,
			message: messages.expectedBefore(),
			line: 1,
			column: 26,
		},
		{
			code: `a { color: pink/*comment*/ ;top: 0 }`,
			fixed: `a { color: pink/*comment*/\n;top: 0 }`,
			description: `the same comment behind a space`,
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
			description: `a custom property whose value is empty, in a multi-line block`,
		},
		{
			code: `color: pink\n;`,
			description: `a declaration at the top level of the file, outside any block`,
		},
		{
			code: `a {\ncolor: pink\n; }`,
			description: `a break in front of the semicolon of a multi-line block`,
		},
		{
			code: `a::before {\ncontent: ";a"\n; }`,
			description: `a semicolon standing in a string, in a multi-line block`,
		},
		{
			code: `a::before {\r\ncontent: ";a"\r\n; }`,
			description: `the same block spelled with carriage returns`,
		},
		{
			code: `a {\ncolor: pink\n;top: 0 }`,
			description: `a break in front of the first semicolon, with a declaration behind it`,
		},
		{
			code: `a {\ncolor: pink\n;top: 0}`,
			description: `the same block with no space in front of the brace`,
		},
		{
			code: `a {\r\ncolor: pink\r\n;top: 0}`,
			description: `the same block spelled with carriage returns`,
		},
		{
			code: `a { color: pink;top: 0; }`,
			description: `a single-line block, which this option passes over`,
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
			code: `a {\n\t--a:;\n}`,
			fixed: `a {\n\t--a:\n;\n}`,
			description: `a custom property whose empty value abuts the semicolon`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 5,
		},
		{
			code: `a {\ncolor: pink;top: 0\n}`,
			fixed: `a {\ncolor: pink\n;top: 0\n}`,
			description: `a declaration abutting the semicolon in a multi-line block`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 11,
		},
		{
			code: `a {\ncolor: pink ;top: 0\n}`,
			fixed: `a {\ncolor: pink\n;top: 0\n}`,
			description: `a space in front of the semicolon`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 12,
		},
		{
			code: `a {\ncolor: pink  ;top: 0\n}`,
			fixed: `a {\ncolor: pink\n;top: 0\n}`,
			description: `two spaces in front of the semicolon`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 13,
		},
		{
			code: `a {\r\ncolor: pink  ;top: 0\r\n}`,
			description: `the same block spelled with carriage returns`,
			fixed: `a {\r\ncolor: pink\r\n;top: 0\r\n}`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 13,
		},
		{
			code: `a {\ncolor: pink\t;top: 0\n}`,
			fixed: `a {\ncolor: pink\n;top: 0\n}`,
			description: `a tab in front of the semicolon`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 12,
		},
		{
			code: `a {\ncolor: pink/*comment*/;top: 0\n}`,
			fixed: `a {\ncolor: pink/*comment*/\n;top: 0\n}`,
			description: `a comment abutting the semicolon`,
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
			description: `a declaration at the top level of the file, outside any block`,
		},
		{
			code: `a {\n\t--a:;\n}`,
			description: `a custom property whose empty value abuts the semicolon`,
		},
		{
			code: `a {\n\t--a: ;\n}`,
			description: `the same custom property with a space in front of the semicolon`,
		},
		{
			code: `a {\ncolor: pink;\n}`,
			description: `a semicolon abutting the value in a multi-line block`,
		},
		{
			code: `a {\r\ncolor: pink;\r\n}`,
			description: `the same block spelled with carriage returns`,
		},
		{
			code: `a::before {\ncontent: ";a";\n}`,
			description: `a semicolon standing in a string, in a multi-line block`,
		},
		{
			code: `a {\ncolor: pink;\ntop: 0 }`,
			description: `two declarations, each abutting its semicolon`,
		},
		{
			code: `a {\ncolor: pink;\ntop: 0}`,
			description: `the same block with no space in front of the brace`,
		},
		{
			code: `a {\r\ncolor: pink;\r\ntop: 0}`,
			description: `the same block spelled with carriage returns`,
		},
		{
			code: `a { color: pink; top: 0; }`,
			description: `a single-line block, which this option passes over`,
		},
		{
			code: `a,\nb { color: pink ;top: 0}`,
			description: `a selector broken across lines, whose block is single-line all the same`,
		},
	],

	reject: [
		{
			code: `a {\n\t--a:\n;\n}`,
			fixed: `a {\n\t--a:;\n}`,
			description: `a break in front of the semicolon of a custom property`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 6,
		},
		{
			code: `a {\ncolor: pink\n;top: 0\n}`,
			fixed: `a {\ncolor: pink;top: 0\n}`,
			description: `a break in front of the semicolon`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 12,
		},
		{
			code: `a {\ncolor: pink ;top: 0\n}`,
			fixed: `a {\ncolor: pink;top: 0\n}`,
			description: `a space in front of the semicolon`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 12,
		},
		{
			code: `a {\r\ncolor: pink ;top: 0\r\n}`,
			description: `the same block spelled with carriage returns`,
			fixed: `a {\r\ncolor: pink;top: 0\r\n}`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 12,
		},
		{
			code: `a {\ncolor: pink  ;top: 0\n}`,
			fixed: `a {\ncolor: pink;top: 0\n}`,
			description: `two spaces in front of the semicolon`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 13,
		},
		{
			code: `a {\ncolor: pink\t;top: 0\n}`,
			fixed: `a {\ncolor: pink;top: 0\n}`,
			description: `a tab in front of the semicolon`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 12,
		},
		{
			code: `a {\r\ncolor: pink\t;top: 0\r\n}`,
			description: `the same block spelled with carriage returns`,
			fixed: `a {\r\ncolor: pink;top: 0\r\n}`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 12,
		},
		{
			code: `a {\ncolor: pink/*comment*/\n;top: 0\n}`,
			fixed: `a {\ncolor: pink/*comment*/;top: 0\n}`,
			description: `a comment behind the value with the break in front of the semicolon`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 23,
		},
		{
			code: `a {\ncolor: pink/*comment*/ ;top: 0\n}`,
			fixed: `a {\ncolor: pink/*comment*/;top: 0\n}`,
			description: `the same comment with a space in front of the semicolon`,
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
			message: messages.rejectedBeforeMultiLine(),
			line: 3,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-html`,

	accept: [
		{
			code: `
				<div style="color: pink
				;top: 0
				;">x</div>
			`,
			description: `a style attribute broken in front of each semicolon`,
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
				<style>a { color: pink
				;top: 0
				; }</style>
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
				<div style="color: pink
				;top: 0
				;">x</div>
			`,
			description: `a style attribute whose semicolons abut their declarations`,
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

	accept: [
		{
			code: `$a: 1;$b: 2;`,
			description: `Sass variables at the top level of a file, which are no declaration block`,
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
			message: messages.rejectedBeforeMultiLine(),
			// `postcss-scss` counts the position in the copy of the value whose inline comments it has rewritten into block comments, so the column stands two characters further along than the file spells it
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
			// `postcss-scss` counts the position in the copy of the value whose inline comments it has rewritten into block comments, so the column stands two characters further along than the file spells it
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
