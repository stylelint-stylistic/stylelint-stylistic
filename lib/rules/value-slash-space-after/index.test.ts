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
			description: `a space behind the solidus and none in front of it, which this rule does not measure`,
			code: `a { grid-area: 1/ 2; }`,
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
			code: `a { grid-area: 1 /* 1/2 */ / 2; }`,
		},
		{
			description: `a comment standing right behind the solidus, with a space between them`,
			code: `a { grid-area: 1 / /*c*/2; }`,
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
			description: `a vertical tab behind the space, a word to the tokenizer rather than whitespace`,
			code: `a { grid-area: 1 / \v2; }`,
		},
	],

	reject: [
		{
			// See #560
			description: `a solidus among the arguments behind a quoted address, which are those of any call`,
			code: `a { b: url("x", 1/2); }`,
			fixed: `a { b: url("x", 1/ 2); }`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			// The value parser closes such an address on the string's parenthesis
			description: `a solidus inside a string holding a closing parenthesis inside an address the tokenizer's whitespace parts from its parenthesis, beside one of the value`,
			code: `a { b: url( a ")/b" ) 1px/2px; }`,
			fixed: `a { b: url( a ")/b" ) 1px/ 2px; }`,
			line: 1,
			column: 26,
			message: messages.expectedAfter(),
		},
		{
			// A vertical tab is whitespace to the parser and a word to the tokenizer, which glues the name to it
			description: `the same solidus inside an address whose name stands behind a vertical tab`,
			code: `a { b: 1\vurl(a ")/b" c) 2px/3px; }`,
			fixed: `a { b: 1\vurl(a ")/b" c) 2px/ 3px; }`,
			line: 1,
			column: 28,
			message: messages.expectedAfter(),
		},
		{
			description: `no space behind the solidus`,
			code: `a { grid-area: 1/2; }`,
			fixed: `a { grid-area: 1/ 2; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab behind the solidus`,
			code: `a { grid-area: 1 /\t2; }`,
			fixed: `a { grid-area: 1 / 2; }`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces behind the solidus`,
			code: `a { grid-area: 1 /  2; }`,
			fixed: `a { grid-area: 1 / 2; }`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `a newline behind the solidus`,
			code: `a { grid-area: 1 /\n2; }`,
			fixed: `a { grid-area: 1 / 2; }`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `a carriage-return line break behind the solidus`,
			code: `a { grid-area: 1 /\r\n2; }`,
			fixed: `a { grid-area: 1 / 2; }`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment standing right behind the solidus, with nothing between them`,
			code: `a { grid-area: 1 //*c*/ 2; }`,
			fixed: `a { grid-area: 1 / /*c*/ 2; }`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `no space behind either of two solidi`,
			code: `a { grid-area: 1/2/3; }`,
			fixed: `a { grid-area: 1/ 2/ 3; }`,
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
			description: `no space behind the solidus of a colour function`,
			code: `a { color: rgb(0 0 0 /50%); }`,
			fixed: `a { color: rgb(0 0 0 / 50%); }`,
			line: 1,
			column: 22,
			message: messages.expectedAfter(),
		},
		{
			description: `no space behind the solidus of a font shorthand`,
			code: `a { font: 12px/1.5 serif; }`,
			fixed: `a { font: 12px/ 1.5 serif; }`,
			line: 1,
			column: 15,
			message: messages.expectedAfter(),
		},
		{
			description: `no space behind the solidus of a custom property's value`,
			code: `a { --a: 1/2; }`,
			fixed: `a { --a: 1/ 2; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `no space behind the solidus of a value carrying a bang`,
			code: `a { grid-area: 1/2 !important; }`,
			fixed: `a { grid-area: 1/ 2 !important; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `a call behind the solidus, which is a part of the value like any other`,
			code: `a { grid-area: 1/var(--r); }`,
			fixed: `a { grid-area: 1/ var(--r); }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `no space behind the solidus of one of two declarations`,
			code: `a { grid-row: 1 / 2; grid-column: 3/4; }`,
			fixed: `a { grid-row: 1 / 2; grid-column: 3/ 4; }`,
			line: 1,
			column: 36,
			message: messages.expectedAfter(),
		},
		{
			// See #496
			description: `a vertical tab behind the solidus, a word to the tokenizer: the space is written beside the character, which stays`,
			code: `a { grid-area: 1 /\v2; }`,
			fixed: `a { grid-area: 1 / \v2; }`,
			line: 1,
			column: 18,
			endLine: 1,
			endColumn: 19,
			message: messages.expectedAfter(),
		},
		{
			// Pins the refusal to part the name of a bare address from the solidus, which switches how PostCSS reads its parentheses
			description: `a solidus glued to the name of a bare address holding a string with a closing parenthesis, which a written space would make the tokenizer close inside the string`,
			code: `a { b: 1/url(a ")" b) 2px; c: "d" }`,
			fixed: `a { b: 1/url(a ")" b) 2px; c: "d" }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			// Pins the refusal to part the name of a bare address from the solidus, which switches how PostCSS reads its parentheses
			description: `a solidus glued to the name of a bare address holding a block comment with a closing parenthesis, which a written space would make the tokenizer close inside the comment`,
			code: `a { b: 1/url($a /* ) */) 1px; c: 2px }`,
			fixed: `a { b: 1/url($a /* ) */) 1px; c: 2px }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			// Pins the reading of a separator solidus behind a star as text of the name's word, which no comment ends there
			description: `a solidus behind a star glued to the name of a bare address holding a string with a closing parenthesis, which a written space would make the tokenizer close inside the string`,
			code: `a { b: 1 */url(a ")" b) 2px; c: "d" }`,
			fixed: `a { b: 1 */url(a ")" b) 2px; c: "d" }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			// Pins the reading of a string between the name and its parenthesis as a token pushing no word, which leaves the name the word the tokenizer reads last
			description: `a solidus glued to the name of a bare address, a string between the name and its parenthesis, holding a string with a closing parenthesis, which a written space would make the tokenizer close inside the string`,
			code: `a { b: 1/url"x"(a ")" b) 2px; c: "d" }`,
			fixed: `a { b: 1/url"x"(a ")" b) 2px; c: "d" }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			// Pins the reading of an escape between the name and its parenthesis as a token pushing no word
			description: `a solidus glued to the name of a bare address, an escaped comma between the name and its parenthesis, holding a string with a closing parenthesis, which a written space would make the tokenizer close inside the string`,
			code: `a { b: 1/url\\,(a ")" b) 2px; c: "d" }`,
			fixed: `a { b: 1/url\\,(a ")" b) 2px; c: "d" }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `no space behind the solidus`,
			code: `a { grid-area: 1 /2; }`,
		},
		{
			description: `no space on either side of the solidus`,
			code: `a { grid-area: 1/2; }`,
		},
		{
			description: `the solidus in front of the alpha of a colour function`,
			code: `a { color: rgb(0 0 0 /50%); }`,
		},
		{
			description: `a solidus inside a string`,
			code: `a::before { content: "1 / 2"; }`,
		},
		{
			description: `a solidus inside a quoted address`,
			code: `a { background: url("dir/ a.png"); }`,
		},
		{
			description: `the division operator of a math function`,
			code: `a { width: calc(100% / 3); }`,
		},
		{
			description: `a comment standing right behind the solidus, with nothing between them`,
			code: `a { grid-area: 1 //*c*/ 2; }`,
		},
		{
			description: `a vertical tab behind the solidus, a word to the tokenizer rather than whitespace`,
			code: `a { grid-area: 1/\v2; }`,
		},
	],

	reject: [
		{
			description: `a space behind the solidus`,
			code: `a { grid-area: 1/ 2; }`,
			fixed: `a { grid-area: 1/2; }`,
			line: 1,
			column: 17,
			message: messages.rejectedAfter(),
		},
		{
			description: `two spaces behind the solidus`,
			code: `a { grid-area: 1/  2; }`,
			fixed: `a { grid-area: 1/2; }`,
			line: 1,
			column: 17,
			message: messages.rejectedAfter(),
		},
		{
			description: `a tab behind the solidus`,
			code: `a { grid-area: 1 /\t2; }`,
			fixed: `a { grid-area: 1 /2; }`,
			line: 1,
			column: 18,
			message: messages.rejectedAfter(),
		},
		{
			description: `a newline behind the solidus`,
			code: `a { grid-area: 1 /\n2; }`,
			fixed: `a { grid-area: 1 /2; }`,
			line: 1,
			column: 18,
			message: messages.rejectedAfter(),
		},
		{
			description: `a carriage-return line break behind the solidus`,
			code: `a { grid-area: 1 /\r\n2; }`,
			fixed: `a { grid-area: 1 /2; }`,
			line: 1,
			column: 18,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space between the solidus and a comment`,
			code: `a { grid-area: 1 / /*c*/2; }`,
			fixed: `a { grid-area: 1 //*c*/2; }`,
			line: 1,
			column: 18,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space behind the solidus of a colour function`,
			code: `a { color: rgb(0 0 0/ 50%); }`,
			fixed: `a { color: rgb(0 0 0/50%); }`,
			line: 1,
			column: 21,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space behind either of two solidi`,
			code: `a { grid-area: 1/ 2/ 3; }`,
			fixed: `a { grid-area: 1/2/3; }`,
			warnings: [
				{
					line: 1,
					column: 17,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 20,
					message: messages.rejectedAfter(),
				},
			],
		},
		{
			// See #496
			description: `a vertical tab at the run behind the solidus: only the tokenizer's run goes, and the character stays`,
			code: `a { grid-area: 1/ \v2; }`,
			fixed: `a { grid-area: 1/\v2; }`,
			line: 1,
			column: 17,
			endLine: 1,
			endColumn: 18,
			message: messages.rejectedAfter(),
		},
		{
			// Pins the refusal to join the name of a bare address to the solidus, which switches how PostCSS reads its parentheses
			description: `a space between a solidus and the name of a bare address holding a quotation mark nothing closes, which taking the space away would make the tokenizer read as a string`,
			code: `a { b: 1/ url(a"b) 2px; c: "d" }`,
			fixed: `a { b: 1/ url(a"b) 2px; c: "d" }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfter(),
		},
		{
			// Pins the reading of a separator solidus behind a star as text of the name's word, which no comment ends there
			description: `a space between a solidus behind a star and the name of a bare address holding a quotation mark nothing closes, which taking the space away would make the tokenizer read as a string`,
			code: `a { b: 1 */ url(a"b) 2px; c: "d" }`,
			fixed: `a { b: 1 */ url(a"b) 2px; c: "d" }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			// Pins the reading of an at-word between the name and its parenthesis as a token pushing no word
			description: `a space between a solidus and the name of a bare address, an at-word between the name and its parenthesis, holding a quotation mark nothing closes, which taking the space away would make the tokenizer read as a string`,
			code: `a { b: 1/ url@x(a"b) 2px; c: "d" }`,
			fixed: `a { b: 1/ url@x(a"b) 2px; c: "d" }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			description: `a space behind the solidus of a single-line declaration`,
			code: `a { grid-area: 1/ 2; }`,
		},
		{
			description: `a single-line declaration in a multi-line block, which does not make the declaration multi-line`,
			code: `a {\n\tgrid-area: 1/ 2;\n}`,
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
			description: `the message spelled out, since asking the rule for its own text would miss one that says the opposite of what the option asks (see #175)`,
			code: `a { grid-area: 1/2; }`,
			fixed: `a { grid-area: 1/ 2; }`,
			line: 1,
			column: 17,
			message: `Expected single space after "/" in a single-line declaration (${ruleName})`,
		},
		{
			description: `no space behind the solidus of a single-line declaration, inside a multi-line block`,
			code: `a {\n\tgrid-area: 1/2;\n}`,
			fixed: `a {\n\tgrid-area: 1/ 2;\n}`,
			line: 2,
			column: 14,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `two spaces behind the solidus of a single-line declaration`,
			code: `a { grid-area: 1 /  2; }`,
			fixed: `a { grid-area: 1 / 2; }`,
			line: 1,
			column: 18,
			message: messages.expectedAfterSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `no space behind the solidus of a single-line declaration`,
			code: `a { grid-area: 1 /2; }`,
		},
		{
			description: `a single-line declaration in a multi-line block, which does not make the declaration multi-line`,
			code: `a {\n\tgrid-area: 1/2;\n}`,
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
			description: `a space behind the solidus of a single-line declaration`,
			code: `a { grid-area: 1/ 2; }`,
			fixed: `a { grid-area: 1/2; }`,
			line: 1,
			column: 17,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `the same declaration in a multi-line block`,
			code: `a {\n\tgrid-area: 1/ 2;\n}`,
			fixed: `a {\n\tgrid-area: 1/2;\n}`,
			line: 2,
			column: 14,
			message: messages.rejectedAfterSingleLine(),
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
			fixed: `a { color: rgb(0 0 0/50%); grid-area: 1/ 2; }`,
			line: 1,
			column: 40,
			message: messages.expectedAfter(),
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
			fixed: `a { grid-area: 1/2; grid-row: 3/ 4; }`,
			line: 1,
			column: 32,
			message: messages.expectedAfter(),
		},
	],
})

// The break twin writes the run behind the solidus too, and the library lists it behind this rule, so its write would be the file's last (#704)
testRule({
	ruleName,
	config: [`never`],
	extraRules: { "@stylistic/value-slash-newline-after": `always` },

	reject: [
		{
			// The run beside a solidus belongs to one of its two twin rules where their options disagree
			description: `a break behind the solidus, which the twin behind this rule asks for and would write back, so the warning stands and nothing is written here`,
			code: `a { b: 1 /\n2 }`,
			fixed: `a { b: 1 /\n2 }`,
			line: 1,
			column: 10,
			message: messages.rejectedAfter(),
		},
	],
})
