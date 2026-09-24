import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a newline after the comma`,
			code: `a { background-size: 0,\n0; }`,
		},
		{
			description: `two newlines after the comma`,
			code: `
				a { background-size: 0,

				0; }
			`,
		},
		{
			description: `a space in front of the comma and a newline with indentation after it`,
			code: `a { background-size: 0 ,\n  0; }`,
		},
		{
			description: `the same value written with a carriage-return line break`,
			code: `a { background-size: 0 ,\r\n  0; }`,
		},
		{
			description: `two carriage-return line breaks after the comma`,
			code: `a { background-size: 0 ,\r\n\r\n  0; }`,
		},
		{
			description: `commas inside a string, which are no commas of a value list`,
			code: `a::before { content: "foo,bar,baz"; }`,
		},
		{
			description: `commas inside the arguments of a function, which another rule measures`,
			code: `a { transform: translate(1,1); }`,
		},
		{
			description: `an SCSS map, whose inner commas the rule does not measure`,
			code: `
				$grid-breakpoints: (
				(xs),
				(sm, 768px)
				) !default;
			`,
		},
		{
			description: `an end-of-line comment standing between the comma and the newline`,
			code: `a { background-size: 0, //\n0; }`,
		},
		{
			description: `a block comment standing between the comma and the newline`,
			code: `a { background-size: 0, /**/\n0; }`,
		},
		{
			description: `a bare address in front of the comma, whose double slash opens no comment`,
			code: `
				a { background: url(http://x/y.png),
				url(http://x/z.png); }
			`,
		},
	],

	reject: [
		{
			description: `a space after the comma`,
			code: `a { background-size: 0, 0; }`,
			fixed: `a { background-size: 0,\n 0; }`,
			line: 1,
			column: 23,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces after the comma`,
			code: `a { background-size: 0,  0; }`,
			fixed: `a { background-size: 0,\n  0; }`,
			line: 1,
			column: 23,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab after the comma`,
			code: `a { background-size: 0,\t0; }`,
			fixed: `a { background-size: 0,\n\t0; }`,
			line: 1,
			column: 23,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment standing right after the comma, with no newline behind it`,
			code: `a { background-size: 0, /**/0; }`,
			fixed: `a { background-size: 0, /**/\n0; }`,
			line: 1,
			column: 28,
			message: messages.expectedAfter(),
		},
		{
			description: `a comma opening the value, which is the value's first character`,
			code: `a { prop: ,0; }`,
			fixed: `a { prop: ,\n0; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `a comma inside the property name, which the fixer has to leave standing`,
			code: `a { pr,op: 0,0; }`,
			fixed: `a { pr,op: 0,\n0; }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 13,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			description: `a comma behind a bare address, whose double slash opens no comment`,
			code: `a { background: url(http://x/y.png),url(http://x/z.png); }`,
			fixed: `
				a { background: url(http://x/y.png),
				url(http://x/z.png); }
			`,
			line: 1,
			column: 36,
			message: messages.expectedAfter(),
		},
		{
			// A write parting the name of a bare address from the comma or joining it to the comma switches how PostCSS reads its parentheses
			description: `a comma glued to the name of a bare address holding a string with a closing parenthesis, which a written run would make the tokenizer close inside the string`,
			code: `a { b: 1,url(a ")" b) 2px; }`,
			fixed: `a { b: 1,url(a ")" b) 2px; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			// Pins the reading of a string inside parentheses the tokenizer reads as code behind a sign glued to the name, whose comma is no comma of the list
			description: `no newline after the comma behind a bare address whose name a solidus is glued to, holding a string with a closing parenthesis and a comma, which are text of the string`,
			code: `a { b: 1px,\n1/url(a "),b" ),2px; }`,
			fixed: `a { b: 1px,\n1/url(a "),b" ),\n2px; }`,
			line: 2,
			column: 16,
			message: messages.expectedAfter(),
		},
		{
			description: `the same string behind a comma glued to the name, holding a space on either side of its comma, where the break beside the glued comma is refused as above and the one behind the address written`,
			code: `a { b: 1px,\n1,url(a ") , b" ),2px; }`,
			fixed: `a { b: 1px,\n1,url(a ") , b" ),\n2px; }`,
			warnings: [
				{
					line: 2,
					column: 2,
					message: messages.expectedAfter(),
				},
				{
					line: 2,
					column: 18,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			// PostCSS holds `(a,[b)` as one token, opaque to the parser; a break inside makes it code, whose `[` opens a group nothing closes, and the file stops parsing
			description: `parentheses without a name holding a square bracket nothing closes, where the break is refused and the warning stands`,
			code: `a { b: 1 (a,[b) 2px; }`,
			fixed: `a { b: 1 (a,[b) 2px; }`,
			line: 1,
			column: 12,
			message: messages.expectedAfter(),
		},
		{
			description: `parentheses holding a brace nothing closes in a custom property's value, where the parser reads a brace as a group too, refused likewise`,
			code: `a { --b: (a,{b); }`,
			fixed: `a { --b: (a,{b); }`,
			line: 1,
			column: 12,
			message: messages.expectedAfter(),
		},
		{
			description: `parentheses holding a square bracket closed inside them, which code reads as a group of its own, so the break is written`,
			code: `a { b: (a[b],c); }`,
			fixed: `a { b: (a[b],\nc); }`,
			line: 1,
			column: 13,
			message: messages.expectedAfter(),
		},
		{
			description: `parentheses holding a brace nothing closes in an ordinary property's value, where the parser passes a brace inside parentheses over, so the break is written`,
			code: `a { b: (a{b,c); }`,
			fixed: `a { b: (a{b,\nc); }`,
			line: 1,
			column: 12,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a newline after every comma of a multi-line list`,
			code: `
				a { background-size: 0,
				0,
				0; }
			`,
		},
		{
			description: `comments standing between the commas and the newlines`,
			code: `a { background-size: 0, //\n0, /**/\n0; }`,
		},
		{
			description: `a space in front of the first comma and indentation after it`,
			code: `
				a { background-size: 0 ,
				  0,
				0; }
			`,
		},
		{
			description: `the same value written with carriage-return line breaks`,
			code: `a { background-size: 0 ,\r\n  0,\r\n0; }`,
		},
		{
			description: `a single-line list, which this option does not measure`,
			code: `a { background-size: 0, 0; }`,
		},
		{
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
			code: `a { background-size: 0, 0;\n}`,
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a { background-size: 0, 0;\r\n}`,
		},
		{
			description: `a single-line list carrying a comment, inside a multi-line block`,
			code: `a { background-size: 0, /**/ 0; }`,
		},
	],

	reject: [
		{
			description: `a comma opening the value, which is the value's first character`,
			code: `a { prop: ,0,\n1; }`,
			fixed: `a { prop: ,\n0,\n1; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `a space after the second comma of a multi-line list`,
			code: `a { background-size: 0,\n0, 0; }`,
			fixed: `a { background-size: 0,\n0,\n 0; }`,
			line: 2,
			column: 2,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `a comment standing right after the second comma, with no newline behind it`,
			code: `a { background-size: 0, //\n0, /**/0; }`,
			fixed: `a { background-size: 0, //\n0, /**/\n0; }`,
			line: 2,
			column: 7,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `two spaces after the second comma`,
			code: `a { background-size: 0,\n0,  0; }`,
			fixed: `a { background-size: 0,\n0,\n  0; }`,
			line: 2,
			column: 2,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `a tab after the second comma`,
			code: `a { background-size: 0,\n0,\t0; }`,
			fixed: `a { background-size: 0,\n0,\n\t0; }`,
			line: 2,
			column: 2,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `the same value written with a carriage-return line break`,
			code: `a { background-size: 0,\r\n0,\t0; }`,
			fixed: `a { background-size: 0,\r\n0,\r\n\t0; }`,
			line: 2,
			column: 2,
			message: messages.expectedAfterMultiLine(),
		},
		{
			// The list is multi-line by a break outside the parentheses, which PostCSS still holds as one token; a break written inside makes them code, whose `[` nothing closes
			description: `a multi-line list holding parentheses without a name whose square bracket nothing closes, where the break is refused and the warning stands`,
			code: `a { b: 1 (a,[b) 2px,\n3px; }`,
			fixed: `a { b: 1 (a,[b) 2px,\n3px; }`,
			line: 1,
			column: 12,
			message: messages.expectedAfterMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			description: `a newline in front of every comma, which leaves nothing after them`,
			code: `a { background-size: 0\n,0\n,0; }`,
		},
		{
			description: `comments standing in front of the newlines that precede the commas`,
			code: `a { background-size: 0 //\n,0 /**/\n,0; }`,
		},
		{
			description: `the same value written with carriage-return line breaks`,
			code: `a { background-size: 0\r\n,0\r\n,0; }`,
		},
		{
			description: `a single-line list, which this option does not measure`,
			code: `a { background-size: 0, 0; }`,
		},
		{
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
			code: `a { background-size: 0, 0;\n}`,
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a { background-size: 0, 0;\r\n}`,
		},
	],

	reject: [
		{
			description: `a comma opening the value, whose whitespace belongs to the value like any other`,
			code: `a { prop: ,\n0; }`,
			fixed: `a { prop: ,0; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a space after the last comma of a multi-line list`,
			code: `a { background-size: 0\n,0\n, 0; }`,
			fixed: `a { background-size: 0\n,0\n,0; }`,
			line: 3,
			column: 1,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `two spaces after the last comma`,
			code: `a { background-size: 0\n,0\n,  0; }`,
			fixed: `a { background-size: 0\n,0\n,0; }`,
			line: 3,
			column: 1,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `the same value written with carriage-return line breaks`,
			code: `a { background-size: 0\r\n,0\r\n,  0; }`,
			fixed: `a { background-size: 0\r\n,0\r\n,0; }`,
			line: 3,
			column: 1,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a tab after the last comma`,
			code: `a { background-size: 0\n,0\n,\t0; }`,
			fixed: `a { background-size: 0\n,0\n,0; }`,
			line: 3,
			column: 1,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			// A write parting the name of a bare address from the comma or joining it to the comma switches how PostCSS reads its parentheses
			description: `a run between a comma and the name of a bare address holding a quotation mark nothing closes, which taking the run away would make the tokenizer read as a string`,
			code: `a { b: 1,\nurl(a"b); }`,
			fixed: `a { b: 1,\nurl(a"b); }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})

// A vertical tab and a no-break space are words to PostCSS's tokenizer: the fix rewrites only the run the tokenizer reads beside its anchor, and such a character stays where the fix used to carry it off.
testRule({
	ruleName,
	config: [`never-multi-line`],

	reject: [
		{
			description: `a vertical tab behind a comma's run in a multi-line list: each run is trimmed to the tokenizer's, and the character stays`,
			code: `a { b: x, \vy,\nz; }`,
			fixed: `a { b: x,\vy,z; }`,
			warnings: [
				{
					line: 1,
					column: 9,
					endLine: 1,
					endColumn: 10,
					message: messages.rejectedAfterMultiLine(),
				},
				{
					line: 1,
					column: 13,
					endLine: 1,
					endColumn: 14,
					message: messages.rejectedAfterMultiLine(),
				},
			],
		},
	],
})
