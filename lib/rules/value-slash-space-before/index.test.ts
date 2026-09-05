import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a space on either side of the solidus`,
			code: `a { grid-area: 1 / 2; }`,
		},
		{
			description: `a space in front of the solidus and none behind it, which this rule does not measure`,
			code: `a { grid-area: 1 /2; }`,
		},
		{
			description: `the solidus of a ratio`,
			code: `a { aspect-ratio: 16 / 9; }`,
		},
		{
			description: `the solidus of a font shorthand`,
			code: `a { font: 12px / 1.5 serif; }`,
		},
		{
			description: `the solidus in front of the alpha of a colour function`,
			code: `a { color: rgb(0 0 0 / 50%); }`,
		},
		{
			description: `a custom property, whose value is read like any other`,
			code: `a { --a: 1 / 2; }`,
		},
		{
			description: `a solidus inside a bare address, which is a character of the address`,
			code: `a { background: url(dir/a.png); }`,
		},
		{
			description: `a solidus inside a quoted address`,
			code: `a { background: url("dir/a.png"); }`,
		},
		{
			description: `a solidus inside a string`,
			code: `a::before { content: "1/2"; }`,
		},
		{
			description: `the division operator of a math function, in whatever case and behind whatever vendor prefix it is named`,
			code: `a { width: calc(100%/3); height: CALC(1px/2); margin: -webkit-calc(1px/2); padding: min(1px/2, 3px); top: clamp(1px, 2px/3, 4px); }`,
		},
		{
			description: `a solidus inside a comment`,
			code: `a { grid-area: 1 / /* 1/2 */ 2; }`,
		},
		{
			description: `a comment standing right in front of the solidus, with a space between them`,
			code: `a { grid-area: 1/*c*/ / 2; }`,
		},
		{
			description: `a parenthesised group in a custom property, whose text the rule does not read`,
			code: `a { --a: (1/2); }`,
		},
		{
			description: `a value opening with the variable of a plugin over plain CSS, which is passed over whole`,
			code: `a { grid-area: $a/2; }`,
		},
		{
			description: `a value holding an interpolation, which is passed over whole`,
			code: `a { grid-area: 2/$(a); }`,
		},
		{
			description: `the solidus of a media feature, which another rule measures`,
			code: `@media (aspect-ratio: 16/9) {}`,
		},
		{
			description: `a vertical tab in front of the space, a word to the tokenizer rather than whitespace`,
			code: `a { grid-area: 1\v / 2; }`,
		},
	],

	reject: [
		{
			description: `no space in front of the solidus`,
			code: `a { grid-area: 1/2; }`,
			fixed: `a { grid-area: 1 /2; }`,
			line: 1,
			column: 17,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab in front of the solidus`,
			code: `a { grid-area: 1\t/ 2; }`,
			fixed: `a { grid-area: 1 / 2; }`,
			line: 1,
			column: 18,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces in front of the solidus`,
			code: `a { grid-area: 1  / 2; }`,
			fixed: `a { grid-area: 1 / 2; }`,
			line: 1,
			column: 19,
			message: messages.expectedBefore(),
		},
		{
			description: `a newline in front of the solidus`,
			code: `a { grid-area: 1\n/ 2; }`,
			fixed: `a { grid-area: 1 / 2; }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `a carriage-return line break in front of the solidus`,
			code: `a { grid-area: 1\r\n/ 2; }`,
			fixed: `a { grid-area: 1 / 2; }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `a comment standing right in front of the solidus, with nothing between them`,
			code: `a { grid-area: 1/*c*// 2; }`,
			fixed: `a { grid-area: 1/*c*/ / 2; }`,
			line: 1,
			column: 22,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of either of two solidi`,
			code: `a { grid-area: 1/2/3; }`,
			fixed: `a { grid-area: 1 /2 /3; }`,
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
		{
			description: `no space in front of the solidus of a colour function`,
			code: `a { color: rgb(0 0 0/50%); }`,
			fixed: `a { color: rgb(0 0 0 /50%); }`,
			line: 1,
			column: 21,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of the solidus of a font shorthand`,
			code: `a { font: 12px/1.5 serif; }`,
			fixed: `a { font: 12px /1.5 serif; }`,
			line: 1,
			column: 15,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of the solidus of a custom property's value`,
			code: `a { --a: 1/2; }`,
			fixed: `a { --a: 1 /2; }`,
			line: 1,
			column: 11,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of the solidus of a value carrying a bang`,
			code: `a { grid-area: 1/2 !important; }`,
			fixed: `a { grid-area: 1 /2 !important; }`,
			line: 1,
			column: 17,
			message: messages.expectedBefore(),
		},
		{
			description: `a call in front of the solidus, which is a part of the value like any other`,
			code: `a { grid-area: var(--r)/span 2; }`,
			fixed: `a { grid-area: var(--r) /span 2; }`,
			line: 1,
			column: 24,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of the solidus of one of two declarations`,
			code: `a { grid-row: 1 / 2; grid-column: 3/4; }`,
			fixed: `a { grid-row: 1 / 2; grid-column: 3 /4; }`,
			line: 1,
			column: 36,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/496
			description: `a vertical tab in front of the solidus, a word to the tokenizer: the space is written beside the character, which stays`,
			code: `a { grid-area: 1\v/ 2; }`,
			fixed: `a { grid-area: 1\v / 2; }`,
			line: 1,
			column: 18,
			endLine: 1,
			endColumn: 19,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `no space in front of the solidus`,
			code: `a { grid-area: 1/ 2; }`,
		},
		{
			description: `no space on either side of the solidus`,
			code: `a { grid-area: 1/2; }`,
		},
		{
			description: `the solidus in front of the alpha of a colour function`,
			code: `a { color: rgb(0 0 0/ 50%); }`,
		},
		{
			description: `a solidus inside a string`,
			code: `a::before { content: "1 / 2"; }`,
		},
		{
			description: `a solidus inside a quoted address`,
			code: `a { background: url("dir /a.png"); }`,
		},
		{
			description: `the division operator of a math function`,
			code: `a { width: calc(100% / 3); }`,
		},
		{
			description: `a comment standing right in front of the solidus, with nothing between them`,
			code: `a { grid-area: 1/*c*// 2; }`,
		},
		{
			description: `a vertical tab in front of the solidus, a word to the tokenizer rather than whitespace`,
			code: `a { grid-area: 1\v/2; }`,
		},
	],

	reject: [
		{
			description: `a space in front of the solidus`,
			code: `a { grid-area: 1 /2; }`,
			fixed: `a { grid-area: 1/2; }`,
			line: 1,
			column: 18,
			message: messages.rejectedBefore(),
		},
		{
			description: `two spaces in front of the solidus`,
			code: `a { grid-area: 1  /2; }`,
			fixed: `a { grid-area: 1/2; }`,
			line: 1,
			column: 19,
			message: messages.rejectedBefore(),
		},
		{
			description: `a tab in front of the solidus`,
			code: `a { grid-area: 1\t/ 2; }`,
			fixed: `a { grid-area: 1/ 2; }`,
			line: 1,
			column: 18,
			message: messages.rejectedBefore(),
		},
		{
			description: `a newline in front of the solidus`,
			code: `a { grid-area: 1\n/ 2; }`,
			fixed: `a { grid-area: 1/ 2; }`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `a carriage-return line break in front of the solidus`,
			code: `a { grid-area: 1\r\n/ 2; }`,
			fixed: `a { grid-area: 1/ 2; }`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space between a comment and the solidus`,
			code: `a { grid-area: 1 /*c*/ /2; }`,
			fixed: `a { grid-area: 1 /*c*//2; }`,
			line: 1,
			column: 24,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space in front of the solidus of a colour function`,
			code: `a { color: rgb(0 0 0 / 50%); }`,
			fixed: `a { color: rgb(0 0 0/ 50%); }`,
			line: 1,
			column: 22,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space in front of either of two solidi`,
			code: `a { grid-area: 1 /2 /3; }`,
			fixed: `a { grid-area: 1/2/3; }`,
			warnings: [
				{
					line: 1,
					column: 18,
					message: messages.rejectedBefore(),
				},
				{
					line: 1,
					column: 21,
					message: messages.rejectedBefore(),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/496
			description: `a vertical tab at the run in front of the solidus: only the tokenizer's run goes, and the character stays`,
			code: `a { grid-area: 1\v /2; }`,
			fixed: `a { grid-area: 1\v/2; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 20,
			message: messages.rejectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			description: `a space in front of the solidus of a single-line declaration`,
			code: `a { grid-area: 1 /2; }`,
		},
		{
			description: `a single-line declaration in a multi-line block, which does not make the declaration multi-line`,
			code: `a {\n\tgrid-area: 1 /2;\n}`,
		},
		{
			description: `a multi-line declaration, which this option does not measure`,
			code: `a { grid-area: 1\n/ 2; }`,
		},
		{
			description: `the same declaration written with a carriage-return line break`,
			code: `a { grid-area: 1\r\n/ 2; }`,
		},
	],

	reject: [
		{
			description: `the message spelled out, since asking the rule for its own text would miss one that says the opposite of what the option asks (see #175)`,
			code: `a { grid-area: 1/2; }`,
			fixed: `a { grid-area: 1 /2; }`,
			line: 1,
			column: 17,
			message: `Expected single space before "/" in a single-line declaration (${ruleName})`,
		},
		{
			description: `no space in front of the solidus of a single-line declaration, inside a multi-line block`,
			code: `a {\n\tgrid-area: 1/2;\n}`,
			fixed: `a {\n\tgrid-area: 1 /2;\n}`,
			line: 2,
			column: 14,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `two spaces in front of the solidus of a single-line declaration`,
			code: `a { grid-area: 1  / 2; }`,
			fixed: `a { grid-area: 1 / 2; }`,
			line: 1,
			column: 19,
			message: messages.expectedBeforeSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `no space in front of the solidus of a single-line declaration`,
			code: `a { grid-area: 1/ 2; }`,
		},
		{
			description: `a single-line declaration in a multi-line block, which does not make the declaration multi-line`,
			code: `a {\n\tgrid-area: 1/2;\n}`,
		},
		{
			description: `a multi-line declaration, which this option does not measure`,
			code: `a { grid-area: 1 /\n2; }`,
		},
		{
			description: `the same declaration written with a carriage-return line break`,
			code: `a { grid-area: 1 /\r\n2; }`,
		},
	],

	reject: [
		{
			description: `a space in front of the solidus of a single-line declaration`,
			code: `a { grid-area: 1 /2; }`,
			fixed: `a { grid-area: 1/2; }`,
			line: 1,
			column: 18,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same declaration in a multi-line block`,
			code: `a {\n\tgrid-area: 1 /2;\n}`,
			fixed: `a {\n\tgrid-area: 1/2;\n}`,
			line: 2,
			column: 15,
			message: messages.rejectedBeforeSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignoreFunctions: [`rgb`, `/^hsl/`] }],

	accept: [
		{
			description: `a solidus inside a call the option names`,
			code: `a { color: rgb(0 0 0/50%); }`,
		},
		{
			description: `a solidus inside a call the option's pattern matches`,
			code: `a { color: hsla(0 0% 0%/50%); }`,
		},
		{
			description: `a solidus inside a call nested in one the option names`,
			code: `a { color: rgb(var(--c, 1/2)/50%); }`,
		},
	],

	reject: [
		{
			description: `a solidus outside every call the option names`,
			code: `a { color: rgb(0 0 0/50%); grid-area: 1/2; }`,
			fixed: `a { color: rgb(0 0 0/50%); grid-area: 1 /2; }`,
			line: 1,
			column: 40,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignoreProperties: [`grid-area`, `/^font/`] }],

	accept: [
		{
			description: `a solidus in the value of a property the option names`,
			code: `a { grid-area: 1/2; }`,
		},
		{
			description: `a solidus in the value of a property the option's pattern matches`,
			code: `a { font-size: 12px/1.5; }`,
		},
	],

	reject: [
		{
			description: `a solidus in the value of a property the option does not name`,
			code: `a { grid-area: 1/2; grid-row: 3/4; }`,
			fixed: `a { grid-area: 1/2; grid-row: 3 /4; }`,
			line: 1,
			column: 32,
			message: messages.expectedBefore(),
		},
	],
})
