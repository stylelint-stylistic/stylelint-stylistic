import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })
let testRuleConfigs = createTestRuleConfig({ ruleName })

testRule({
	ruleName,
	config: [`ratio`],

	accept: [
		{
			description: `a ratio written with both of its numbers`,
			code: `a { aspect-ratio: 16 / 9; }`,
		},
		{
			description: `a ratio whose numbers share a divisor, which this option says nothing about`,
			code: `a { aspect-ratio: 16 / 8; }`,
		},
		{
			description: `a fractional first number written with a second one, which this option says nothing about either`,
			code: `a { aspect-ratio: 1.5 / 1; }`,
		},
		{
			description: `the keyword on its own, which spells no ratio at all`,
			code: `a { aspect-ratio: auto; }`,
		},
		{
			description: `the keyword behind a ratio written with both of its numbers`,
			code: `a { aspect-ratio: 16 / 9 auto; }`,
		},
		{
			description: `the keyword reaching in between the numbers of a ratio, which spells no value of the property`,
			code: `a { aspect-ratio: 2 auto / 1; }`,
		},
		{
			description: `the keyword reaching in behind the solidus, which spells no value of the property either`,
			code: `a { aspect-ratio: 2 / auto 1; }`,
		},
		{
			description: `a second number of one, already written`,
			code: `a { aspect-ratio: 2 / 1; }`,
		},
		{
			description: `a pair of whole numbers sharing no divisor`,
			code: `a { aspect-ratio: 3 / 2; }`,
		},
		{
			description: `a degenerate ratio, whose second number this option still finds written`,
			code: `a { aspect-ratio: 1 / 0; }`,
		},
		{
			description: `a first number carrying a sign, whose spelling this rule leaves alone`,
			code: `a { aspect-ratio: +2 / 1; }`,
		},
		{
			description: `a number written with an exponent, whose spelling this rule leaves alone`,
			code: `a { aspect-ratio: 2e1; }`,
		},
		{
			description: `a custom property, which is no value of the property this rule reads`,
			code: `a { --ratio: 2; }`,
		},
		{
			description: `a call, which spells no ratio the rule can read`,
			code: `a { aspect-ratio: calc(16 / 9); }`,
		},
		{
			description: `a variable of a custom property`,
			code: `a { aspect-ratio: var(--ratio); }`,
		},
		{
			description: `a keyword of the wide grammar`,
			code: `a { aspect-ratio: inherit; }`,
		},
	],

	reject: [
		{
			description: `a whole number written on its own`,
			code: `a { aspect-ratio: 2; }`,
			fixed: `a { aspect-ratio: 2 / 1; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 20,
			message: messages.expected(`2`, `2 / 1`),
		},
		{
			description: `a fractional number written on its own, which this option writes a second number behind rather than reducing`,
			code: `a { aspect-ratio: 1.5; }`,
			fixed: `a { aspect-ratio: 1.5 / 1; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 22,
			message: messages.expected(`1.5`, `1.5 / 1`),
		},
		{
			description: `a single number in front of the keyword`,
			code: `a { aspect-ratio: auto 2; }`,
			fixed: `a { aspect-ratio: auto 2 / 1; }`,
			line: 1,
			column: 24,
			endLine: 1,
			endColumn: 25,
			message: messages.expected(`2`, `2 / 1`),
		},
		{
			description: `the property written in upper case, which names the same property`,
			code: `a { ASPECT-RATIO: 2; }`,
			fixed: `a { ASPECT-RATIO: 2 / 1; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 20,
			message: messages.expected(`2`, `2 / 1`),
		},
	],
})

testRule({
	ruleName,
	config: [`number-where-possible`],

	accept: [
		{
			description: `a second number that is not one, which no single number can say`,
			code: `a { aspect-ratio: 3 / 2; }`,
		},
		{
			description: `a second number that is not one even though the pair shares a divisor, which this option says nothing about`,
			code: `a { aspect-ratio: 16 / 8; }`,
		},
		{
			description: `a single number`,
			code: `a { aspect-ratio: 2; }`,
		},
		{
			description: `a second number of zero, which is no one`,
			code: `a { aspect-ratio: 1 / 0; }`,
		},
		{
			description: `the keyword reaching in between the numbers of a ratio, whose second number is one that may not be taken out with it`,
			code: `a { aspect-ratio: 2 auto / 1; }`,
		},
		{
			description: `the keyword reaching in behind the solidus, whose second number is one that may not be taken out with it either`,
			code: `a { aspect-ratio: 2 / auto 1; }`,
		},
	],

	reject: [
		{
			description: `a second number of one`,
			code: `a { aspect-ratio: 2 / 1; }`,
			fixed: `a { aspect-ratio: 2; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 24,
			message: messages.expected(`2 / 1`, `2`),
		},
		{
			description: `a second number of one written with a point, which is the same number`,
			code: `a { aspect-ratio: 2 / 1.0; }`,
			fixed: `a { aspect-ratio: 2; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 26,
			message: messages.expected(`2 / 1.0`, `2`),
		},
		{
			description: `a second number of one written behind a zero, which is the same number again`,
			code: `a { aspect-ratio: 2 / 01; }`,
			fixed: `a { aspect-ratio: 2; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 25,
			message: messages.expected(`2 / 01`, `2`),
		},
		{
			description: `a second number of one behind a wide run of whitespace, which the run taken out carries with it`,
			code: `a { aspect-ratio: 2   /   1; }`,
			fixed: `a { aspect-ratio: 2; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 28,
			message: messages.expected(`2   /   1`, `2`),
		},
		{
			description: `a second number of one in front of the keyword`,
			code: `a { aspect-ratio: 2 / 1 auto; }`,
			fixed: `a { aspect-ratio: 2 auto; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 24,
			message: messages.expected(`2 / 1`, `2`),
		},
		{
			description: `a block comment standing between the two numbers, which the run taken out holds: the problem is reported and the value left alone`,
			code: `a { aspect-ratio: 2 /* w */ / 1; }`,
			fixed: `a { aspect-ratio: 2 /* w */ / 1; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 32,
			message: messages.expected(`2 /* w */ / 1`, `2`),
		},
	],
})

testRule({
	ruleName,
	config: [`as-written`],

	accept: [
		{
			description: `a single number, which this option has no opinion about`,
			code: `a { aspect-ratio: 2; }`,
		},
		{
			description: `a second number of one, which this option has no opinion about either`,
			code: `a { aspect-ratio: 2 / 1; }`,
		},
		{
			description: `a pair sharing a divisor, which the other axis is off for`,
			code: `a { aspect-ratio: 16 / 8; }`,
		},
	],

})

testRule({
	ruleName,
	config: [`as-written`, { smallestIntegers: true }],

	accept: [
		{
			description: `a pair of whole numbers sharing no divisor`,
			code: `a { aspect-ratio: 16 / 9; }`,
		},
		{
			description: `a single whole number, whose second number this option does not write`,
			code: `a { aspect-ratio: 2; }`,
		},
		{
			description: `a second number of one already written, which this option leaves written`,
			code: `a { aspect-ratio: 2 / 1; }`,
		},
		{
			description: `a ratio with a zero, which is degenerate and has nothing to be divided by`,
			code: `a { aspect-ratio: 1 / 0; }`,
		},
	],

	reject: [
		{
			description: `a pair sharing a divisor`,
			code: `a { aspect-ratio: 16 / 8; }`,
			fixed: `a { aspect-ratio: 2 / 1; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 25,
			message: messages.expected(`16 / 8`, `2 / 1`),
		},
		{
			description: `a fractional number on its own, whose second number the arithmetic asks for`,
			code: `a { aspect-ratio: 1.5; }`,
			fixed: `a { aspect-ratio: 3 / 2; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 22,
			message: messages.expected(`1.5`, `3 / 2`),
		},
		{
			description: `a fraction below one, which comes out as a pair of whole numbers`,
			code: `a { aspect-ratio: 0.5; }`,
			fixed: `a { aspect-ratio: 1 / 2; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 22,
			message: messages.expected(`0.5`, `1 / 2`),
		},
		{
			description: `two fractions, which are scaled together before they are divided`,
			code: `a { aspect-ratio: 0.5 / 0.25; }`,
			fixed: `a { aspect-ratio: 2 / 1; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 29,
			message: messages.expected(`0.5 / 0.25`, `2 / 1`),
		},
		{
			description: `a whole number written with a trailing zero, whose second number stays unwritten`,
			code: `a { aspect-ratio: 2.0; }`,
			fixed: `a { aspect-ratio: 2; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 22,
			message: messages.expected(`2.0`, `2`),
		},
		{
			description: `a number no pair of small whole numbers says, which is reduced exactly rather than guessed at`,
			code: `a { aspect-ratio: 1.777; }`,
			fixed: `a { aspect-ratio: 1777 / 1000; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 24,
			message: messages.expected(`1.777`, `1777 / 1000`),
		},
		{
			description: `a pair sharing a divisor behind a wide run of whitespace, which is left as it was written`,
			code: `a { aspect-ratio: 16   /   8; }`,
			fixed: `a { aspect-ratio: 2   /   1; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 29,
			message: messages.expected(`16   /   8`, `2   /   1`),
		},
		{
			description: `a block comment standing between the two numbers, which neither number is written over`,
			code: `a { aspect-ratio: 2 /* w */ / 2; }`,
			fixed: `a { aspect-ratio: 1 /* w */ / 1; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 32,
			message: messages.expected(`2 /* w */ / 2`, `1 /* w */ / 1`),
		},
	],
})

testRule({
	ruleName,
	config: [`ratio`, { smallestIntegers: true }],

	accept: [
		{
			description: `a pair of whole numbers sharing no divisor`,
			code: `a { aspect-ratio: 16 / 9; }`,
		},
	],

	reject: [
		{
			description: `a whole number on its own, which both axes have something to say about`,
			code: `a { aspect-ratio: 2.0; }`,
			fixed: `a { aspect-ratio: 2 / 1; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 22,
			message: messages.expected(`2.0`, `2 / 1`),
		},
		{
			description: `a pair sharing a divisor, whose second number stays written`,
			code: `a { aspect-ratio: 16 / 8; }`,
			fixed: `a { aspect-ratio: 2 / 1; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 25,
			message: messages.expected(`16 / 8`, `2 / 1`),
		},
		{
			description: `a ratio of zero, which the arithmetic leaves alone and the notation still writes a second number for`,
			code: `a { aspect-ratio: 0; }`,
			fixed: `a { aspect-ratio: 0 / 1; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 20,
			message: messages.expected(`0`, `0 / 1`),
		},
	],
})

testRule({
	ruleName,
	config: [`number-where-possible`, { smallestIntegers: true }],

	accept: [
		{
			description: `a pair of whole numbers whose second is not one`,
			code: `a { aspect-ratio: 3 / 2; }`,
		},
	],

	reject: [
		{
			description: `a pair sharing a divisor whose second number becomes one`,
			code: `a { aspect-ratio: 16 / 8; }`,
			fixed: `a { aspect-ratio: 2; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 25,
			message: messages.expected(`16 / 8`, `2`),
		},
		{
			description: `a pair of equal numbers`,
			code: `a { aspect-ratio: 2 / 2; }`,
			fixed: `a { aspect-ratio: 1; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 24,
			message: messages.expected(`2 / 2`, `1`),
		},
		{
			description: `two fractions whose ratio is a whole number`,
			code: `a { aspect-ratio: 0.5 / 0.25; }`,
			fixed: `a { aspect-ratio: 2; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 29,
			message: messages.expected(`0.5 / 0.25`, `2`),
		},
	],
})

testRuleConfigs({
	ruleName,

	accept: [
		{
			config: [`ratio`],
		},
		{
			config: [`number-where-possible`],
		},
		{
			config: [`as-written`],
		},
		{
			config: [`ratio`, { smallestIntegers: true }],
		},
		{
			config: [`as-written`, { smallestIntegers: false }],
		},
	],

	reject: [
		{
			config: [`always`],
		},
		{
			config: [`never`],
		},
		{
			config: [true],
		},
		{
			config: [`ratio`, { smallestIntegers: `yes` }],
		},
		{
			config: [`ratio`, { smallest: true }],
		},
	],
})

// The `<ratio>` of a media feature is read under the same options as the property's value (#551), in the plain form and in the range form alike, the `device-aspect-ratio` feature and the `min-` and `max-` spellings of both included.
testRule({
	ruleName,
	config: [`ratio`],

	accept: [
		{
			description: `a feature whose ratio is written with both of its numbers`,
			code: `@media (aspect-ratio: 16 / 9) {}`,
		},
		{
			description: `a ratio in the range form, written with both of its numbers`,
			code: `@media (16 / 9 <= aspect-ratio) {}`,
		},
		{
			description: `a ratio behind the name in the range form`,
			code: `@media (aspect-ratio >= 2 / 1) {}`,
		},
		{
			description: `a feature whose value is no ratio`,
			code: `@media (width: 2) {}`,
		},
		{
			description: `a feature written without a value`,
			code: `@media (aspect-ratio) {}`,
		},
		{
			description: `a feature whose value the media parser cannot read, the variable of a plugin over plain CSS`,
			code: `@media (aspect-ratio: $a) {}`,
		},
		{
			description: `a feature whose value is a call, which spells no ratio the rule can read`,
			code: `@media (aspect-ratio: calc(2)) {}`,
		},
		{
			description: `an at-rule that is no media query, whose parameters the rule does not read`,
			code: `@supports (aspect-ratio: 2) {}`,
		},
	],

	reject: [
		{
			description: `a feature whose ratio is one number`,
			code: `@media (aspect-ratio: 2) {}`,
			fixed: `@media (aspect-ratio: 2 / 1) {}`,
			line: 1,
			column: 23,
			endLine: 1,
			endColumn: 24,
			message: messages.expected(`2`, `2 / 1`),
		},
		{
			description: `the same feature under an upper-case at-rule name and feature name`,
			code: `@MEDIA (ASPECT-RATIO: 2) {}`,
			fixed: `@MEDIA (ASPECT-RATIO: 2 / 1) {}`,
			line: 1,
			column: 23,
			endLine: 1,
			endColumn: 24,
			message: messages.expected(`2`, `2 / 1`),
		},
		{
			description: `one number in front of the name in the range form`,
			code: `@media (2 <= aspect-ratio) {}`,
			fixed: `@media (2 / 1 <= aspect-ratio) {}`,
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 10,
			message: messages.expected(`2`, `2 / 1`),
		},
		{
			description: `one number behind the name in the range form`,
			code: `@media (aspect-ratio >= 2) {}`,
			fixed: `@media (aspect-ratio >= 2 / 1) {}`,
			line: 1,
			column: 25,
			endLine: 1,
			endColumn: 26,
			message: messages.expected(`2`, `2 / 1`),
		},
		{
			description: `a number on either side of the name in the range form, each a ratio of its own`,
			code: `@media (2 <= aspect-ratio <= 3) {}`,
			fixed: `@media (2 / 1 <= aspect-ratio <= 3 / 1) {}`,
			warnings: [
				{
					line: 1,
					column: 30,
					endLine: 1,
					endColumn: 31,
					message: messages.expected(`3`, `3 / 1`),
				},
				{
					line: 1,
					column: 9,
					endLine: 1,
					endColumn: 10,
					message: messages.expected(`2`, `2 / 1`),
				},
			],
		},
		{
			description: `the prefixed spellings of the two features`,
			code: `@media (min-aspect-ratio: 2) and (max-device-aspect-ratio: 3) {}`,
			fixed: `@media (min-aspect-ratio: 2 / 1) and (max-device-aspect-ratio: 3 / 1) {}`,
			warnings: [
				{
					line: 1,
					column: 60,
					endLine: 1,
					endColumn: 61,
					message: messages.expected(`3`, `3 / 1`),
				},
				{
					line: 1,
					column: 27,
					endLine: 1,
					endColumn: 28,
					message: messages.expected(`2`, `2 / 1`),
				},
			],
		},
		{
			description: `a feature and a declaration inside its block, each written on its own`,
			code: `@media (aspect-ratio: 2) { a { aspect-ratio: 2; } }`,
			fixed: `@media (aspect-ratio: 2 / 1) { a { aspect-ratio: 2 / 1; } }`,
			warnings: [
				{
					line: 1,
					column: 46,
					endLine: 1,
					endColumn: 47,
					message: messages.expected(`2`, `2 / 1`),
				},
				{
					line: 1,
					column: 23,
					endLine: 1,
					endColumn: 24,
					message: messages.expected(`2`, `2 / 1`),
				},
			],
		},
		{
			description: `a comment in front of the value, which is no part of it`,
			code: `@media (aspect-ratio: /*c*/ 2) {}`,
			fixed: `@media (aspect-ratio: /*c*/ 2 / 1) {}`,
			line: 1,
			column: 29,
			endLine: 1,
			endColumn: 30,
			message: messages.expected(`2`, `2 / 1`),
		},
		{
			description: `a comment behind the value, which the second number is written in front of`,
			code: `@media (aspect-ratio: 2 /*c*/) {}`,
			fixed: `@media (aspect-ratio: 2 / 1 /*c*/) {}`,
			line: 1,
			column: 23,
			endLine: 1,
			endColumn: 24,
			message: messages.expected(`2`, `2 / 1`),
		},
		{
			description: `two queries of one list, each with a feature of its own`,
			code: `@media screen and (aspect-ratio: 2), print and (aspect-ratio: 3) {}`,
			fixed: `@media screen and (aspect-ratio: 2 / 1), print and (aspect-ratio: 3 / 1) {}`,
			warnings: [
				{
					line: 1,
					column: 63,
					endLine: 1,
					endColumn: 64,
					message: messages.expected(`3`, `3 / 1`),
				},
				{
					line: 1,
					column: 34,
					endLine: 1,
					endColumn: 35,
					message: messages.expected(`2`, `2 / 1`),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`number-where-possible`],

	reject: [
		{
			description: `a feature whose second number is one`,
			code: `@media (aspect-ratio: 2 / 1) {}`,
			fixed: `@media (aspect-ratio: 2) {}`,
			line: 1,
			column: 23,
			endLine: 1,
			endColumn: 28,
			message: messages.expected(`2 / 1`, `2`),
		},
	],
})

testRule({
	ruleName,
	config: [`as-written`, { smallestIntegers: true }],

	reject: [
		{
			description: `a feature whose numbers share a divisor`,
			code: `@media (aspect-ratio: 16 / 8) {}`,
			fixed: `@media (aspect-ratio: 2 / 1) {}`,
			line: 1,
			column: 23,
			endLine: 1,
			endColumn: 29,
			message: messages.expected(`16 / 8`, `2 / 1`),
		},
		{
			description: `a fractional number in the range form, whose second number the arithmetic asks for`,
			code: `@media (1.5 <= aspect-ratio) {}`,
			fixed: `@media (3 / 2 <= aspect-ratio) {}`,
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 12,
			message: messages.expected(`1.5`, `3 / 2`),
		},
	],
})

testRule({
	ruleName,
	config: [`ratio`, { ignore: [`at-rules`] }],

	accept: [
		{
			description: `a feature whose ratio is one number, which the option leaves alone`,
			code: `@media (aspect-ratio: 2) {}`,
		},
		{
			description: `the same in the range form`,
			code: `@media (2 <= aspect-ratio) {}`,
		},
	],

	reject: [
		{
			description: `a declaration, which the option says nothing about`,
			code: `@media (aspect-ratio: 2) { a { aspect-ratio: 2; } }`,
			fixed: `@media (aspect-ratio: 2) { a { aspect-ratio: 2 / 1; } }`,
			line: 1,
			column: 46,
			endLine: 1,
			endColumn: 47,
			message: messages.expected(`2`, `2 / 1`),
		},
	],
})
