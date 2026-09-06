import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a newline in front of the solidus`,
			code: `a { grid-area: 1\n/ 2; }`,
		},
		{
			description: `a newline and indentation in front of the solidus`,
			code: `a { grid-area: 1\n\t/ 2; }`,
		},
		{
			description: `the same value written with a carriage-return line break`,
			code: `a { grid-area: 1\r\n/ 2; }`,
		},
		{
			description: `a solidus inside a string`,
			code: `a::before { content: "1 / 2"; }`,
		},
		{
			description: `a solidus inside a bare address`,
			code: `a { background: url(dir/a.png); }`,
		},
		{
			description: `the division operator of a math function`,
			code: `a { width: calc(100% / 3); }`,
		},
		{
			description: `the solidus of a media feature, which no rule about a newline reads`,
			code: `@media (aspect-ratio: 16 / 9) {}`,
		},
	],

	reject: [
		{
			description: `no whitespace in front of the solidus`,
			code: `a { grid-area: 1/2; }`,
			fixed: `a { grid-area: 1\n/2; }`,
			line: 1,
			column: 17,
			message: messages.expectedBefore(),
		},
		{
			description: `a space in front of the solidus, written over by the newline, since it is the end of a line`,
			code: `a { grid-area: 1 / 2; }`,
			fixed: `a { grid-area: 1\n/ 2; }`,
			line: 1,
			column: 18,
			message: messages.expectedBefore(),
		},
		{
			description: `a comment in front of the solidus, behind which the newline is written`,
			code: `a { grid-area: 1 /*c*/ / 2; }`,
			fixed: `a { grid-area: 1 /*c*/\n/ 2; }`,
			line: 1,
			column: 24,
			message: messages.expectedBefore(),
		},
		{
			description: `a newline behind the solidus and none in front of it`,
			code: `a { grid-area: 1 /\n2; }`,
			fixed: `a { grid-area: 1\n/\n2; }`,
			line: 1,
			column: 18,
			message: messages.expectedBefore(),
		},
		{
			description: `no whitespace in front of either of two solidi`,
			code: `a { grid-area: 1/2/3; }`,
			fixed: `a { grid-area: 1\n/2\n/3; }`,
			warnings: [
				{
					line: 1,
					column: 17,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 19,
					message: messages.expectedBefore(),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a single-line declaration, which this option does not measure`,
			code: `a { grid-area: 1 / 2; }`,
		},
		{
			description: `a single-line declaration in a multi-line block, which does not make the declaration multi-line`,
			code: `a {\n\tgrid-area: 1 / 2;\n}`,
		},
		{
			description: `a newline in front of the solidus of a multi-line declaration`,
			code: `a { grid-area:\n\t1\n\t/ 2; }`,
		},
	],

	reject: [
		{
			description: `the message spelled out, since asking the rule for its own text would miss one that says the opposite of what the option asks (see #175)`,
			code: `a { grid-area:\n\t1 / 2; }`,
			fixed: `a { grid-area:\n\t1\n/ 2; }`,
			line: 2,
			column: 4,
			message: `Expected newline before "/" in a multi-line declaration (${ruleName})`,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			description: `a single-line declaration, which this option does not measure`,
			code: `a { grid-area: 1 / 2; }`,
		},
		{
			description: `no whitespace in front of the solidus of a multi-line declaration`,
			code: `a { grid-area:\n\t1/ 2; }`,
		},
	],

	reject: [
		{
			description: `a newline in front of the solidus, which makes the declaration multi-line`,
			code: `a { grid-area: 1\n/ 2; }`,
			fixed: `a { grid-area: 1/ 2; }`,
			line: 2,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a newline and indentation in front of the solidus of a multi-line declaration`,
			code: `a { grid-area:\n\t1\n\t/ 2; }`,
			fixed: `a { grid-area:\n\t1/ 2; }`,
			line: 3,
			column: 2,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignoreFunctions: [`rgb`], ignoreProperties: [`/^grid-/`] }],

	accept: [
		{
			description: `a solidus inside a call the option names`,
			code: `a { color: rgb(0 0 0 / 50%); }`,
		},
		{
			description: `a solidus in the value of a property the option's pattern matches`,
			code: `a { grid-area: 1 / 2; }`,
		},
	],

	reject: [
		{
			description: `a solidus neither option speaks of`,
			code: `a { font: 12px / 1.5 serif; }`,
			fixed: `a { font: 12px\n/ 1.5 serif; }`,
			line: 1,
			column: 16,
			message: messages.expectedBefore(),
		},
	],
})
