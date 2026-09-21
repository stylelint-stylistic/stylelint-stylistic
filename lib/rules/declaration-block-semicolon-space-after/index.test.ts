import { messages as newlineAfterMessages } from "../declaration-block-semicolon-newline-after/index.ts"

import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		// See #208
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
			// See #208
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
	],

	reject: [
		{
			// See #244
			description: `a form feed in front of the brace, which is whitespace and no line break, so the block is single-line and the semicolon is asked for its space`,
			code: `a { color: pink;top: 0\f}`,
			fixed: `a { color: pink; top: 0\f}`,
			line: 1,
			column: 17,
			message: messages.expectedAfterSingleLine(),
		},
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
			// See #49
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

// The break twin reads and writes the run behind the semicolon too, and the library lists it behind this rule, so its write would be the file's last (1789508663)
testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-semicolon-newline-after": `always` },

	reject: [
		{
			// The two options disagree over the run, and the twin behind writes it
			description: `no whitespace behind a semicolon, where the twin behind this rule would write its break: the space is not written, and the file rests on the twin's break with this rule's warning`,
			code: `a { b: c;d: e }`,
			fixed: `
				a { b: c;
				d: e }
			`,
			warnings: [
				{
					line: 1,
					column: 10,
					endLine: 1,
					endColumn: 11,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 10,
					endLine: 1,
					endColumn: 11,
					message: newlineAfterMessages.expectedAfter(),
				},
			],
		},
		{
			// A twin behind may not write over a run this rule took as it stood
			description: `the single space this rule asks for, which the twin behind it wants a break in place of: the break is not written, since this rule reported nothing about the run as it stood, and the twin's warning stands`,
			code: `a { b: c; d: e }`,
			fixed: `a { b: c; d: e }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: newlineAfterMessages.expectedAfter(),
		},
		{
			// Behind a comment the twins read two runs, and each writes its own
			description: `a comment against the semicolon, whose run this rule reads while the twin reads the one behind the comment: both are written`,
			code: `a { b: c;/* x */d: e }`,
			fixed: `
				a { b: c; /* x */
				d: e }
			`,
			warnings: [
				{
					line: 1,
					column: 10,
					endLine: 1,
					endColumn: 11,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 10,
					endLine: 1,
					endColumn: 11,
					message: newlineAfterMessages.expectedAfter(),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	extraRules: { "@stylistic/declaration-block-semicolon-newline-after": `always` },

	reject: [
		{
			// The run both twins read is the whitespace opening the raw, which a stray semicolon ends
			description: `a second semicolon against the first, behind which this rule finds no whitespace: the twin behind it writes no break there, since this rule reported nothing about the run as it stood, and the twin's warning stands`,
			code: `a { b: c;; d: e }`,
			fixed: `a { b: c;; d: e }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: newlineAfterMessages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	extraRules: { "@stylistic/declaration-block-semicolon-newline-after": `always-multi-line` },

	reject: [
		{
			// The block's lines are counted with every run this rule writes taken away, not the asked one alone
			description: `a block whose only break stands behind a semicolon: taking every run away leaves one line, of which the twin behind says nothing, so both runs are written`,
			code: `
				a { b: c; d: e;
				f: g }
			`,
			fixed: `a { b: c;d: e;f: g }`,
			warnings: [
				{
					line: 1,
					column: 10,
					endLine: 1,
					endColumn: 11,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 16,
					endLine: 1,
					endColumn: 17,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 10,
					endLine: 1,
					endColumn: 11,
					message: newlineAfterMessages.expectedAfterMultiLine(),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-semicolon-newline-after": `never-multi-line` },

	reject: [
		{
			// The block's lines are counted without the whole raw the fix writes over, a break behind a stray semicolon included
			description: `a second semicolon against the first, with the block's only break behind it: the space written over the two leaves one line, of which the twin behind says nothing, so it is written`,
			code: `
				a { b: c;;
				d: e }
			`,
			fixed: `a { b: c; d: e }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.expectedAfter(),
		},
	],
})
