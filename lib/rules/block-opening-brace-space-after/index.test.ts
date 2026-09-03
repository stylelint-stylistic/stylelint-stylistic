import { messages as closingNewlineBeforeMessages } from "../block-closing-brace-newline-before/index.ts"
import { messages as openingNewlineBeforeMessages } from "../block-opening-brace-newline-before/index.ts"

import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a blockless at-rule, which has no opening brace to space behind`,
			code: `@import url(x.css)`,
		},
		{
			description: `a space behind the opening brace`,
			code: `a { color: pink; }`,
		},
		{
			description: `nested blocks, each with a space behind its brace`,
			code: `@media print { a { color: pink; } }`,
		},
	],

	reject: [
		{
			description: `a declaration abutting the brace`,
			code: `a {color: pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces where one belongs`,
			code: `a {  color: pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab where the space belongs`,
			code: `a {\tcolor: pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `a break where the space belongs`,
			code: `a {\ncolor: pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a {\r\ncolor: pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `a break behind the at-rule's brace`,
			code: `@media print {\na { color: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			line: 1,
			column: 15,
			message: messages.expectedAfter(),
		},
		{
			description: `a break behind the nested block's brace`,
			code: `@media print { a {\ncolor: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `@media print { a {\r\ncolor: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment abutting the brace, with the space behind the comment`,
			code: `a {/*comment*/ color: pink; }`,
			fixed: `a { /*comment*/ color: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a declaration abutting the brace`,
			code: `a {color: pink; }`,
		},
		{
			description: `nested blocks, each abutting its brace`,
			code: `@media print {a {color: pink; } }`,
		},
	],

	reject: [
		{
			description: `a space behind the brace`,
			code: `a { color: pink; }`,
			fixed: `a {color: pink; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfter(),
		},
		{
			description: `two spaces behind the brace`,
			code: `a {  color: pink; }`,
			fixed: `a {color: pink; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfter(),
		},
		{
			description: `a tab behind the brace`,
			code: `a {\tcolor: pink; }`,
			fixed: `a {color: pink; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfter(),
		},
		{
			description: `a break behind the brace`,
			code: `a {\ncolor: pink; }`,
			fixed: `a {color: pink; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a {\r\ncolor: pink; }`,
			fixed: `a {color: pink; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfter(),
		},
		{
			description: `a break behind the at-rule's brace`,
			code: `@media print {\na {color: pink; } }`,
			fixed: `@media print {a {color: pink; } }`,
			line: 1,
			column: 15,
			message: messages.rejectedAfter(),
		},
		{
			description: `a break behind the nested block's brace`,
			code: `@media print {a {\ncolor: pink; } }`,
			fixed: `@media print {a {color: pink; } }`,
			line: 1,
			column: 18,
			message: messages.rejectedAfter(),
		},
		{
			description: `a comment behind a space, with the brace in front of the space`,
			code: `a { /*comment*/ color: pink; }`,
			fixed: `a {/*comment*/ color: pink; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			description: `a single-line block with the space behind its brace`,
			code: `a { color: pink; }`,
		},
		{
			description: `nested single-line blocks, each with the space`,
			code: `@media print { a { color: pink; } }`,
		},
		{
			description: `a multi-line block, which this option passes over`,
			code: `a {\ncolor: pink; }`,
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a {\r\ncolor: pink; }`,
		},
		{
			description: `a multi-line block whose declaration abuts the brace`,
			code: `a {color:\npink; }`,
		},
		{
			description: `a nested multi-line block, likewise passed over`,
			code: `@media print {a {color:\npink; } }`,
		},
		{
			description: `the same block with the at-rule's brace abutting its own contents`,
			code: `@media print{a {color:\npink; } }`,
		},
	],

	reject: [
		{
			description: `a single-line block whose declaration abuts the brace`,
			code: `a {color: pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `two spaces behind the brace of a single-line block`,
			code: `a {  color: pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a tab behind the brace of a single-line block`,
			code: `a {\tcolor: pink; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a tab behind the at-rule's brace`,
			code: `@media print {\ta { color: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			line: 1,
			column: 15,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a tab behind the nested block's brace`,
			code: `@media print { a {\tcolor: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			line: 1,
			column: 19,
			message: messages.expectedAfterSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `a single-line block whose declaration abuts the brace`,
			code: `a {color: pink; }`,
		},
		{
			description: `nested single-line blocks, each abutting its brace`,
			code: `@media print {a {color: pink; } }`,
		},
		{
			description: `a multi-line block, which this option passes over`,
			code: `a { color:\npink; }`,
		},
		{
			description: `a nested multi-line block, likewise passed over`,
			code: `@media print { a { color:\npink; } }`,
		},
		{
			description: `a nested block broken in front of its brace, which makes the at-rule multi-line`,
			code: `@media print { a\n{color: pink; } }`,
		},
		{
			description: `the same pair spelled with a carriage return`,
			code: `@media print { a\r\n{color: pink; } }`,
		},
	],

	reject: [
		{
			description: `a space behind the brace of a single-line block`,
			code: `a { color: pink; }`,
			fixed: `a {color: pink; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `two spaces behind the brace of a single-line block`,
			code: `a {  color: pink; }`,
			fixed: `a {color: pink; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `a tab behind the brace of a single-line block`,
			code: `a {\tcolor: pink; }`,
			fixed: `a {color: pink; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `a space behind the at-rule's brace, the nested block abutting its own`,
			code: `@media print { a {color: pink; } }`,
			fixed: `@media print {a {color: pink; } }`,
			line: 1,
			column: 15,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `a space behind the nested block's brace`,
			code: `@media print {a { color: pink; } }`,
			fixed: `@media print {a {color: pink; } }`,
			line: 1,
			column: 18,
			message: messages.rejectedAfterSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a multi-line block with the space behind its brace`,
			code: `a { color: pink;\nbackground: orange; }`,
		},
		{
			description: `a nested multi-line block with the space behind its brace`,
			code: `@media print { a { color: pink;\nbackground: orange } }`,
		},
		{
			description: `a single-line block, which this option passes over`,
			code: `a {color: pink; }`,
		},
		{
			description: `nested single-line blocks, likewise passed over`,
			code: `@media print {a {color: pink; } }`,
		},
		{
			description: `a single-line block with a space behind its brace`,
			code: `a { color: pink; }`,
		},
		{
			description: `two spaces behind the brace of a single-line block`,
			code: `a {  color: pink; }`,
		},
		{
			description: `a tab behind the brace of a single-line block`,
			code: `a {\tcolor: pink; }`,
		},
	],

	reject: [
		{
			description: `a multi-line block whose declaration abuts the brace`,
			code: `a {color: pink;\nbackground: orange; }`,
			fixed: `a { color: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `two spaces behind the brace of a multi-line block`,
			code: `a {  color: pink;\nbackground: orange; }`,
			fixed: `a { color: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `a tab behind the brace of a multi-line block`,
			code: `a {\tcolor: pink;\nbackground: orange; }`,
			fixed: `a { color: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `a break behind the brace of a multi-line block`,
			code: `
				a {
				color: pink;
				background: orange; }
			`,
			fixed: `
				a { color: pink;
				background: orange; }
			`,
			line: 1,
			column: 4,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `the same break spelled with carriage returns`,
			code: `a {\r\ncolor: pink;\r\nbackground: orange; }`,
			fixed: `a { color: pink;\r\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `an at-rule broken in front of its brace, holding a multi-line block that abuts its own`,
			code: `
				@media print
				{a { color: pink;
				background: orange; } }
			`,
			fixed: `
				@media print
				{ a { color: pink;
				background: orange; } }
			`,
			line: 2,
			column: 2,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `a nested block broken in front of its brace, whose declaration abuts it`,
			code: `
				@media print { a
				{color: pink;
				background: orange; } }
			`,
			fixed: `
				@media print { a
				{ color: pink;
				background: orange; } }
			`,
			line: 2,
			column: 2,
			message: messages.expectedAfterMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			description: `a multi-line block whose declaration abuts the brace`,
			code: `a {color: pink;\nbackground: orange; }`,
		},
		{
			description: `a nested block abutting its brace, broken in front of it`,
			code: `
				@media print {a
				{color: pink;
				background: orange } }
			`,
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `@media print {a\r\n{color: pink;\r\nbackground: orange } }`,
		},
		{
			description: `a single-line block, which this option passes over`,
			code: `a { color: pink; }`,
		},
		{
			description: `nested single-line blocks, likewise passed over`,
			code: `@media print { a { color: pink; } }`,
		},
		{
			description: `two spaces behind the brace of a single-line block`,
			code: `a {  color: pink; }`,
		},
		{
			description: `a tab behind the brace of a single-line block`,
			code: `a {\tcolor: pink; }`,
		},
	],

	reject: [
		{
			description: `a space behind the brace of a multi-line block`,
			code: `a { color: pink;\nbackground: orange; }`,
			fixed: `a {color: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `two spaces behind the brace of a multi-line block`,
			code: `a {  color: pink;\nbackground: orange; }`,
			fixed: `a {color: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a tab behind the brace of a multi-line block`,
			code: `a {\tcolor: pink;\nbackground: orange; }`,
			fixed: `a {color: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a {\tcolor: pink;\r\nbackground: orange; }`,
			fixed: `a {color: pink;\r\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a break behind the brace of a multi-line block`,
			code: `
				a {
				color: pink;
				background: orange; }
			`,
			fixed: `
				a {color: pink;
				background: orange; }
			`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `an at-rule broken in front of its brace, with a space behind it`,
			code: `
				@media print
				{ a {color: pink;
				background: orange; } }
			`,
			fixed: `
				@media print
				{a {color: pink;
				background: orange; } }
			`,
			line: 2,
			column: 2,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a nested block broken in front of its brace, with a space behind it`,
			code: `
				@media print{a
				{ color: pink;
				background: orange; } }
			`,
			fixed: `
				@media print{a
				{color: pink;
				background: orange; } }
			`,
			line: 2,
			column: 2,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignore: [`at-rules`] }],

	accept: [
		{
			description: `a single-line rule with the space behind its brace`,
			code: `a { color: pink; }`,
		},
		{
			description: `an at-rule and a rule, both with the space, neither in question`,
			code: `@media print { a { color: pink; } }`,
		},
		{
			description: `a break behind the at-rule's brace, which the option leaves to itself`,
			code: `@media print {\na { color: pink; } }`,
		},
	],
	reject: [
		{
			description: `a nested rule abutting its brace, which the option still checks`,
			code: `@media print {\n  a {color: pink; } }`,
			fixed: `@media print {\n  a { color: pink; } }`,
			line: 2,
			column: 6,
			message: messages.expectedAfter(),
		},
	],
})

// A lineness-conditioned check waits for the run's writers (#355): both orders of this pair rest on one and the same file now, where they used to leave two different self-consistent ones.
testRule({
	ruleName,
	config: [`always-multi-line`],
	extraRules: { "@stylistic/block-closing-brace-newline-before": `always` },

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/355
			description: `a block the neighbour's break puts over lines within the same run: the option speaks of the finished block and writes its space, and the file is the one the other order always left`,
			code: `@media screen{\na{b:c;d:e}\n}\n`,
			fixed: `@media screen{ a{ b:c;d:e\n}\n}\n`,
			warnings: [
				{
					line: 2,
					column: 9,
					endLine: 2,
					endColumn: 10,
					message: closingNewlineBeforeMessages.expectedBefore,
				},
				{
					line: 1,
					column: 15,
					endLine: 1,
					endColumn: 16,
					message: messages.expectedAfterMultiLine(),
				},
			],
		},
	],
})

// Two checks both put off for their lineness options run in the plugin's own order rather than the configuration's (#502): the neighbour's subject is a line break, so it speaks first whichever of the two the configuration lists first, and both orders rest on one and the same file.
testRule({
	ruleName,
	config: [`always-single-line`],
	extraRules: { "@stylistic/block-opening-brace-newline-before": `always-single-line` },

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/502
			description: `an outer block the neighbour's break puts over lines, the neighbour listed behind this rule: the file as it stands is single-line and draws a warning from each rule about each brace, and under the fix the neighbour goes first all the same, so the space behind the outer opening brace is written no more`,
			code: `@media(min-width:100px){a{b:c}}\n`,
			fixed: `@media(min-width:100px){a\n{ b:c}}\n`,
			warnings: [
				{
					line: 1,
					column: 25,
					endLine: 1,
					endColumn: 26,
					message: openingNewlineBeforeMessages.expectedBeforeSingleLine(),
				},
				{
					line: 1,
					column: 23,
					endLine: 1,
					endColumn: 24,
					message: openingNewlineBeforeMessages.expectedBeforeSingleLine(),
				},
				{
					line: 1,
					column: 27,
					endLine: 1,
					endColumn: 28,
					message: messages.expectedAfterSingleLine(),
				},
				{
					line: 1,
					column: 25,
					endLine: 1,
					endColumn: 26,
					message: messages.expectedAfterSingleLine(),
				},
			],
		},
	],
})
