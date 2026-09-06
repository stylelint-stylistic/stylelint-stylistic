import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a newline behind the solidus`,
			code: `a { grid-area: 1 /\n2; }`,
		},
		{
			description: `a newline and indentation behind the solidus`,
			code: `a { grid-area: 1 /\n\t2; }`,
		},
		{
			description: `the same value written with a carriage-return line break`,
			code: `a { grid-area: 1 /\r\n2; }`,
		},
		{
			description: `two newlines behind the solidus`,
			code: `a { grid-area: 1 /\n\n2; }`,
		},
		{
			description: `a block comment standing between the solidus and the newline`,
			code: `a { grid-area: 1 / /*c*/\n2; }`,
		},
		{
			description: `a double slash behind the solidus, which spells the end-of-line comment of a preprocessor and is passed over as the comma twin passes it over`,
			code: `a { grid-area: 1 / // c\n2; }`,
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
			description: `no whitespace behind the solidus`,
			code: `a { grid-area: 1/2; }`,
			fixed: `a { grid-area: 1/\n2; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `a space behind the solidus, which the newline is written in front of, as the comma twin writes it`,
			code: `a { grid-area: 1 / 2; }`,
			fixed: `a { grid-area: 1 /\n 2; }`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab behind the solidus, which stays as the next line's indentation`,
			code: `a { grid-area: 1 /\t2; }`,
			fixed: `a { grid-area: 1 /\n\t2; }`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `a block comment behind the solidus with no newline behind it: the newline is written behind the comment`,
			code: `a { grid-area: 1 / /*c*/ 2; }`,
			fixed: `a { grid-area: 1 / /*c*/\n 2; }`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `a newline in front of the solidus and none behind it`,
			code: `a { grid-area: 1\n/ 2; }`,
			fixed: `a { grid-area: 1\n/\n 2; }`,
			line: 2,
			column: 1,
			message: messages.expectedAfter(),
		},
		{
			description: `no whitespace behind either of two solidi`,
			code: `a { grid-area: 1/2/3; }`,
			fixed: `a { grid-area: 1/\n2/\n3; }`,
			warnings: [
				{
					line: 1,
					column: 17,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 19,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			description: `a declaration inside a multi-line block`,
			code: `a {\n\tgrid-area: 1/2;\n}`,
			fixed: `a {\n\tgrid-area: 1/\n2;\n}`,
			line: 2,
			column: 14,
			message: messages.expectedAfter(),
		},
		{
			description: `the solidus of a colour function`,
			code: `a { color: rgb(0 0 0 / 50%); }`,
			fixed: `a { color: rgb(0 0 0 /\n 50%); }`,
			line: 1,
			column: 22,
			message: messages.expectedAfter(),
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
			description: `a newline behind the solidus of a multi-line declaration`,
			code: `a { grid-area:\n\t1 /\n\t2; }`,
		},
	],

	reject: [
		{
			description: `the message spelled out, since asking the rule for its own text would miss one that says the opposite of what the option asks (see #175)`,
			code: `a { grid-area:\n\t1 / 2; }`,
			fixed: `a { grid-area:\n\t1 /\n 2; }`,
			line: 2,
			column: 4,
			message: `Expected newline after "/" in a multi-line declaration (${ruleName})`,
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
			description: `no whitespace behind the solidus of a multi-line declaration`,
			code: `a { grid-area:\n\t1 /2; }`,
		},
	],

	reject: [
		{
			description: `a newline behind the solidus, which makes the declaration multi-line`,
			code: `a { grid-area: 1 /\n2; }`,
			fixed: `a { grid-area: 1 /2; }`,
			line: 1,
			column: 18,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a newline and indentation behind the solidus of a multi-line declaration`,
			code: `a { grid-area:\n\t1 /\n\t\t2; }`,
			fixed: `a { grid-area:\n\t1 /2; }`,
			line: 2,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a block comment behind the solidus and a newline behind the comment, which is taken away behind the comment`,
			code: `a { grid-area: 1 / /*c*/\n2; }`,
			fixed: `a { grid-area: 1 / /*c*/2; }`,
			line: 1,
			column: 18,
			message: messages.rejectedAfterMultiLine(),
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
			fixed: `a { font: 12px /\n 1.5 serif; }`,
			line: 1,
			column: 16,
			message: messages.expectedAfter(),
		},
	],
})
