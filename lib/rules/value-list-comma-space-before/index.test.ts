import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			// The comma closes the escape as well as its space does, so the space is a run a rule may write or take away
			description: `a hexadecimal escape spelling a comma, whose closing space is the run in front of the comma of the list`,
			code: `a { b: 1 ,a\\2c ,b; }`,
		},
		{
			// An escape is a character of its word, and the search the commas are found with reads none
			description: `an escaped comma inside a word, which is no comma of the list`,
			code: `a { b: 1 ,a\\,b; }`,
		},
		{
			description: `a space on either side of the comma`,
			code: `a { background-size: 0 , 0; }`,
		},
		{
			description: `a space in front of the comma`,
			code: `a { background-size: 0 ,0; }`,
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
			description: `a bare address in front of the comma, whose double slash opens no comment`,
			code: `a { background: url(http://x/y.png) ,url(http://x/z.png); }`,
		},
	],

	reject: [
		{
			// Pins the refusal of a write behind a backslash delimiter
			description: `a backslash ending the word in front of a line break and the comma, where the space would stand behind the backslash as its escaped character, so the warning stands`,
			code: `a { b: 1 ,a\\\n,b; }`,
			fixed: `a { b: 1 ,a\\\n,b; }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			// The run in front of the delimiter is read over the copy with its escapes masked
			description: `an escaped space in front of the comma, which is a character of the word and no space`,
			code: `a { b: 1 ,a\\ ,b; }`,
			fixed: `a { b: 1 ,a\\  ,b; }`,
			line: 1,
			column: 14,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of a comma behind an escaped backslash, which is a comma of the list`,
			code: `a { b: a\\\\,b; }`,
			fixed: `a { b: a\\\\ ,b; }`,
			line: 1,
			column: 11,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of the comma`,
			code: `a { background-size: 0, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			line: 1,
			column: 23,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces in front of the comma`,
			code: `a { background-size: 0  , 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			line: 1,
			column: 25,
			message: messages.expectedBefore(),
		},
		{
			description: `a newline in front of the comma`,
			code: `a { background-size: 0\n, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `a carriage-return line break in front of the comma`,
			code: `a { background-size: 0\r\n, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab in front of the comma`,
			code: `a { background-size: 0\t, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			line: 1,
			column: 24,
			message: messages.expectedBefore(),
		},
		{
			description: `a comment standing right in front of the comma`,
			code: `a { background-size: 0/*comment*/, 0; }`,
			fixed: `a { background-size: 0/*comment*/ , 0; }`,
			line: 1,
			column: 34,
			message: messages.expectedBefore(),
		},
		{
			description: `a comma opening the value, the whitespace in front of it standing between the colon and the value`,
			code: `a { prop:,0; }`,
			fixed: `a { prop: ,0; }`,
			line: 1,
			column: 10,
			message: messages.expectedBefore(),
		},
		{
			description: `the same, in a custom property`,
			code: `a { --a:,0; }`,
			fixed: `a { --a: ,0; }`,
			line: 1,
			column: 9,
			message: messages.expectedBefore(),
		},
		{
			description: `a comma opening the value and another standing in it, each written where its own whitespace stands`,
			code: `a { prop:,0,0; }`,
			fixed: `a { prop: ,0 ,0; }`,
			warnings: [
				{
					line: 1,
					column: 10,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 12,
					message: messages.expectedBefore(),
				},
			],
		},
		{
			description: `the same, with a comment standing between the colon and the value`,
			code: `a { prop:/*c*/,0; }`,
			fixed: `a { prop:/*c*/ ,0; }`,
			line: 1,
			column: 15,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of any of the seven commas`,
			code: `a{b: 0,0,0,0,0,0,0,0; }`,
			fixed: `a{b: 0 ,0 ,0 ,0 ,0 ,0 ,0 ,0; }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 9,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 11,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 13,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 15,
					message: messages.expectedBefore(),
				},
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
			description: `a comma inside the property name, which the fixer has to leave standing`,
			code: `a { pr,op: 0,0; }`,
			fixed: `a { pr,op: 0 ,0; }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 13,
					message: messages.expectedBefore(),
				},
			],
		},
		{
			description: `a comma behind a bare address, whose double slash opens no comment`,
			code: `a { background: url(http://x/y.png),url(http://x/z.png); }`,
			fixed: `a { background: url(http://x/y.png) ,url(http://x/z.png); }`,
			line: 1,
			column: 36,
			message: messages.expectedBefore(),
		},
		{
			description: `two block comments standing side by side, whose delimiters spell a double slash between them and open no comment`,
			code: `a { b: 1px/*x*//*y*/,2px; }`,
			fixed: `a { b: 1px/*x*//*y*/ ,2px; }`,
			line: 1,
			column: 21,
			message: messages.expectedBefore(),
		},
		{
			description: `a bare address inside a call the plugin knows nothing of: plain CSS spells no comment with a double slash`,
			code: `a { b: myurl(//a),2px; }`,
			fixed: `a { b: myurl(//a) ,2px; }`,
			line: 1,
			column: 18,
			message: messages.expectedBefore(),
		},
		{
			description: `a double slash inside an address whose second slash opens no comment of its own`,
			code: `a { b: url(a//*b*/),2px; }`,
			fixed: `a { b: url(a//*b*/) ,2px; }`,
			line: 1,
			column: 20,
			message: messages.expectedBefore(),
		},
		{
			// A quotation mark inside a bare address opens no string, so the one behind the address does
			description: `no space in front of a comma behind a bare address holding a quotation mark, and a comma inside the string the mark behind the address opens, which is no comma of the list`,
			code: `a { b: url(/* c */ a "),b" ) 1px/2px, "; c: "d" }`,
			fixed: `a { b: url(/* c */ a ") ,b" ) 1px/2px, "; c: "d" }`,
			line: 1,
			column: 24,
			message: messages.expectedBefore(),
		},
		{
			// Pins the reading of a string inside parentheses the tokenizer reads as code behind a solidus glued to the name, whose comma is no comma of the list
			description: `no space in front of the comma behind a bare address whose name a solidus is glued to, holding a string with a closing parenthesis and a comma, which are text of the string`,
			code: `a { b: 1px , 1/url(a "),b" ),2px; }`,
			fixed: `a { b: 1px , 1/url(a "),b" ) ,2px; }`,
			line: 1,
			column: 29,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			// The run in front of the delimiter is read over the copy with its escapes masked
			description: `an escaped space in front of the comma, which is a character of the word and no whitespace`,
			code: `a { b: 1,a\\ ,b; }`,
		},
		{
			description: `no space in front of the comma`,
			code: `a { background-size: 0, 0; }`,
		},
		{
			description: `no space on either side of the comma`,
			code: `a { background-size: 0,0; }`,
		},
		{
			description: `commas inside a string, which are no commas of a value list`,
			code: `a::before { content: "foo ,bar ,baz"; }`,
		},
		{
			description: `commas inside the arguments of a function, which another rule measures`,
			code: `a { transform: translate(1 ,1); }`,
		},
	],

	reject: [
		{
			// Pins the refusal of a write behind a backslash delimiter
			description: `a backslash ending the word in front of a line break and the comma, which the write would turn into an escaped comma, so the warning stands`,
			code: `a { b: 1,a\\\n,b; }`,
			fixed: `a { b: 1,a\\\n,b; }`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `a line break in front of the comma behind an escaped backslash, which is a run`,
			code: `a { b: 1,a\\\\\n,b; }`,
			fixed: `a { b: 1,a\\\\,b; }`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			// The comma closes the escape as well as its space does, so the space is a run a rule may take away
			description: `a space closing a hexadecimal escape in front of the comma, which is a run since the comma closes the escape as well`,
			code: `a { b: 1,a\\2c ,b; }`,
			fixed: `a { b: 1,a\\2c,b; }`,
			line: 1,
			column: 15,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space in front of the comma`,
			code: `a { background-size: 0 , 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 1,
			column: 24,
			message: messages.rejectedBefore(),
		},
		{
			description: `two spaces in front of the comma`,
			code: `a { background-size: 0  , 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 1,
			column: 25,
			message: messages.rejectedBefore(),
		},
		{
			description: `a newline in front of the comma`,
			code: `a { background-size: 0\n, 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `a carriage-return line break in front of the comma`,
			code: `a { background-size: 0\r\n, 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `a tab in front of the comma`,
			code: `a { background-size: 0\t, 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 1,
			column: 24,
			message: messages.rejectedBefore(),
		},
		{
			description: `spaces around a comment standing in front of the comma`,
			code: `a { background-size: 0 /*comment*/ , 0; }`,
			fixed: `a { background-size: 0 /*comment*/, 0; }`,
			line: 1,
			column: 36,
			message: messages.rejectedBefore(),
		},
		{
			description: `a comma opening the value, the whitespace in front of it standing between the colon and the value`,
			code: `a { prop: ,0; }`,
			fixed: `a { prop:,0; }`,
			line: 1,
			column: 11,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same, with more whitespace than a single space`,
			code: `a { prop:  ,0; }`,
			fixed: `a { prop:,0; }`,
			line: 1,
			column: 12,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same, in a custom property`,
			code: `a { --a: ,0; }`,
			fixed: `a { --a:,0; }`,
			line: 1,
			column: 10,
			message: messages.rejectedBefore(),
		},
		{
			description: `a comma opening the value and another standing in it, each written where its own whitespace stands`,
			code: `a { prop: , 0 , 0; }`,
			fixed: `a { prop:, 0, 0; }`,
			warnings: [
				{
					line: 1,
					column: 11,
					message: messages.rejectedBefore(),
				},
				{
					line: 1,
					column: 15,
					message: messages.rejectedBefore(),
				},
			],
		},
		{
			description: `the same, with a comment standing between the colon and the value`,
			code: `a { prop: /*c*/ ,0; }`,
			fixed: `a { prop: /*c*/,0; }`,
			line: 1,
			column: 17,
			message: messages.rejectedBefore(),
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
			description: `a space in front of the comma of a single-line list`,
			code: `a { background-size: 0 ,0; }`,
		},
		{
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
			code: `a { background-size: 0 ,0;\n}`,
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a { background-size: 0 ,0;\r\n}`,
		},
		{
			description: `a multi-line list, which this option does not measure`,
			code: `a { background-size: 0,\n0; }`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `a { background-size: 0,\r\n0; }`,
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
			description: `the message spelled out, since asking the rule for its own text would miss one that says the opposite of what the option asks`,
			code: `a { background-size: 0, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			line: 1,
			column: 23,
			message: `Expected single space before "," in a single-line list (${ruleName})`,
		},
		{
			description: `no space in front of the comma of a single-line list, inside a multi-line block`,
			code: `a { background-size: 0, 0;\n}`,
			fixed: `a { background-size: 0 , 0;\n}`,
			line: 1,
			column: 23,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a { background-size: 0, 0;\r\n}`,
			fixed: `a { background-size: 0 , 0;\r\n}`,
			line: 1,
			column: 23,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `two spaces in front of the comma of a single-line list`,
			code: `a { background-size: 0  , 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			line: 1,
			column: 25,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `a tab in front of the comma of a single-line list`,
			code: `a { background-size: 0\t, 0; }`,
			fixed: `a { background-size: 0 , 0; }`,
			line: 1,
			column: 24,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `a comma opening the value, the whitespace in front of it standing between the colon and the value`,
			code: `a { prop:,0;\n}`,
			fixed: `a { prop: ,0;\n}`,
			line: 1,
			column: 10,
			message: messages.expectedBeforeSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `no space in front of the comma of a single-line list`,
			code: `a { background-size: 0, 0; }`,
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
			code: `a { background-size: 0 ,\n0; }`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `a { background-size: 0 ,\r\n0; }`,
		},
		{
			description: `commas inside a string, which are no commas of a value list`,
			code: `a::before { content: "foo ,bar ,baz"; }`,
		},
		{
			description: `commas inside the arguments of a function, which another rule measures`,
			code: `a { transform: translate(1 ,1); }`,
		},
	],

	reject: [
		{
			description: `a space in front of the comma of a single-line list`,
			code: `a { background-size: 0 , 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 1,
			column: 24,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same list in a multi-line block`,
			code: `a { background-size: 0 , 0;\n}`,
			fixed: `a { background-size: 0, 0;\n}`,
			line: 1,
			column: 24,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a { background-size: 0 , 0;\r\n}`,
			fixed: `a { background-size: 0, 0;\r\n}`,
			line: 1,
			column: 24,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `two spaces in front of the comma of a single-line list`,
			code: `a { background-size: 0  , 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 1,
			column: 25,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `a tab in front of the comma of a single-line list`,
			code: `a { background-size: 0\t, 0; }`,
			fixed: `a { background-size: 0, 0; }`,
			line: 1,
			column: 24,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `a comma opening the value, the whitespace in front of it standing between the colon and the value`,
			code: `a { prop: ,0;\n}`,
			fixed: `a { prop:,0;\n}`,
			line: 1,
			column: 11,
			message: messages.rejectedBeforeSingleLine(),
		},
	],
})

// A vertical tab and a no-break space are words to PostCSS's tokenizer: the fix rewrites only the run the tokenizer reads beside its anchor, and such a character stays where the fix used to carry it off.
testRule({
	ruleName,
	config: [`always`],

	reject: [
		{
			description: `a vertical tab in front of the comma, a word to the tokenizer: the space is written beside the character, which stays`,
			code: `a { b: x\v, y; }`,
			fixed: `a { b: x\v , y; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	reject: [
		{
			description: `a vertical tab at the run before the comma: only the tokenizer's run goes, and the character stays`,
			code: `a { b: x\v , y; }`,
			fixed: `a { b: x\v, y; }`,
			line: 1,
			column: 11,
			endLine: 1,
			endColumn: 12,
			message: messages.rejectedBefore(),
		},
	],
})

// The run in front of a comma opening the value is the head run behind the colon, which the colon rules read too: the rules asked settle who writes it, and a rule held by its neighbor reports and leaves the run
testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/declaration-colon-space-after": `never` },

	reject: [
		{
			description: `a comma opening the value with nothing in front of it, where the colon rule behind this one forbids the space this one asks for, so the warning stands and nothing is written`,
			code: `a { b:,c }`,
			fixed: `a { b:,c }`,
			line: 1,
			column: 7,
			message: messages.expectedBefore(),
		},
	],
})

// Behind a block comment on the colon's line the run in front of a comma opening the value is the one `declaration-colon-newline-after` reads past the comment: the rules asked settle who writes it
testRule({
	ruleName,
	config: [`never`],
	extraRules: { "@stylistic/declaration-colon-newline-after": `always` },

	reject: [
		{
			description: `a break with indentation between a comment on the colon's line and a comma opening the value, where the colon rule behind this one asks for that break, so the warning stands and nothing is written`,
			code: `a { b: /*c*/\n ,d }`,
			fixed: `a { b: /*c*/\n ,d }`,
			line: 2,
			column: 2,
			message: messages.rejectedBefore(),
		},
	],
})
