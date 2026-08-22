import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/208
		{
			description: `a comment closing the block behind a declaration without a semicolon, which has no semicolon to space — the fix used to pull the comment up to the declaration`,
			code: `
				a {
					color: pink
					/* c */
				}
			`,
		},
		{
			description: `a single declaration, whose semicolon has the brace behind it`,
			code: `a { color: pink; }`,
		},
		{
			description: `a semicolon standing in a string, which closes no declaration`,
			code: `a::before { content: ";a"; }`,
		},
		{
			description: `the last semicolon of the block, with the brace abutting it`,
			code: `a { color: pink; top: 0;}`,
		},
		{
			description: `a last declaration carrying no semicolon at all`,
			code: `a { color: pink; top: 0}`,
		},
	],

	reject: [
		{
			description: `a declaration abutting the semicolon in front of it`,
			code: `a { color: pink;top: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces where one belongs`,
			code: `a { color: pink;  top: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `a break where the space belongs`,
			code: `a { color: pink;\ntop: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink;\r\ntop: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab where the space belongs`,
			code: `a { color: pink;\ttop: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/208
			description: `a comment closing the block behind a declaration without a semicolon, which has no semicolon to space — the fix used to close the comment up to the declaration`,
			code: `a { color: pink /* c */ }`,
		},
		{
			description: `a declaration at the top level of the file, outside any block`,
			code: `color: pink;`,
		},
		{
			description: `a single declaration whose brace abuts its semicolon`,
			code: `a { color: pink;}`,
		},
		{
			description: `a semicolon standing in a string, which closes no declaration`,
			code: `a::before { content: ";a";}`,
		},
		{
			description: `two declarations, each abutting the semicolon in front of it`,
			code: `a { color: pink;top: 0;}`,
		},
	],

	reject: [
		{
			description: `a break behind the semicolon, and spaces in front of the brace`,
			code: `a { color: pink;\n top: 0;  }`,
			fixed: `a { color: pink;top: 0;  }`,
			line: 1,
			column: 17,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space behind the semicolon`,
			code: `a { color: pink; top: 0; }`,
			fixed: `a { color: pink;top: 0; }`,
			line: 1,
			column: 17,
			message: messages.rejectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			description: `a single-line block with the space behind its semicolon`,
			code: `a { color: pink; }`,
		},
		{
			description: `a semicolon standing in a string, in a single-line block`,
			code: `a::before { content: ";a"; }`,
		},
		{
			description: `the last semicolon of a single-line block, with the brace abutting it`,
			code: `a { color: pink; top: 0;}`,
		},
		{
			description: `a selector broken across lines, whose block is single-line all the same`,
			code: `a,\nb { color: pink; top: 0; }`,
		},
		{
			description: `the same pair spelled with a carriage return`,
			code: `a,\r\nb { color: pink; top: 0; }`,
		},
		{
			description: `a multi-line block, which this option passes over`,
			code: `
				a {
				  color: pink;
				  top: 0;
				}
			`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a {\r\n  color: pink;\r\n  top: 0;\r\n}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/244
			description: `a block broken by a form feed, which is no single-line block and so none of this option's business`,
			code: `a { color: pink;top: 0\f}`,
		},
	],

	reject: [
		{
			description: `a declaration abutting the semicolon in a single-line block`,
			code: `a { color: pink;top: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same block under a selector broken across lines`,
			code: `a,\nb { color: pink;top: 0; }`,
			fixed: `a,\nb { color: pink; top: 0; }`,
			line: 2,
			column: 17,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same selector broken with a carriage return`,
			code: `a,\r\nb { color: pink;top: 0; }`,
			fixed: `a,\r\nb { color: pink; top: 0; }`,
			line: 2,
			column: 17,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `two spaces behind the semicolon`,
			code: `a { color: pink;  top: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a tab behind the semicolon`,
			code: `a { color: pink;\ttop: 0; }`,
			fixed: `a { color: pink; top: 0; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfterSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `a single declaration, whose semicolon has the brace behind it`,
			code: `a { color: pink; }`,
		},
		{
			description: `a semicolon standing in a string, which closes no declaration`,
			code: `a::before { content: "; a"; }`,
		},
		{
			description: `two declarations abutting their semicolons, with a space in front of the brace`,
			code: `a { color: pink;top: 0; }`,
		},
		{
			description: `a selector broken across lines, whose block is single-line all the same`,
			code: `a,\nb { color: pink;top: 0; }`,
		},
		{
			description: `a multi-line block, which this option passes over`,
			code: `
				a {
				  color: pink; top: 0;
				}
			`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a {\r\n  color: pink; top: 0;\r\n}`,
		},
	],

	reject: [
		{
			description: `a space behind the semicolon in a single-line block`,
			code: `a { color: pink; top: 0; }`,
			fixed: `a { color: pink;top: 0; }`,
			line: 1,
			column: 17,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `the same block under a selector broken across lines`,
			code: `a,\nb { color: pink; top: 0; }`,
			fixed: `a,\nb { color: pink;top: 0; }`,
			line: 2,
			column: 17,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `the same selector broken with a carriage return`,
			code: `a,\r\nb { color: pink; top: 0; }`,
			fixed: `a,\r\nb { color: pink;top: 0; }`,
			line: 2,
			column: 17,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `two spaces behind the semicolon`,
			code: `a { color: pink;  top: 0; }`,
			fixed: `a { color: pink;top: 0; }`,
			line: 1,
			column: 17,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `a tab behind the semicolon`,
			code: `a { color: pink;\ttop: 0; }`,
			fixed: `a { color: pink;top: 0; }`,
			line: 1,
			column: 17,
			message: messages.rejectedAfterSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-html`,

	accept: [
		{
			description: `a style attribute with the space behind its semicolon`,
			code: `<div style="color: pink; top: 0;">x</div>`,
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
			description: `Sass variables at the top level of a style element, which are no declaration block`,
			code: `<style lang="scss">$a: 1;$b: 2;</style>`,
		},
	],

	reject: [
		{
			description: `a style attribute whose second declaration abuts the semicolon`,
			code: `<div style="color: pink;top: 0;">x</div>`,
			fixed: `<div style="color: pink; top: 0;">x</div>`,
			line: 1,
			column: 25,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/49
			description: `a style attribute of a Vue template`,
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
			line: 2,
			column: 28,
			message: messages.expectedAfter(),
		},
		{
			description: `a style attribute and a style element in one document`,
			code: `
				<div style="color: pink;top: 0;">x</div>
				<style>a { color: pink;top: 0; }</style>
			`,
			fixed: `
				<div style="color: pink; top: 0;">x</div>
				<style>a { color: pink; top: 0; }</style>
			`,
			warnings: [
				{
					line: 1,
					column: 25,
					message: messages.expectedAfter(),
				},
				{
					line: 2,
					column: 24,
					message: messages.expectedAfter(),
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
