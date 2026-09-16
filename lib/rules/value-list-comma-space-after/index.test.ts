import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a space on either side of the comma`,
			code: `a { background-size: 0 , 0; }`,
		},
		{
			description: `a space after the comma`,
			code: `a { background-size: 0, 0; }`,
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
			// See #153
			description: `a bare address in front of the comma, whose double slash opens no comment`,
			code: `a { background: url(http://x/y.png), url(http://x/z.png); }`,
		},
	],

	reject: [
		{
			description: `no space after the comma`,
			code: `a { background-size: 0,0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 1,
			column: 23,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces after the comma, in a value that opens on the line below the colon`,
			code: `a { background-size:\n\t0,  0; }`,
			fixed: `a { background-size:\n\t0, 0; }`,
			line: 2,
			column: 3,
			message: messages.expectedAfter(),
		},
		{
			description: `a newline after the comma`,
			code: `a { background-size: 0,\n0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 1,
			column: 23,
			message: messages.expectedAfter(),
		},
		{
			description: `a carriage-return line break after the comma`,
			code: `a { background-size: 0,\r\n0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 1,
			column: 23,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab after the comma`,
			code: `a { background-size: 0,\t0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 1,
			column: 23,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment standing right after the comma`,
			code: `a { background-size: 0,/*1*/0; }`,
			fixed: `a { background-size: 0, /*1*/0; }`,
			line: 1,
			column: 23,
			message: messages.expectedAfter(),
		},
		{
			description: `no space after any of the three commas`,
			code: `a { background-size: 0,0,0,0; }`,
			fixed: `a { background-size: 0, 0, 0, 0; }`,
			warnings: [
				{
					line: 1,
					column: 23,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 25,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 27,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			description: `no space after the comma of a custom property`,
			code: `:root { --variable: 0,0; }`,
			fixed: `:root { --variable: 0, 0; }`,
			line: 1,
			column: 22,
			message: messages.expectedAfter(),
		},
		{
			description: `a comma opening the value, which is the value's first character`,
			code: `a { prop: ,0; }`,
			fixed: `a { prop: , 0; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
		{
			description: `the same, in a custom property`,
			code: `a { --a: ,0; }`,
			fixed: `a { --a: , 0; }`,
			line: 1,
			column: 10,
			message: messages.expectedAfter(),
		},
		{
			description: `a comma inside the property name, which the fixer has to leave standing`,
			code: `a { pr,op: 0,0; }`,
			fixed: `a { pr,op: 0, 0; }`,
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
			description: `no space after any of the seven commas`,
			code: `a{b: 0,0,0,0,0,0,0,0; }`,
			fixed: `a{b: 0, 0, 0, 0, 0, 0, 0, 0; }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 9,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 11,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 13,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 15,
					message: messages.expectedAfter(),
				},
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
			// See #153
			description: `a comma behind a bare address, whose double slash opens no comment`,
			code: `a { background: url(http://x/y.png),url(http://x/z.png); }`,
			fixed: `a { background: url(http://x/y.png), url(http://x/z.png); }`,
			line: 1,
			column: 36,
			message: messages.expectedAfter(),
		},
		{
			// See #216
			description: `a double slash standing in the code of a plain CSS value, which spells no comment`,
			code: `a { b: a//b,2px; }`,
			fixed: `a { b: a//b, 2px; }`,
			line: 1,
			column: 12,
			message: messages.expectedAfter(),
		},
		{
			// See #739
			description: `a comma behind a bare address holding a quotation mark, which is a character of the address and opens no string`,
			code: `a { b: url(x'y),c; }`,
			fixed: `a { b: url(x'y), c; }`,
			line: 1,
			column: 16,
			message: messages.expectedAfter(),
		},
		{
			// See #739
			description: `a comma behind a string ending in an escaped backslash, whose closing quotation mark no escape holds`,
			code: `a { b: "a\\\\",c; }`,
			fixed: `a { b: "a\\\\", c; }`,
			line: 1,
			column: 13,
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
			// A write parting the name of a bare address from the comma or joining it to the comma switches how PostCSS reads its parentheses
			description: `the same address with whitespace between the name and the opening parenthesis, which leaves the name the word the tokenizer reads last`,
			code: `a { b: 1,url (a ")" b) 2px; }`,
			fixed: `a { b: 1,url (a ")" b) 2px; }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			// A write parting the name of a bare address from the comma or joining it to the comma switches how PostCSS reads its parentheses
			description: `a comma glued to the name of a bare address whose closing parenthesis stands in a comment holding a quotation mark`,
			code: `a { b: 1,url(a/*)"*/b) 2px; }`,
			fixed: `a { b: 1,url(a/*)"*/b) 2px; }`,
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
			description: `a space in front of the comma and none after it`,
			code: `a { background-size: 0 ,0; }`,
		},
		{
			description: `no space on either side of the comma`,
			code: `a { background-size: 0,0; }`,
		},
		{
			description: `commas inside a string, which are no commas of a value list`,
			code: `a::before { content: "foo, bar, baz"; }`,
		},
		{
			description: `commas inside the arguments of a function, which another rule measures`,
			code: `a { transform: translate(1, 1); }`,
		},
	],

	reject: [
		{
			description: `a space after the comma`,
			code: `a { background-size: 0, 0; }`,
			fixed: `a { background-size: 0,0; }`,
			line: 1,
			column: 23,
			message: messages.rejectedAfter(),
		},
		{
			description: `a comma opening the value, whose whitespace belongs to the value like any other`,
			code: `a { prop: , 0; }`,
			fixed: `a { prop: ,0; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
		{
			description: `two spaces after the comma`,
			code: `a { background-size: 0,  0; }`,
			fixed: `a { background-size: 0,0; }`,
			line: 1,
			column: 23,
			message: messages.rejectedAfter(),
		},
		{
			description: `a newline after the comma`,
			code: `a { background-size: 0,\n0; }`,
			fixed: `a { background-size: 0,0; }`,
			line: 1,
			column: 23,
			message: messages.rejectedAfter(),
		},
		{
			description: `a carriage-return line break after the comma`,
			code: `a { background-size: 0,\r\n0; }`,
			fixed: `a { background-size: 0,0; }`,
			line: 1,
			column: 23,
			message: messages.rejectedAfter(),
		},
		{
			description: `a tab after the comma`,
			code: `a { background-size: 0,\t0; }`,
			fixed: `a { background-size: 0,0; }`,
			line: 1,
			column: 23,
			message: messages.rejectedAfter(),
		},
		{
			description: `spaces around a comment standing after the comma`,
			code: `a { background-size: 0, /*1*/ 0; }`,
			fixed: `a { background-size: 0,/*1*/ 0; }`,
			line: 1,
			column: 23,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space after each of the three commas`,
			code: `a { background-size: 0, 0, 0, 0 ; }`,
			fixed: `a { background-size: 0,0,0,0 ; }`,
			warnings: [
				{
					line: 1,
					column: 23,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 26,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 29,
					message: messages.rejectedAfter(),
				},
			],
		},
		{
			description: `a space after the comma of a custom property`,
			code: `:root { --variable: 0, 0; }`,
			fixed: `:root { --variable: 0,0; }`,
			line: 1,
			column: 22,
			message: messages.rejectedAfter(),
		},
		{
			// A write parting the name of a bare address from the comma or joining it to the comma switches how PostCSS reads its parentheses
			description: `a run between a comma and the name of a bare address holding a quotation mark nothing closes, which taking the run away would make the tokenizer read as a string`,
			code: `a { b: 1, url(a"b) 2px; }`,
			fixed: `a { b: 1, url(a"b) 2px; }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfter(),
		},
		{
			// A quotation mark inside a bare address opens no string, so the one behind the address does
			description: `a space after a comma behind a bare address holding a quotation mark, and a comma inside the string the mark behind the address opens, which is no comma of the list`,
			code: `a { b: url(/* c */ a ") , b" ) 1px/2px, "; c: "d" }`,
			fixed: `a { b: url(/* c */ a ") ,b" ) 1px/2px, "; c: "d" }`,
			line: 1,
			column: 25,
			message: messages.rejectedAfter(),
		},
		{
			// A solidus glued to the name makes the tokenizer read the parentheses as code, and the quotation mark inside the comment opens no string
			description: `a space after a comma behind a bare address whose name a solidus is glued to, and a comment inside the parentheses holding a parenthesis and a quotation mark`,
			code: `a { b: x /url(a/* ) '*/) 1px, 3px; }`,
			fixed: `a { b: x /url(a/* ) '*/) 1px,3px; }`,
			line: 1,
			column: 29,
			message: messages.rejectedAfter(),
		},
		{
			// A dollar sign glued to the name leaves a call to the tokenizer and to the value parser alike, so the quotation mark inside the parentheses opens a string
			description: `a space after a comma behind a call whose name a dollar sign is glued to, and a string holding the opening delimiter of a comment and a parenthesis inside its parentheses`,
			code: `a { b: x $url(a"/*)"b) 1px, 3px; }`,
			fixed: `a { b: x $url(a"/*)"b) 1px,3px; }`,
			line: 1,
			column: 27,
			message: messages.rejectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			description: `a space on either side of the comma of a single-line list`,
			code: `a { background-size: 0 , 0; }`,
		},
		{
			description: `a space after the comma of a single-line list`,
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
			description: `a multi-line list, which this option does not measure`,
			code: `a { background-size: 0\n,0}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `a { background-size: 0\r\n,0}`,
		},
		{
			description: `commas inside a string, which are no commas of a value list`,
			code: `a::before { content: "foo,bar,baz"; }`,
		},
		{
			description: `commas inside the arguments of a function, which another rule measures`,
			code: `a { transform: translate(1,1); }`,
		},
	],

	reject: [
		{
			description: `a comma opening the value, which is the value's first character`,
			code: `a { prop: ,0; }`,
			fixed: `a { prop: , 0; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `no space after the comma of a single-line list`,
			code: `a { background-size: 0,0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 1,
			column: 23,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same list in a multi-line block`,
			code: `a { background-size: 0,0;\n}`,
			fixed: `a { background-size: 0, 0;\n}`,
			line: 1,
			column: 23,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a { background-size: 0,0;\r\n}`,
			fixed: `a { background-size: 0, 0;\r\n}`,
			line: 1,
			column: 23,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `two spaces after the comma of a single-line list`,
			code: `a { background-size: 0,  0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 1,
			column: 23,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a tab after the comma of a single-line list`,
			code: `a { background-size: 0,\t0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 1,
			column: 23,
			message: messages.expectedAfterSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `a space in front of the comma of a single-line list and none after it`,
			code: `a { background-size: 0 ,0; }`,
		},
		{
			description: `no space on either side of the comma of a single-line list`,
			code: `a { background-size: 0,0; }`,
		},
		{
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
			code: `a { background-size: 0,0;\n}`,
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a { background-size: 0,0;\r\n}`,
		},
		{
			description: `a multi-line list, which this option does not measure`,
			code: `a { background-size: 0\n,  0}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `a { background-size: 0\r\n,  0}`,
		},
		{
			description: `commas inside a string, which are no commas of a value list`,
			code: `a::before { content: "foo, bar, baz"; }`,
		},
		{
			description: `commas inside the arguments of a function, which another rule measures`,
			code: `a { transform: translate(1, 1); }`,
		},
	],

	reject: [
		{
			description: `a comma opening the value, whose whitespace belongs to the value like any other`,
			code: `a { prop: , 0; }`,
			fixed: `a { prop: ,0; }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `a space after the comma of a single-line list`,
			code: `a { background-size: 0, 0; }`,
			fixed: `a { background-size: 0,0; }`,
			line: 1,
			column: 23,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `the same list in a multi-line block`,
			code: `a { background-size: 0, 0;\n}`,
			fixed: `a { background-size: 0,0;\n}`,
			line: 1,
			column: 23,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a { background-size: 0, 0;\r\n}`,
			fixed: `a { background-size: 0,0;\r\n}`,
			line: 1,
			column: 23,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `two spaces after the comma of a single-line list`,
			code: `a { background-size: 0,  0; }`,
			fixed: `a { background-size: 0,0; }`,
			line: 1,
			column: 23,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `a tab after the comma of a single-line list`,
			code: `a { background-size: 0,\t0; }`,
			fixed: `a { background-size: 0,0; }`,
			line: 1,
			column: 23,
			message: messages.rejectedAfterSingleLine(),
		},
	],
})

// A vertical tab and a no-break space are words to PostCSS's tokenizer (#496): the fix rewrites only the run the tokenizer reads beside its anchor, so such a character stays where it used to be carried off with the run.
testRule({
	ruleName,
	config: [`always`],

	reject: [
		{
			// See #496
			description: `a vertical tab behind the comma, a word to the tokenizer: the space is written beside the character, which stays`,
			code: `a { b: x,\vy; }`,
			fixed: `a { b: x, \vy; }`,
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 10,
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
			description: `a no-break space behind the run after the comma: only the tokenizer's run goes, and the character stays`,
			code: `a { b: x, \u00A0y; }`,
			fixed: `a { b: x,\u00A0y; }`,
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 10,
			message: messages.rejectedAfter(),
		},
	],
})

// The break twin writes the run behind the comma too, and the library lists it behind this rule, so its write would be the file's last (#704)
testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/value-list-comma-newline-after": `always` },

	reject: [
		{
			// See #704
			description: `a break behind the comma, which the twin behind this rule accepts and would put back, so the warning stands and nothing is written`,
			code: `a { b: c,\nd }`,
			fixed: `a { b: c,\nd }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces in front of a comment behind the comma, past which the twin reads, so the two contend for nothing and the space is written`,
			code: `a { b: c,  /* e */\nd }`,
			fixed: `a { b: c, /* e */\nd }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
	],
})

// A space written in front of a comment behind the comma moves the break twin's reading behind the comment, so the twin behind this rule contends for nothing (#704)
testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/value-list-comma-newline-after": `always` },

	reject: [
		{
			description: `a break in front of a comment behind the comma, which the space puts on the comma's line, where the twin behind this rule reads past the comment`,
			code: `a { b: c,\n/* d */\ne }`,
			fixed: `a { b: c, /* d */\ne }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
	],
})
