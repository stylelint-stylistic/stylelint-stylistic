import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/208
		{
			autoStripIndent: true,
			code: `
				a {
					color: pink
					/* c */
				}
			`,
			description: `a comment closing the block behind a declaration without a semicolon, which has no semicolon to space — the fix used to pull the comment up to the declaration`,
		},
		{
			code: `a { color: pink; }`,
			description: `a single declaration, whose semicolon has the brace behind it`,
		},
		{
			code: `a::before { content: ";a"; }`,
			description: `a semicolon standing in a string, which closes no declaration`,
		},
		{
			code: `a { color: pink; top: 0;}`,
			description: `the last semicolon of the block, with the brace abutting it`,
		},
		{
			code: `a { color: pink; top: 0}`,
			description: `a last declaration carrying no semicolon at all`,
		},
	],

	reject: [
		{
			code: `a { color: pink;top: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			description: `a declaration abutting the semicolon in front of it`,
			message: messages.expectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;  top: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			description: `two spaces where one belongs`,
			message: messages.expectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;\ntop: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			description: `a break where the space belongs`,
			message: messages.expectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;\r\ntop: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			description: `the same break spelled with a carriage return`,
			message: messages.expectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;\ttop: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			description: `a tab where the space belongs`,
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/208
			code: `a { color: pink /* c */ }`,
			description: `a comment closing the block behind a declaration without a semicolon, which has no semicolon to space — the fix used to close the comment up to the declaration`,
		},
		{
			code: `color: pink;`,
			description: `a declaration at the top level of the file, outside any block`,
		},
		{
			code: `a { color: pink;}`,
			description: `a single declaration whose brace abuts its semicolon`,
		},
		{
			code: `a::before { content: ";a";}`,
			description: `a semicolon standing in a string, which closes no declaration`,
		},
		{
			code: `a { color: pink;top: 0;}`,
			description: `two declarations, each abutting the semicolon in front of it`,
		},
	],

	reject: [
		{
			code: `a { color: pink;\n top: 0;  }`,
			fixed: `a { color: pink;top: 0;  }`,
			description: `a break behind the semicolon, and spaces in front of the brace`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink; top: 0; }`,
			fixed: `a { color: pink;top: 0; }`,
			description: `a space behind the semicolon`,
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
			description: `a single-line block with the space behind its semicolon`,
		},
		{
			code: `a::before { content: ";a"; }`,
			description: `a semicolon standing in a string, in a single-line block`,
		},
		{
			code: `a { color: pink; top: 0;}`,
			description: `the last semicolon of a single-line block, with the brace abutting it`,
		},
		{
			code: `a,\nb { color: pink; top: 0; }`,
			description: `a selector broken across lines, whose block is single-line all the same`,
		},
		{
			code: `a,\r\nb { color: pink; top: 0; }`,
			description: `the same pair spelled with a carriage return`,
		},
		{
			code: `a {\n  color: pink;\n  top: 0;\n}`,
			description: `a multi-line block, which this option passes over`,
		},
		{
			code: `a {\r\n  color: pink;\r\n  top: 0;\r\n}`,
			description: `the same block spelled with carriage returns`,
		},
	],

	reject: [
		{
			code: `a { color: pink;top: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			description: `a declaration abutting the semicolon in a single-line block`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 17,
		},
		{
			code: `a,\nb { color: pink;top: 0; }`,
			fixed: `a,\nb { color: pink; top: 0; }`,
			description: `the same block under a selector broken across lines`,
			message: messages.expectedAfterSingleLine(),
			line: 2,
			column: 17,
		},
		{
			code: `a,\r\nb { color: pink;top: 0; }`,
			fixed: `a,\r\nb { color: pink; top: 0; }`,
			description: `the same selector broken with a carriage return`,
			message: messages.expectedAfterSingleLine(),
			line: 2,
			column: 17,
		},
		{
			code: `a { color: pink;  top: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			description: `two spaces behind the semicolon`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;\ttop: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			description: `a tab behind the semicolon`,
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
			description: `a single declaration, whose semicolon has the brace behind it`,
		},
		{
			code: `a::before { content: "; a"; }`,
			description: `a semicolon standing in a string, which closes no declaration`,
		},
		{
			code: `a { color: pink;top: 0; }`,
			description: `two declarations abutting their semicolons, with a space in front of the brace`,
		},
		{
			code: `a,\nb { color: pink;top: 0; }`,
			description: `a selector broken across lines, whose block is single-line all the same`,
		},
		{
			code: `a {\n  color: pink; top: 0;\n}`,
			description: `a multi-line block, which this option passes over`,
		},
		{
			code: `a {\r\n  color: pink; top: 0;\r\n}`,
			description: `the same block spelled with carriage returns`,
		},
	],

	reject: [
		{
			code: `a { color: pink; top: 0; }`,
			fixed: `a { color: pink;top: 0; }`,
			description: `a space behind the semicolon in a single-line block`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 17,
		},
		{
			code: `a,\nb { color: pink; top: 0; }`,
			fixed: `a,\nb { color: pink;top: 0; }`,
			description: `the same block under a selector broken across lines`,
			message: messages.rejectedAfterSingleLine(),
			line: 2,
			column: 17,
		},
		{
			code: `a,\r\nb { color: pink; top: 0; }`,
			fixed: `a,\r\nb { color: pink;top: 0; }`,
			description: `the same selector broken with a carriage return`,
			message: messages.rejectedAfterSingleLine(),
			line: 2,
			column: 17,
		},
		{
			code: `a { color: pink;  top: 0; }`,
			fixed: `a { color: pink;top: 0; }`,
			description: `two spaces behind the semicolon`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;\ttop: 0; }`,
			fixed: `a { color: pink;top: 0; }`,
			description: `a tab behind the semicolon`,
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
			description: `a style attribute with the space behind its semicolon`,
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
			code: `<style lang="scss">$a: 1;$b: 2;</style>`,
			description: `Sass variables at the top level of a style element, which are no declaration block`,
		},
	],

	reject: [
		{
			code: `<div style="color: pink;top: 0;">x</div>`,
			fixed: `<div style="color: pink; top: 0;">x</div>`,
			description: `a style attribute whose second declaration abuts the semicolon`,
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
			description: `Sass variables at the top level of a file, which are no declaration block`,
		},
	],
})
