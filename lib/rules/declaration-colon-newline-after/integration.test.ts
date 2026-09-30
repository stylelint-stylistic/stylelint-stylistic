import { messages as braceNewlineBeforeMessages } from "../block-closing-brace-newline-before/index.ts"
import { messages as braceSpaceBeforeMessages } from "../block-closing-brace-space-before/index.ts"
import { messages as semicolonNewlineBeforeMessages } from "../declaration-block-semicolon-newline-before/index.ts"
import { messages as semicolonSpaceBeforeMessages } from "../declaration-block-semicolon-space-before/index.ts"
import { messages as trailingSemicolonMessages } from "../declaration-block-trailing-semicolon/index.ts"

import { messages, ruleName } from "./index.ts"

// Where a declaration's value is nothing but whitespace, the run this rule reads behind the colon is the run the `declaration-block-semicolon-*-before` rules read in front of the semicolon. The library lists the rule a block names first and its extra rules behind it, so every block below has the neighbor run last, the order in which the neighbor used to be blind to what this rule wrote and the two took the run in turns.
let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-semicolon-space-before": `always` },

	reject: [
		{
			description: `a value that is nothing but a space, which the neighbor asks to stand in front of the semicolon and this rule asks to stand behind a break: the neighbor is listed last and has the last word, so the break is not written and the warning stands`,
			code: `a { color: ; }`,
			fixed: `a { color: ; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.expectedAfter(),
		},
		{
			// The run behind the comment is the neighbor's, and a break in front of the comment answers both rules.
			description: `a comment on the colon's line, behind which the run this rule reads is the run in front of the semicolon as well`,
			code: `a { color: /*c*/ ; }`,
			fixed: `a { color:\n/*c*/ ; }`,
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
			description: `a value that is nothing at all, which the neighbor asks to stay nothing`,
			code: `a { color:; }`,
			fixed: `a { color:; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.expectedAfter(),
		},
		{
			// The neighbor takes the space behind the comment, and a break in front of the comment answers both rules.
			description: `a custom property whose value is a comment on the colon's line with a space behind it in front of the semicolon`,
			code: `a { --b: /*c*/ ; }`,
			fixed: `a { --b:\n/*c*/; }`,
			warnings: [
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 15,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 15,
					endLine: 1,
					endColumn: 16,
					message: semicolonSpaceBeforeMessages.rejectedBefore(),
				},
			],
		},
		{
			// The neighbor takes the break behind the comment, so this rule reads the run as the neighbor leaves it.
			description: `the same comment with a break behind it in front of the semicolon`,
			code: `a { --b: /*c*/\n; }`,
			fixed: `a { --b:\n/*c*/; }`,
			warnings: [
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 15,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 15,
					endLine: 1,
					endColumn: 16,
					message: semicolonSpaceBeforeMessages.rejectedBefore(),
				},
			],
		},
		{
			// Behind the flag the run in front of the semicolon is the flag's, which the neighbor trims whatever this rule has written behind the colon by then
			description: `a custom property whose value is a comment on the colon's line and a flag, with a space between the flag and the semicolon`,
			code: `a { --b: /*c*/ !important ; }`,
			fixed: `
				a { --b: /*c*/
				 !important; }
			`,
			warnings: [
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 15,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 26,
					endLine: 1,
					endColumn: 27,
					message: semicolonSpaceBeforeMessages.rejectedBefore(),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: {
		"@stylistic/declaration-block-semicolon-space-before": `never`,
		"@stylistic/indentation": `tab`,
	},

	reject: [
		{
			// The break takes the place of the space in front of the comment, so the line `indentation` indents holds no space the next parse would take off.
			description: `a comment on the colon's line with a space in front of it and a space behind it in front of the semicolon, in a block the neighbor indents`,
			code: `a { b: /*c*/ ; c: d }`,
			fixed: `a { b:\n\t\t/*c*/; c:\n\t\td }`,
			warnings: [
				{
					line: 1,
					column: 12,
					endLine: 1,
					endColumn: 13,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 17,
					endLine: 1,
					endColumn: 18,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 13,
					endLine: 1,
					endColumn: 14,
					message: semicolonSpaceBeforeMessages.rejectedBefore(),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/block-closing-brace-space-before": `never` },

	reject: [
		{
			// The run behind the comment is the one in front of the brace, which the neighbor takes, and a break in front of the comment answers both rules.
			description: `a custom property whose value is a comment on the colon's line closing its block with a space in front of the brace`,
			code: `a { --b: /*c*/ }`,
			fixed: `a { --b:\n/*c*/}`,
			warnings: [
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 15,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 15,
					endLine: 1,
					endColumn: 16,
					message: braceSpaceBeforeMessages.rejectedBefore(),
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
			// The run behind the comment is the one in front of the brace, which the neighbor reads in the value; the break goes there, as the neighbor would write it, and the neighbor finds it in place
			description: `a custom property whose value is a comment on the colon's line, closing its block with a space in front of the brace, beside a rule asking for a break in front of the brace`,
			code: `a { --b: /*c*/ }`,
			fixed: `
				a { --b: /*c*/
				 }
			`,
			warnings: [
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 15,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 15,
					endLine: 1,
					endColumn: 16,
					message: braceNewlineBeforeMessages.expectedBefore,
				},
			],
		},
		{
			description: `a custom property whose value is two spaces, which are the run in front of the brace as well`,
			code: `a { --b:  }`,
			fixed: `
				a { --b:
				  }
			`,
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
					column: 10,
					endLine: 1,
					endColumn: 11,
					message: braceNewlineBeforeMessages.expectedBefore,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-semicolon-newline-before": `never-multi-line` },

	reject: [
		{
			description: `a block on one line, which the neighbor is silent about as it stands and speaks of the moment this rule's break puts it over two`,
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
			description: `a neighbor asking for a break of its own, which the one this rule writes answers as well: the run is written down to the bare break the neighbor's fix spells, so both orders rest on one file`,
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

// A vertical tab and a no-break space are words to the tokenizer, and the shared run reads whitespace the tokenizer's way: the fix writes its break in front of such a character, and the question of whether the run already opens on a break steps over the tokenizer's whitespace only.
testRule({
	ruleName,
	config: [`always`],

	reject: [
		{
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

// The run behind the colon of a declaration closing a block with no semicolon stands in the block's own raw, and `declaration-block-trailing-semicolon: always` puts the semicolon between the colon and that run, so this rule reads the run as the block's whichever order the configuration lists the two in.
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
		{
			// The semicolon listed behind hands the run a custom property keeps for the closing brace to the block, so the run behind the comment is empty once it has run.
			description: `a custom property whose value is a comment alone, closing its block with no semicolon, with a space in front of the brace`,
			code: `a { --b: /*c*/ }`,
			fixed: `
				a { --b: /*c*/
				; }
			`,
			warnings: [
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 15,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 15,
					message: trailingSemicolonMessages.expected,
				},
			],
		},
		{
			// The break in front of the brace is the block's once the semicolon listed behind has run, so it is no break behind the colon.
			description: `the same custom property on a line of its own, whose break in front of the brace is the block's`,
			code: `
				a {
					--b: /*c*/
				}
			`,
			fixed: `
				a {
					--b: /*c*/
				;
				}
			`,
			warnings: [
				{
					line: 2,
					column: 11,
					endLine: 2,
					endColumn: 12,
					message: messages.expectedAfter(),
				},
				{
					line: 2,
					column: 11,
					endLine: 2,
					endColumn: 12,
					message: trailingSemicolonMessages.expected,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-block-trailing-semicolon": `never` },

	reject: [
		{
			// The neighbor takes the run in front of the semicolon with it, so the break standing there is none of the colon's; the break goes into the block's final raw, where it stays once the neighbor has taken the run
			description: `a custom property whose value is a comment on the colon's line and a break in front of the semicolon the neighbor takes away`,
			code: `
				a { --b: /*c*/
				; }
			`,
			fixed: `
				a { --b: /*c*/
				 }
			`,
			warnings: [
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 15,
					message: messages.expectedAfter(),
				},
				{
					line: 2,
					column: 1,
					endLine: 2,
					endColumn: 2,
					message: trailingSemicolonMessages.rejected,
				},
			],
		},
		{
			description: `the same custom property in a block whose final raw opens with a break already, which is the colon's once the semicolon is gone`,
			code: `
				a {
					--b: /*c*/
					;
				}
			`,
			fixed: `
				a {
					--b: /*c*/
				}
			`,
			warnings: [
				{
					line: 2,
					column: 11,
					endLine: 2,
					endColumn: 12,
					message: messages.expectedAfter(),
				},
				{
					line: 3,
					column: 2,
					endLine: 3,
					endColumn: 3,
					message: trailingSemicolonMessages.rejected,
				},
			],
		},
		{
			// A comment closing a plain property's wordless value stays in the value only for the semicolon, and is a sibling on the next parse, so the run behind it is not the declaration's to write and the break goes in front of the comment
			description: `a plain property whose value is a comment on the colon's line and a break in front of the semicolon the neighbor takes away`,
			code: `
				a { b: /*c*/
				; }
			`,
			fixed: `
				a { b:
				/*c*/ }
			`,
			warnings: [
				{
					line: 1,
					column: 12,
					endLine: 1,
					endColumn: 13,
					message: messages.expectedAfter(),
				},
				{
					line: 2,
					column: 1,
					endLine: 2,
					endColumn: 2,
					message: trailingSemicolonMessages.rejected,
				},
			],
		},
	],
})

// A third rule listed between this rule and `declaration-block-trailing-semicolon: always` reads the run a custom property keeps for the closing brace as the semicolon's writer hands it to the block, behind the break this rule writes past a comment.
testRule({
	ruleName,
	config: [`always`],
	extraRules: {
		"@stylistic/declaration-block-semicolon-newline-before": `always`,
		"@stylistic/declaration-block-trailing-semicolon": `always`,
	},

	reject: [
		{
			// The break written behind the comment is the one the semicolon's newline rule asks for, so the semicolon's writer adds none.
			description: `a custom property whose value is a comment alone, closing its block with no semicolon and a space in front of the brace, beside a rule asking for a break in front of the semicolon`,
			code: `a { --b: /*c*/ }`,
			fixed: `
				a { --b: /*c*/
				; }
			`,
			warnings: [
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 15,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 15,
					message: trailingSemicolonMessages.expected,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	extraRules: {
		"@stylistic/block-closing-brace-newline-before": `always`,
		"@stylistic/declaration-block-trailing-semicolon": `always`,
	},

	reject: [
		{
			// The space behind the comment is the block's once the semicolon is written, so the brace rule writes its break into the block rather than into the value.
			description: `a custom property whose value is a comment alone, closing its block with no semicolon and a space in front of the brace, beside a rule asking for a break in front of the brace`,
			code: `a { --b: /*c*/ }`,
			fixed: `
				a { --b: /*c*/
				;
				 }
			`,
			warnings: [
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 15,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 15,
					endLine: 1,
					endColumn: 16,
					message: braceNewlineBeforeMessages.expectedBefore,
				},
				{
					line: 1,
					column: 14,
					endLine: 1,
					endColumn: 15,
					message: trailingSemicolonMessages.expected,
				},
			],
		},
	],
})
