import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

// The solidus the fix adds is spelled the way the two `value-slash-space-*` rules ask (#550). The library lists the rule a block names first and its extra rules behind it, so every block below has the neighbours run last: that is the order in which a solidus written bare would have been one they see only on the run after.
testRule({
	ruleName,
	config: [`ratio`],
	extraRules: {
		"@stylistic/value-slash-space-before": `never`,
		"@stylistic/value-slash-space-after": `never`,
	},

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/550
			description: `a whole number written on its own, whose second number is written behind a solidus spelled tight as both neighbours ask`,
			code: `a { aspect-ratio: 2; }`,
			fixed: `a { aspect-ratio: 2/1; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 20,
			message: messages.expected(`2`, `2/1`),
		},
	],
})

testRule({
	ruleName,
	config: [`ratio`],
	extraRules: {
		"@stylistic/value-slash-space-before": `never`,
		"@stylistic/value-slash-space-after": `always`,
	},

	reject: [
		{
			description: `the same number where the two neighbours ask for different things on their two sides, each side written as its own rule asks`,
			code: `a { aspect-ratio: 2; }`,
			fixed: `a { aspect-ratio: 2/ 1; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 20,
			message: messages.expected(`2`, `2/ 1`),
		},
	],
})

testRule({
	ruleName,
	config: [`ratio`],
	extraRules: {
		"@stylistic/value-slash-space-before": `always`,
		"@stylistic/value-slash-space-after": `never`,
	},

	reject: [
		{
			description: `the same number with the two neighbours the other way round`,
			code: `a { aspect-ratio: 2; }`,
			fixed: `a { aspect-ratio: 2 /1; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 20,
			message: messages.expected(`2`, `2 /1`),
		},
	],
})

testRule({
	ruleName,
	config: [`ratio`],
	extraRules: {
		"@stylistic/value-slash-space-before": `always`,
		"@stylistic/value-slash-space-after": `always`,
	},

	reject: [
		{
			description: `the same number where both neighbours ask for the space the fix writes on its own, so that the file is the same either way`,
			code: `a { aspect-ratio: 2; }`,
			fixed: `a { aspect-ratio: 2 / 1; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 20,
			message: messages.expected(`2`, `2 / 1`),
		},
	],
})

// A neighbour whose fix the configuration turned off cannot rewrite what this rule writes, and it wins where no live rule speaks of the run: the whitespace it asks for is still what is written, the write being this rule's own text (#485).
testRule({
	ruleName,
	config: [`ratio`],
	extraRules: {
		"@stylistic/value-slash-space-before": [`never`, { disableFix: true }],
		"@stylistic/value-slash-space-after": [`never`, { disableFix: true }],
	},

	reject: [
		{
			description: `the same number where both neighbours ask for nothing and have no fix to write with: the solidus is written tight all the same, and neither neighbour has anything left to report`,
			code: `a { aspect-ratio: 2; }`,
			fixed: `a { aspect-ratio: 2/1; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 20,
			message: messages.expected(`2`, `2/1`),
		},
	],
})

// A `-single-line` option speaks of the declaration as printed, from its property to the end of its value, which is the text the two neighbours count the lines of.
testRule({
	ruleName,
	config: [`ratio`],
	extraRules: {
		"@stylistic/value-slash-space-before": `never-single-line`,
		"@stylistic/value-slash-space-after": `never-single-line`,
	},

	reject: [
		{
			description: `a single-line declaration, which both neighbours speak of`,
			code: `a { aspect-ratio: 2; }`,
			fixed: `a { aspect-ratio: 2/1; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 20,
			message: messages.expected(`2`, `2/1`),
		},
		{
			description: `a multi-line declaration, which neither neighbour speaks of: the solidus is written with a space on either side, as it is where the configuration lists neither`,
			code: `
				a {
					aspect-ratio:
						2;
				}
			`,
			fixed: `
				a {
					aspect-ratio:
						2 / 1;
				}
			`,
			line: 3,
			column: 3,
			endLine: 3,
			endColumn: 4,
			message: messages.expected(`2`, `2 / 1`),
		},
	],
})

testRule({
	ruleName,
	config: [`as-written`, { smallestIntegers: true }],
	extraRules: {
		"@stylistic/value-slash-space-before": `never`,
		"@stylistic/value-slash-space-after": `never`,
	},

	reject: [
		{
			description: `a fractional number the reduction writes a second number behind, spelled tight as both neighbours ask`,
			code: `a { aspect-ratio: 1.5; }`,
			fixed: `a { aspect-ratio: 3/2; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 22,
			message: messages.expected(`1.5`, `3/2`),
		},
	],
})
