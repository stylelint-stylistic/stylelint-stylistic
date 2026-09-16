import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a declaration with no bang at all`,
			code: `a { color: pink; }`,
		},
		{
			description: `a space behind the bang and none in front of it`,
			code: `a { color: pink! important; }`,
		},
		{
			description: `spaces on both sides of the bang`,
			code: `a { color: pink ! default; }`,
		},
		{
			description: `a break in front of the bang and a space behind it`,
			code: `a { color: pink\n! important; }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink\r\n! optional; }`,
		},
		{
			description: `bangs standing in a string, which spell no flag`,
			code: `a::before { content: "!!!" ! important; }`,
		},
		{
			description: `a flag spelled inside a comment, which is no flag`,
			code: `a { color: pink /* !important */;}`,
		},
		{
			// See #215
			description: `the flag standing behind a bare address, whose double slash opens no comment`,
			code: `a { b: url(http://x) ! important; }`,
		},
		{
			// Pins that a bang behind an odd run of backslashes is a character of a word
			description: `an escaped bang inside a word and one in front of the word important, neither of which is a flag`,
			code: `a { b: c\\!d; } a { b: c \\!important; }`,
		},
		{
			// Pins that a run of three backslashes escapes the bang as a run of one does
			description: `an escaped backslash and an escaped bang inside a word`,
			code: `a { b: c\\\\\\!d; }`,
		},
	],

	reject: [
		{
			description: `the flag abutting the bang`,
			code: `a { color: pink!important; }`,
			fixed: `a { color: pink! important; }`,
			line: 1,
			column: 16,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces behind the bang`,
			code: `a { color: pink!  global; }`,
			fixed: `a { color: pink! global; }`,
			line: 1,
			column: 16,
			message: messages.expectedAfter(),
		},
		{
			description: `a break behind the bang`,
			code: `a { color: pink!\nimportant; }`,
			fixed: `a { color: pink! important; }`,
			line: 1,
			column: 16,
			message: messages.expectedAfter(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink!\r\nexciting; }`,
			fixed: `a { color: pink! exciting; }`,
			line: 1,
			column: 16,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment behind the bang, standing where the space belongs`,
			code: `a { color: pink !/*comment*/important; }`,
			fixed: `a { color: pink ! /*comment*/important; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			description: `the same comment in front of another flag word`,
			code: `a { color: pink !/*comment*/global; }`,
			fixed: `a { color: pink ! /*comment*/global; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			// See #215
			description: `the flag standing behind a bare address, whose double slash opens no comment`,
			code: `a { b: url(http://x) !important; }`,
			fixed: `a { b: url(http://x) ! important; }`,
			line: 1,
			column: 22,
			message: messages.expectedAfter(),
		},
		{
			// See #216
			description: `a bare address inside a call the plugin knows nothing of: plain CSS spells no comment with a double slash`,
			code: `a { b: myurl(//a) !important; }`,
			fixed: `a { b: myurl(//a) ! important; }`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(),
		},
		{
			// See #289
			description: `a value ending on a bang of its own: the run behind that bang is the head of the flag's raw, and the space asked for goes there`,
			code: `a { b: x!  !important; }`,
			fixed: `a { b: x! ! important; }`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 12,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			// See #239
			description: `two bangs, the second of them standing behind a comment: each is given its space behind its own bang, in one run`,
			code: `a { b: 1px!important 2px /*c*/!important; }`,
			fixed: `a { b: 1px! important 2px /*c*/! important; }`,
			warnings: [
				{
					line: 1,
					column: 11,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 31,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			// See #239
			description: `two bangs parted by a double slash, which plain CSS spells no comment with: the pair is left standing`,
			code: `a { b: 1px!important//!important; }`,
			fixed: `a { b: 1px! important//! important; }`,
			warnings: [
				{
					line: 1,
					column: 11,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 23,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			// See #239
			description: `two bangs with nothing between them but a value, which keeps its every character`,
			code: `a { b: 1px!important 2px!important; }`,
			fixed: `a { b: 1px! important 2px! important; }`,
			warnings: [
				{
					line: 1,
					column: 11,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 25,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			// Pins the address spans the bang checker passes over
			description: `no space behind the flag standing behind a bare address holding a bang, which is a character of the address`,
			code: `a { b: url(x!y) !important; }`,
			fixed: `a { b: url(x!y) ! important; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
		{
			// Pins the refusal to part the name of a bare address from the bang, which switches how PostCSS reads its parentheses
			description: `a bang glued to the name of a bare address holding a string with a closing parenthesis, which a written space would make the tokenizer close inside the string`,
			code: `a { b: 1!url(a ")" b) 2px; }`,
			fixed: `a { b: 1!url(a ")" b) 2px; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			// Pins that an even run of backslashes escapes only its own backslashes, so the bang behind it is a flag
			description: `an escaped backslash abutting the bang`,
			code: `a { color: red\\\\!important; }`,
			fixed: `a { color: red\\\\! important; }`,
			line: 1,
			column: 17,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a declaration with no bang at all`,
			code: `a { color: pink; }`,
		},
		{
			description: `the flag abutting the bang, with nothing in front of it either`,
			code: `a { color: pink!important; }`,
		},
		{
			description: `a space in front of the bang and none behind it`,
			code: `a { color: pink !important; }`,
		},
		{
			description: `a break in front of the bang and nothing behind it`,
			code: `a { color: pink\n!important; }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink\r\n!important; }`,
		},
		{
			// Pins the address spans the bang checker passes over
			description: `a bang with a space behind it inside a bare address, whose space is the address's`,
			code: `a { b: url(x! y) !important; }`,
		},
		{
			// Pins that a bang behind an odd run of backslashes is a character of a word
			description: `an escaped bang with a space behind it, which parts two words rather than a flag`,
			code: `a { b: c\\! d; }`,
		},
	],

	reject: [
		{
			description: `a space behind the bang`,
			code: `a { color: pink! important; }`,
			fixed: `a { color: pink!important; }`,
			line: 1,
			column: 16,
			message: messages.rejectedAfter(),
		},
		{
			description: `a break behind the bang`,
			code: `a { color: pink!\nimportant; }`,
			fixed: `a { color: pink!important; }`,
			line: 1,
			column: 16,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink!\r\nimportant; }`,
			fixed: `a { color: pink!important; }`,
			line: 1,
			column: 16,
			message: messages.rejectedAfter(),
		},
		{
			description: `a comment behind the bang, standing where nothing should`,
			code: `a { color: pink ! /*comment*/important; }`,
			fixed: `a { color: pink !/*comment*/important; }`,
			line: 1,
			column: 17,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same comment in front of another flag word`,
			code: `a { color: pink ! /*comment*/global; }`,
			fixed: `a { color: pink !/*comment*/global; }`,
			line: 1,
			column: 17,
			message: messages.rejectedAfter(),
		},
		{
			// See #289
			description: `a value ending on a bang of its own: the run behind that bang is the head of the flag's raw, and this option takes it away there`,
			code: `a { b: x!  !important; }`,
			fixed: `a { b: x!!important; }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfter(),
		},
		{
			// See #239
			description: `two bangs, whose whitespace this option takes away rather than writes, which moves the second of them the other way`,
			code: `a { b: 1px! important 2px! important; }`,
			fixed: `a { b: 1px!important 2px!important; }`,
			warnings: [
				{
					line: 1,
					column: 11,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 26,
					message: messages.rejectedAfter(),
				},
			],
		},
		{
			// Pins the refusal to join the name of a bare address to the bang, which switches how PostCSS reads its parentheses
			description: `a space between a bang and the name of a bare address holding a quotation mark nothing closes, which taking the space away would make the tokenizer read as a string`,
			code: `a { b: 1! url(a"b) 2px; }`,
			fixed: `a { b: 1! url(a"b) 2px; }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfter(),
		},
	],
})

// A vertical tab and a no-break space are words to PostCSS's tokenizer (#496): the fix rewrites only the run the tokenizer reads beside its anchor, and such a character stays where the fix used to carry it off.
testRule({
	ruleName,
	config: [`always`],

	reject: [
		{
			// See #496
			description: `a vertical tab behind the bang, a word to the tokenizer: the space is written beside the character, which stays`,
			code: `a { b: c !\vimportant; }`,
			fixed: `a { b: c ! \vimportant; }`,
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
	config: [`never`],

	reject: [
		{
			// See #496
			description: `a vertical tab behind the run after the bang: only the tokenizer's run goes, and the character stays`,
			code: `a { b: c ! \vimportant; }`,
			fixed: `a { b: c !\vimportant; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.rejectedAfter(),
		},
	],
})
