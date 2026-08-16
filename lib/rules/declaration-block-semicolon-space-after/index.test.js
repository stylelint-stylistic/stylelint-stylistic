import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a { color: pink; }`,
		},
		{
			code: `a { color: pink; }`,
		},
		{
			code: `a::before { content: ";a"; }`,
		},
		{
			code: `a { color: pink; top: 0;}`,
			description: `no space between trailing semicolon and closing brace`,
		},
		{
			code: `a { color: pink; top: 0}`,
		},
	],

	reject: [
		{
			code: `a { color: pink;top: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;  top: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;\ntop: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;\r\ntop: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			description: `CRLF`,
			message: messages.expectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;\ttop: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 17,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `color: pink;`,
			description: `declaration on root`,
		},
		{
			code: `a { color: pink;}`,
		},
		{
			code: `a::before { content: ";a";}`,
		},
		{
			code: `a { color: pink;top: 0;}`,
		},
	],

	reject: [
		{
			code: `a { color: pink;\n top: 0;  }`,
			fixed: `a { color: pink;top: 0;  }`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink; top: 0; }`,
			fixed: `a { color: pink;top: 0; }`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 17,
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			code: `a { color: pink; }`,
		},
		{
			code: `a::before { content: ";a"; }`,
		},
		{
			code: `a { color: pink; top: 0;}`,
			description: `no space between trailing semicolon and closing brace`,
		},
		{
			code: `a,\nb { color: pink; top: 0; }`,
			description: `multi-line rule, single-line declaration-block`,
		},
		{
			code: `a,\r\nb { color: pink; top: 0; }`,
			description: `multi-line rule, single-line declaration-block and CRLF`,
		},
		{
			code: `a {\n  color: pink;\n  top: 0;\n}`,
		},
		{
			code: `a {\r\n  color: pink;\r\n  top: 0;\r\n}`,
			description: `CRLF`,
		},
	],

	reject: [
		{
			code: `a { color: pink;top: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 17,
		},
		{
			code: `a,\nb { color: pink;top: 0; }`,
			fixed: `a,\nb { color: pink; top: 0; }`,
			message: messages.expectedAfterSingleLine(),
			line: 2,
			column: 17,
		},
		{
			code: `a,\r\nb { color: pink;top: 0; }`,
			fixed: `a,\r\nb { color: pink; top: 0; }`,
			description: `CRLF`,
			message: messages.expectedAfterSingleLine(),
			line: 2,
			column: 17,
		},
		{
			code: `a { color: pink;  top: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;\ttop: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 17,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			code: `a { color: pink; }`,
		},
		{
			code: `a::before { content: "; a"; }`,
		},
		{
			code: `a { color: pink;top: 0; }`,
			description: `space between trailing semicolon and closing brace`,
		},
		{
			code: `a,\nb { color: pink;top: 0; }`,
			description: `multi-line rule, single-line declaration-block`,
		},
		{
			code: `a {\n  color: pink; top: 0;\n}`,
		},
		{
			code: `a {\r\n  color: pink; top: 0;\r\n}`,
			description: `CRLF`,
		},
	],

	reject: [
		{
			code: `a { color: pink; top: 0; }`,
			fixed: `a { color: pink;top: 0; }`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 17,
		},
		{
			code: `a,\nb { color: pink; top: 0; }`,
			fixed: `a,\nb { color: pink;top: 0; }`,
			message: messages.rejectedAfterSingleLine(),
			line: 2,
			column: 17,
		},
		{
			code: `a,\r\nb { color: pink; top: 0; }`,
			fixed: `a,\r\nb { color: pink;top: 0; }`,
			description: `CRLF`,
			message: messages.rejectedAfterSingleLine(),
			line: 2,
			column: 17,
		},
		{
			code: `a { color: pink;  top: 0; }`,
			fixed: `a { color: pink;top: 0; }`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;\ttop: 0; }`,
			fixed: `a { color: pink;top: 0; }`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 17,
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
			code: `<div style="color: pink; top: 0;">x</div>`,
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
			code: `<style lang="scss">$a: 1;$b: 2;</style>`,
			description: `top-level Sass variables are not a declaration block`,
		},
	],

	reject: [
		{
			code: `<div style="color: pink;top: 0;">x</div>`,
			fixed: `<div style="color: pink; top: 0;">x</div>`,
			message: messages.expectedAfter(),
			line: 1,
			column: 25,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/49
			code: `
				<template>
					<span style="padding: 2px;margin: 1px;">broken</span>
				</template>
			`,
			fixed: `
				<template>
					<span style="padding: 2px; margin: 1px;">broken</span>
				</template>
			`,
			description: `a style attribute of a Vue template`,
			message: messages.expectedAfter(),
			line: 2,
			column: 28,
		},
		{
			code: `
				<div style="color: pink;top: 0;">x</div>
				<style>a { color: pink;top: 0; }</style>
			`,
			fixed: `
				<div style="color: pink; top: 0;">x</div>
				<style>a { color: pink; top: 0; }</style>
			`,
			description: `a style attribute and a style element in one document`,
			warnings: [
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 25,
				},
				{
					message: messages.expectedAfter(),
					line: 2,
					column: 24,
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
