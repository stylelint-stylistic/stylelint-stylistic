import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
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
