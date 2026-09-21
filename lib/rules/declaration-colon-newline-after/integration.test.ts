import { messages as semicolonNewlineBeforeMessages } from "../declaration-block-semicolon-newline-before/index.ts"
import { messages as trailingSemicolonMessages } from "../declaration-block-trailing-semicolon/index.ts"

import { messages, ruleName } from "./index.ts"

// Where a declaration's value is nothing but whitespace, the run this rule reads behind the colon is the run the `declaration-block-semicolon-*-before` rules read in front of the semicolon (#416). The library lists the rule a block names first and its extra rules behind it, so every block below has the neighbour run last, the order in which the neighbour used to be blind to what this rule wrote and the two took the run in turns.
let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-semicolon-space-before": `always` },

	reject: [
		{
			// See #416
			description: `a value that is nothing but a space, which the neighbour asks to stand in front of the semicolon and this rule asks to stand behind a break: the neighbour is listed last and has the last word, so the break is not written and the warning stands`,
			code: `a { color: ; }`,
			fixed: `a { color: ; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment on the colon's line, behind which the run this rule reads is the run in front of the semicolon as well`,
			code: `a { color: /*c*/ ; }`,
			fixed: `a { color: /*c*/ ; }`,
			line: 1,
			column: 16,
			endLine: 1,
			endColumn: 17,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-semicolon-space-before": `never` },

	reject: [
		{
			description: `a value that is nothing at all, which the neighbour asks to stay nothing`,
			code: `a { color:; }`,
			fixed: `a { color:; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-semicolon-newline-before": `never-multi-line` },

	reject: [
		{
			description: `a block on one line, which the neighbour is silent about as it stands and speaks of the moment this rule's break puts it over two`,
			code: `a { color:; }`,
			fixed: `a { color:; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a block over several lines, where the second declaration has a word of its own and takes its break as it always did`,
			code: `
				a {
					color:;
					top: 0;
				}
			`,
			fixed: `
				a {
					color:;
					top:
				 0;
				}
			`,
			warnings: [
				{
					line: 2,
					column: 7,
					endLine: 2,
					endColumn: 8,
					message: messages.expectedAfter(),
				},
				{
					line: 3,
					column: 5,
					endLine: 3,
					endColumn: 6,
					message: messages.expectedAfter(),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-semicolon-newline-before": `always` },

	reject: [
		{
			// See #417
			description: `a neighbour asking for a break of its own, which the one this rule writes answers as well: the run is written down to the bare break the neighbour's fix spells, so both orders rest on one file`,
			code: `a { color: ; }`,
			fixed: `a { color:\n; }`,
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
					column: 11,
					endLine: 1,
					endColumn: 12,
					message: semicolonNewlineBeforeMessages.expectedBefore(),
				},
			],
		},
		{
			description: `a comment on the colon's line, behind which the shared run and its tail stand`,
			code: `a { color:  /*c*/ ; }`,
			fixed: `a { color:  /*c*/\n; }`,
			warnings: [
				{
					line: 1,
					column: 17,
					endLine: 1,
					endColumn: 18,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 18,
					endLine: 1,
					endColumn: 19,
					message: semicolonNewlineBeforeMessages.expectedBefore(),
				},
			],
		},
		{
			description: `a run spelled with a tab, which does not survive the break either`,
			code: `a { color:\t; }`,
			fixed: `a { color:\n; }`,
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
					column: 11,
					endLine: 1,
					endColumn: 12,
					message: semicolonNewlineBeforeMessages.expectedBefore(),
				},
			],
		},
		{
			// See #488
			description: `a run spelled with a bare carriage return, which is whitespace and no break, and goes with the trim like a space`,
			code: `a { color: \r; }`,
			fixed: `a { color:\n; }`,
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
					column: 12,
					endLine: 1,
					endColumn: 13,
					message: semicolonNewlineBeforeMessages.expectedBefore(),
				},
			],
		},
		{
			description: `the same run spelled with a form feed`,
			code: `a { color: \f; }`,
			fixed: `a { color:\n; }`,
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
					column: 12,
					endLine: 1,
					endColumn: 13,
					message: semicolonNewlineBeforeMessages.expectedBefore(),
				},
			],
		},
		{
			description: `a custom property, whose run is written down to the break like any other`,
			code: `a { --a: ; }`,
			fixed: `a { --a:\n; }`,
			warnings: [
				{
					line: 1,
					column: 8,
					endLine: 1,
					endColumn: 9,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 9,
					endLine: 1,
					endColumn: 10,
					message: semicolonNewlineBeforeMessages.expectedBefore(),
				},
			],
		},
	],
})

// A vertical tab and a no-break space are words to the tokenizer, and the shared run reads whitespace the tokenizer's way (#494): the fix writes its break in front of such a character, and the question of whether the run already opens on a break steps over the tokenizer's whitespace only.
testRule({
	ruleName,
	config: [`always`],

	reject: [
		{
			// See #494
			description: `a value opening on a vertical tab in front of the line break, a word to the tokenizer: the break is written before it, instead of the fix taking the run for already broken and writing nothing`,
			code: `a { color:\v\nred; }`,
			fixed: `a { color:\n\v\nred; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-semicolon-newline-before": `always` },

	reject: [
		{
			// See #494
			description: `a vertical tab in front of a block comment: the character is a word, so the run does not open on the comment, each rule writes its own break, and nothing is written twice`,
			code: `a { color:\v/*c*/ ; }`,
			fixed: `a { color:\n\v/*c*/\n; }`,
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
					column: 17,
					endLine: 1,
					endColumn: 18,
					message: semicolonNewlineBeforeMessages.expectedBefore(),
				},
			],
		},
	],
})

// The run behind the colon of a declaration closing a block with no semicolon stands in the block's own raw, and `declaration-block-trailing-semicolon: always` puts the semicolon between the colon and that run, so this rule reads the run as the block's whichever order the configuration lists the two in (#536).
testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-trailing-semicolon": `always` },

	reject: [
		{
			description: `a declaration closing its block with no semicolon behind it and a space in front of the brace, which the semicolon listed behind will part from the colon: the break is written into the declaration, in front of the semicolon`,
			code: `a { color: }`,
			fixed: `
				a { color:
				; }
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
					message: trailingSemicolonMessages.expected,
				},
			],
		},
	],
})
