import { ruleName as commaNewlineAfterRuleName } from "../function-comma-newline-after/index.ts"
import { ruleName as commaSpaceAfterRuleName } from "../function-comma-space-after/index.ts"
import { ruleName as commaSpaceBeforeRuleName } from "../function-comma-space-before/index.ts"
import { ruleName as parenthesesNewlineInsideRuleName } from "../function-parentheses-newline-inside/index.ts"
import { ruleName as parenthesesSpaceInsideRuleName } from "../function-parentheses-space-inside/index.ts"

import { messages, ruleName } from "./index.ts"

// The call this rule writes is one the rules about a call's whitespace never see where the configuration lists them ahead of this one, so every block below names the neighbour and lists this rule as the extra one: that is the order the fix has to answer for, since in the other one the neighbour respells whatever this rule wrote.
let testRule = createTestRule({ ruleName, extraRules: { [ruleName]: true } })

testRule({
	ruleName: commaSpaceAfterRuleName,
	config: [`never`],

	reject: [
		{
			description: `a bare track, whose call is written with no space behind its comma, as the neighbour asks`,
			code: `a { grid-template-columns: 1fr; }`,
			fixed: `a { grid-template-columns: minmax(0,1fr); }`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 31,
			message: messages.expected(`1fr`, `minmax(0,1fr)`),
		},
	],
})

testRule({
	ruleName: commaSpaceAfterRuleName,
	config: [`never-single-line`],

	reject: [
		{
			description: `the same track under the option about a single-line call, which the written call is`,
			code: `a { grid-template-columns: 1fr; }`,
			fixed: `a { grid-template-columns: minmax(0,1fr); }`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 31,
			message: messages.expected(`1fr`, `minmax(0,1fr)`),
		},
	],
})

testRule({
	ruleName: commaSpaceAfterRuleName,
	config: [`never`, { disableFix: true }],

	reject: [
		{
			description: `the same track under a neighbour whose fix is turned off, whose spelling is still written since no live rule speaks of the run`,
			code: `a { grid-template-columns: 1fr; }`,
			fixed: `a { grid-template-columns: minmax(0,1fr); }`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 31,
			message: messages.expected(`1fr`, `minmax(0,1fr)`),
		},
	],
})

testRule({
	ruleName: commaSpaceBeforeRuleName,
	config: [`always`],

	reject: [
		{
			description: `a bare track, whose call is written with a space in front of its comma`,
			code: `a { grid-template-columns: 1fr; }`,
			fixed: `a { grid-template-columns: minmax(0 , 1fr); }`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 31,
			message: messages.expected(`1fr`, `minmax(0 , 1fr)`),
		},
	],
})

testRule({
	ruleName: parenthesesSpaceInsideRuleName,
	config: [`always`],

	reject: [
		{
			description: `a bare track, whose call is written with a space inside either parenthesis`,
			code: `a { grid-template-columns: 1fr; }`,
			fixed: `a { grid-template-columns: minmax( 0, 1fr ); }`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 31,
			message: messages.expected(`1fr`, `minmax( 0, 1fr )`),
		},
	],
})

testRule({
	ruleName: commaNewlineAfterRuleName,
	config: [`always`],

	reject: [
		{
			description: `a bare track, whose call is written with a line break behind its comma`,
			code: `a { grid-template-columns: 1fr; }`,
			fixed: `
				a { grid-template-columns: minmax(0,
				1fr); }
			`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 31,
			message: messages.expected(`1fr`, `minmax(0,\n1fr)`),
		},
	],
})

testRule({
	ruleName: commaNewlineAfterRuleName,
	config: [`always-multi-line`],

	reject: [
		{
			description: `the same track under the option about a multi-line call, which is silent about the single-line one written`,
			code: `a { grid-template-columns: 1fr; }`,
			fixed: `a { grid-template-columns: minmax(0, 1fr); }`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 31,
			message: messages.expected(`1fr`, `minmax(0, 1fr)`),
		},
	],
})

testRule({
	ruleName: parenthesesNewlineInsideRuleName,
	config: [`always`],

	reject: [
		{
			description: `a bare track, whose call is written with a line break inside either parenthesis`,
			code: `a { grid-template-columns: 1fr; }`,
			fixed: `
				a { grid-template-columns: minmax(
				0, 1fr
				); }
			`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 31,
			message: messages.expected(`1fr`, `minmax(\n0, 1fr\n)`),
		},
	],
})

// A rule whose fix is turned off wins only where no live rule speaks of the run. Two live rules contradicting each other over it — a space rule and a break rule both saying `always` — are pinned in the unit test of `whitespaceAsked`, since no case here can be: whichever spelling the fix writes, the other rule reports it on the relint.
testRule({
	ruleName: commaSpaceAfterRuleName,
	config: [`always`],
	extraRules: { [commaNewlineAfterRuleName]: [`always`, { disableFix: true }], [ruleName]: true },

	reject: [
		{
			description: `a live space rule listed ahead of a break rule whose fix is turned off, whose space is written since the turned-off rule cannot rewrite what the live one leaves`,
			code: `a { grid-template-columns: 1fr; }`,
			fixed: `a { grid-template-columns: minmax(0, 1fr); }`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 31,
			message: messages.expected(`1fr`, `minmax(0, 1fr)`),
		},
	],
})
