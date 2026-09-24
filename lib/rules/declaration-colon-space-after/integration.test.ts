import { messages as declarationBlockSemicolonNewlineBeforeMessages } from "../declaration-block-semicolon-newline-before/index.ts"
import { messages as declarationBlockSemicolonSpaceBeforeMessages } from "../declaration-block-semicolon-space-before/index.ts"
import { messages as trailingSemicolonMessages } from "../declaration-block-trailing-semicolon/index.ts"

import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always-single-line`],
	extraRules: {
		"@stylistic/declaration-block-semicolon-newline-before": `never-multi-line`,
		"@stylistic/declaration-block-semicolon-space-before": `never`,
	},

	accept: [
		{
			description: `a block where a multi-line value, an empty custom property and a plain declaration stand together, each spaced as the option asks`,
			code: `
				a {
					gap:
						0
						2em;
					--foo: ;
					color: red;
					--bar: ;
				}`,
		},
	],

	reject: [
		{
			description: `the same block with the spacing wrong in every one of the three, so that the fixes are written to one value after another`,
			code: `
				a {
					color:red ;
					gap:
						0
						2em
					;
					--foo: ;
					--bar:;
					--baz:          ;
				}`,
			fixed: `
				a {
					color: red;
					gap:
						0
						2em;
					--foo: ;
					--bar: ;
					--baz: ;
				}`,
			warnings: [
				{
					line: 2,
					column: 11,
					endLine: 2,
					endColumn: 12,
					message: declarationBlockSemicolonSpaceBeforeMessages.rejectedBefore(),
				},
				{
					line: 6,
					column: 1,
					endLine: 6,
					endColumn: 2,
					message: declarationBlockSemicolonSpaceBeforeMessages.rejectedBefore(),
				},
				{
					line: 9,
					column: 17,
					endLine: 9,
					endColumn: 18,
					message: declarationBlockSemicolonSpaceBeforeMessages.rejectedBefore(),
				},
				{
					line: 2,
					column: 8,
					endLine: 2,
					endColumn: 9,
					message: messages.expectedAfterSingleLine(),
				},
				{
					line: 8,
					column: 8,
					endLine: 8,
					endColumn: 9,
					message: messages.expectedAfterSingleLine(),
				},
				{
					line: 9,
					column: 8,
					endLine: 9,
					endColumn: 9,
					message: messages.expectedAfterSingleLine(),
				},
				{
					line: 2,
					column: 11,
					endLine: 2,
					endColumn: 12,
					message: declarationBlockSemicolonNewlineBeforeMessages.rejectedBeforeMultiLine(),
				},
				{
					line: 6,
					column: 1,
					endLine: 6,
					endColumn: 2,
					message: declarationBlockSemicolonNewlineBeforeMessages.rejectedBeforeMultiLine(),
				},
				{
					line: 9,
					column: 17,
					endLine: 9,
					endColumn: 18,
					message: declarationBlockSemicolonNewlineBeforeMessages.rejectedBeforeMultiLine(),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	extraRules: { "@stylistic/declaration-block-semicolon-space-before": `never` },

	reject: [
		{
			description: `a value that holds no word of its own: the run behind the colon is taken away, and the one in front of the semicolon is left where the parser filed it, so that the rule asked about that one reaches it still`,
			code: `a { color:  /*comment*/ ; }`,
			fixed: `a { color:/*comment*/; }`,
			warnings: [
				{
					line: 1,
					column: 11,
					endLine: 1,
					endColumn: 12,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 24,
					endLine: 1,
					endColumn: 25,
					message: declarationBlockSemicolonSpaceBeforeMessages.rejectedBefore(),
				},
			],
		},
	],
})

// Where a value is nothing but whitespace, the run behind the colon is the run the `declaration-block-semicolon-*-before` rules read in front of the semicolon. The library lists the block's rule first and its extra rules behind, so the neighbor runs last in every block below: the order in which it used to be blind to what this rule wrote, and the two took the run in turns.
testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-semicolon-space-before": `never` },

	reject: [
		{
			description: `a value that is nothing at all, which the neighbor asks to stay nothing and this rule asks to open with a space: the neighbor is listed last and has the last word, so the space is not written and the warning stands`,
			code: `a { color:; }`,
			fixed: `a { color:; }`,
			line: 1,
			column: 11,
			endLine: 1,
			endColumn: 12,
			message: messages.expectedAfter(),
		},
		{
			description: `a custom property whose value is nothing at all, where the neighbor leaves a single space alone and the space is written`,
			code: `a { --a:; }`,
			fixed: `a { --a: ; }`,
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 10,
			message: messages.expectedAfter(),
		},
		{
			// The neighbor listed behind used to take away the space this rule accepts, and the fixing run came back clean
			description: `a value that is nothing but the single space this rule asks for, which the neighbor asks to take away: the space stays, and the file rests with the neighbor's warning`,
			code: `a { color: ; }`,
			fixed: `a { color: ; }`,
			line: 1,
			column: 11,
			endLine: 1,
			endColumn: 12,
			message: declarationBlockSemicolonSpaceBeforeMessages.rejectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],
	extraRules: { "@stylistic/declaration-block-semicolon-space-before": `never-single-line` },

	reject: [
		{
			description: `the same pair under the single-line options, over a block on one line`,
			code: `a { color:; }`,
			fixed: `a { color:; }`,
			line: 1,
			column: 11,
			endLine: 1,
			endColumn: 12,
			message: messages.expectedAfterSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	extraRules: { "@stylistic/declaration-block-semicolon-space-before": `always` },

	reject: [
		{
			description: `a value that is nothing but a space, which the neighbor asks to stay in front of the semicolon and this rule asks to take away`,
			code: `a { color: ; }`,
			fixed: `a { color: ; }`,
			line: 1,
			column: 11,
			endLine: 1,
			endColumn: 12,
			message: messages.rejectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-semicolon-space-before": `always` },

	reject: [
		{
			description: `a neighbor asking for the same single space, which is written once and answers both`,
			code: `a { color:; }`,
			fixed: `a { color: ; }`,
			warnings: [
				{
					line: 1,
					column: 11,
					endLine: 1,
					endColumn: 12,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 10,
					endLine: 1,
					endColumn: 11,
					message: declarationBlockSemicolonSpaceBeforeMessages.expectedBefore(),
				},
			],
		},
	],
})

// A neighbor whose fix the configuration turned off reports the run and cannot rewrite it, so this rule writes past it instead of deferring.
testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-semicolon-space-before": [`never`, { disableFix: true }] },

	reject: [
		{
			description: `a value that is nothing but a break, which the neighbor asks to take away and cannot: the space is written, and the neighbor's report stands over it as the configuration asked`,
			code: `
				a { color:
				; }
			`,
			fixed: `a { color: ; }`,
			warnings: [
				{
					line: 1,
					column: 11,
					endLine: 1,
					endColumn: 12,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 11,
					endLine: 1,
					endColumn: 12,
					message: declarationBlockSemicolonSpaceBeforeMessages.rejectedBefore(),
				},
			],
		},
	],
})

// A vertical tab and a no-break space are words to the tokenizer, whose reading the shared run follows: the fix writes its space in front of such a character instead of carrying it off with the run.
testRule({
	ruleName,
	config: [`always`],

	reject: [
		{
			description: `a value that is a vertical tab, which the tokenizer reads as a word: the space is written in front of it, and the character stays`,
			code: `a { color:\v; }`,
			fixed: `a { color: \v; }`,
			line: 1,
			column: 11,
			endLine: 1,
			endColumn: 12,
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
			description: `a vertical tab behind the colon with a space of its own: the space this rule writes opens the value's word, the neighbor's \`never\` takes the run in front of the semicolon, and the character stands between them`,
			code: `a { color:\v ; }`,
			fixed: `a { color: \v; }`,
			warnings: [
				{
					line: 1,
					column: 11,
					endLine: 1,
					endColumn: 12,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 12,
					endLine: 1,
					endColumn: 13,
					message: declarationBlockSemicolonSpaceBeforeMessages.rejectedBefore(),
				},
			],
		},
	],
})

// `declaration-block-trailing-semicolon: never` takes the semicolon and the run in front of it away, and the block's raw becomes the run behind the colon; this rule reads the run as that rule will leave it in either order.
testRule({
	ruleName,
	config: [`never`],
	extraRules: { "@stylistic/declaration-block-trailing-semicolon": `never` },

	reject: [
		{
			description: `a value that is nothing but a space, with a space in front of the brace behind the semicolon the neighbor listed behind is to take away: the run in front of the brace is the one this rule takes, and the neighbor takes the semicolon and the space in front of it`,
			code: `a { color: ; }`,
			fixed: `a { color:}`,
			warnings: [
				{
					line: 1,
					column: 11,
					endLine: 1,
					endColumn: 12,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 12,
					endLine: 1,
					endColumn: 13,
					message: trailingSemicolonMessages.rejected,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-trailing-semicolon": `always` },

	reject: [
		{
			description: `a declaration closing its block with no semicolon behind it and a space in front of the brace, which the semicolon listed behind will part from the colon: the space is written into the declaration, in front of the semicolon`,
			code: `a { color: }`,
			fixed: `a { color: ; }`,
			warnings: [
				{
					line: 1,
					column: 11,
					endLine: 1,
					endColumn: 12,
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

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/block-closing-brace-newline-before": `always` },

	reject: [
		{
			description: `a wordless declaration the brace alone closes, whose run behind the colon is the run in front of the brace: the neighbor is listed last and asks for the break that stands, so the space is not written and the warning stands`,
			code: `
				a {
					x:
				}
			`,
			fixed: `
				a {
					x:
				}
			`,
			line: 2,
			column: 4,
			endLine: 2,
			endColumn: 5,
			message: messages.expectedAfter(),
		},
		{
			description: `the same run kept in the value of a custom property`,
			code: `
				a {
					--x:
				}
			`,
			fixed: `
				a {
					--x:
				}
			`,
			line: 2,
			column: 6,
			endLine: 2,
			endColumn: 7,
			message: messages.expectedAfter(),
		},
	],
})
