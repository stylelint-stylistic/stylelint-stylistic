import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [true],

	accept: [
		{
			// The run is read over the copy with the escapes masked, so the character a backslash covers is none of it (1789855320)
			description: `an escaped tab and a space behind it, where the tab is a character of the word and the space the only whitespace`,
			code: `a { b: c\\\t ; d: e }`,
		},
		{
			// The first whitespace character behind a hexadecimal escape closes it and is none of the run (1789855320)
			description: `a hexadecimal escape closed by the first of two spaces, the second of which parts the words`,
			code: `a { b: c\\2c  d }`,
		},
		{
			// An escape of four digits closes on the space just as one of two does, which a mask reading a fixed length would miss (1789855320)
			description: `a four-digit hexadecimal escape closed by the first of two spaces`,
			code: `a { b: c\\1f60  d; e: f }`,
		},
		{
			// The escapes of a bare address are masked as the rest of a value's are, so what a backslash covers there is no run either (1789879423)
			description: `an escaped space inside a bare address, and one space behind it`,
			code: `a { b: url(c\\  d) }`,
		},
		{
			// 1789879423
			description: `a hexadecimal escape inside a bare address, closed by the first of two spaces`,
			code: `a { b: url(c\\2c  d) }`,
		},
		{
			description: `double spaces inside comments, which the rule does not read`,
			code: `/* This  is  comment */\na { gap: 0 /* And   another   comment */ }`,
		},
		{
			description: `spaces inside a string`,
			code: `a::before { content: "   " }`,
		},
		{
			description: `spaces inside the strings of a named grid area`,
			code: `a { grid-template-areas: "a  b" "c  d" }`,
		},
		{
			description: `a single space between the parts of a value`,
			code: `a { gap: 1em 2em }`,
		},
		{
			description: `single spaces around a slash`,
			code: `a { aspect-ratio: 1 / 2 }`,
		},
		{
			description: `a slash with no spaces around it`,
			code: `a { aspect-ratio: 1/2 }`,
		},
		{
			description: `single spaces between the arguments of a function`,
			code: `a { color: rgb(0 0 0) }`,
		},
		{
			description: `a slash with no spaces around it inside a function`,
			code: `a { color: rgb(0 0 0/0) }`,
		},
		{
			description: `single spaces around a slash inside a function`,
			code: `a { color: rgb(0 0 0 / 0) }`,
		},
		{
			description: `a comma with no space after it inside a function`,
			code: `a { transform: translate(50%,50%) }`,
		},
		{
			description: `a single space after a comma inside a function`,
			code: `a { transform: translate(50%, 50%) }`,
		},
		{
			description: `indentation on the line after the opening brace`,
			code: `a {\n  color: pink }`,
		},
		{
			description: `indentation on the line after a declaration`,
			code: `a { color: red;\n  top: 0 }`,
		},
		{
			description: `indentation inside a value broken over three lines`,
			code: `
				a {
				  background-position:
				    top left,
				    top right;
				}
			`,
		},
	],

	reject: [
		{
			// Pins the escaped tab kept and the run behind it collapsed, where the write used to take the tab as well (1789855320)
			description: `two spaces behind an escaped tab`,
			code: `a { b: c\\\t  d; e: f }`,
			fixed: `a { b: c\\\t d; e: f }`,
			line: 1,
			column: 11,
			message: messages.rejected,
		},
		{
			// Pins the character closing a hexadecimal escape kept out of the run (1789855320)
			description: `a hexadecimal escape closed by the first of three spaces`,
			code: `a { b: c\\2c   d }`,
			fixed: `a { b: c\\2c  d }`,
			line: 1,
			column: 13,
			message: messages.rejected,
		},
		{
			// An escaped apostrophe opens no string, and the rest of the value was passed over behind one (1789855320)
			description: `two spaces further along a value holding an escaped apostrophe, which opens no string`,
			code: `a { b: c\\'d  e; f: g }`,
			fixed: `a { b: c\\'d e; f: g }`,
			line: 1,
			column: 12,
			message: messages.rejected,
		},
		{
			// Pins a four-digit escape read to its end, where a mask of a fixed length would take the closing space for a run (1789855320)
			description: `three spaces behind a four-digit hexadecimal escape`,
			code: `a { b: c\\1f60   d; e: f }`,
			fixed: `a { b: c\\1f60  d; e: f }`,
			line: 1,
			column: 15,
			message: messages.rejected,
		},
		{
			// Pins a form feed closing a hexadecimal escape, which the write used to carry off with the run (1789855320)
			description: `two spaces behind a hexadecimal escape closed by a form feed`,
			code: `a { b: c\\2c\f  d; e: f }`,
			fixed: `a { b: c\\2c\f d; e: f }`,
			line: 1,
			column: 13,
			message: messages.rejected,
		},
		{
			// Pins the write the mask lets through: an even run of backslashes spells an escaped backslash, and the whitespace behind it is a run of its own (1789855320)
			description: `two spaces behind an escaped backslash`,
			code: `a { b: c\\\\  d; e: f }`,
			fixed: `a { b: c\\\\ d; e: f }`,
			line: 1,
			column: 11,
			message: messages.rejected,
		},
		{
			// Pins the escaped tab kept where the run stands inside a bare address, whose escapes the walk used to hand over none of (1789879423)
			description: `two spaces behind an escaped tab inside a bare address`,
			code: `a { b: url(c\\\t  d) }`,
			fixed: `a { b: url(c\\\t d) }`,
			line: 1,
			column: 15,
			message: messages.rejected,
		},
		{
			// The parentheses hold a line break, so they are no address span, and the escape is recorded all the same (1789879423)
			description: `the same run inside parentheses a line break keeps from being an address`,
			code: `a { b: url(c\\\t  \n d) }`,
			fixed: `a { b: url(c\\\t \n d) }`,
			line: 1,
			column: 15,
			message: messages.rejected,
		},
		{
			// Pins the write a bare address keeps: nothing covers this run, and the mask leaves it where it was (1789879423)
			description: `two spaces between the words of a bare address`,
			code: `a { b: url(c  d) }`,
			fixed: `a { b: url(c d) }`,
			line: 1,
			column: 13,
			message: messages.rejected,
		},
		{
			// The carriage return closing the escape is a character of it rather than a break of the value, so the run behind it is one the rule used to read as indentation (1789879423)
			description: `two spaces behind a hexadecimal escape a carriage return closes inside a bare address`,
			code: `a { b: url(c\\2c\r  d) }`,
			fixed: `a { b: url(c\\2c\r d) }`,
			line: 1,
			column: 17,
			message: messages.rejected,
		},
		{
			description: `two spaces between the parts of a value`,
			code: `a { gap: 1em  2em }`,
			fixed: `a { gap: 1em 2em }`,
			line: 1,
			column: 13,
			message: messages.rejected,
		},
		{
			description: `two spaces between two strings`,
			code: `a { grid-template-areas: "a  b"  "c  d" }`,
			fixed: `a { grid-template-areas: "a  b" "c  d" }`,
			line: 1,
			column: 32,
			message: messages.rejected,
		},
		{
			description: `two spaces in front of a slash`,
			code: `a { aspect-ratio: 1  / 2 }`,
			fixed: `a { aspect-ratio: 1 / 2 }`,
			line: 1,
			column: 20,
			message: messages.rejected,
		},
		{
			description: `two spaces behind a slash`,
			code: `a { aspect-ratio: 1 /  2 }`,
			fixed: `a { aspect-ratio: 1 / 2 }`,
			line: 1,
			column: 22,
			message: messages.rejected,
		},
		{
			description: `two spaces after the first argument of a function`,
			code: `a { color: rgb(0  0 0) }`,
			fixed: `a { color: rgb(0 0 0) }`,
			line: 1,
			column: 17,
			message: messages.rejected,
		},
		{
			description: `two spaces after the second argument of a function`,
			code: `a { color: rgb(0 0  0) }`,
			fixed: `a { color: rgb(0 0 0) }`,
			line: 1,
			column: 19,
			message: messages.rejected,
		},
		{
			description: `two spaces in front of a slash inside a function`,
			code: `a { color: rgb(0 0 0  / 0) }`,
			fixed: `a { color: rgb(0 0 0 / 0) }`,
			line: 1,
			column: 21,
			message: messages.rejected,
		},
		{
			description: `two spaces behind a slash inside a function`,
			code: `a { color: rgb(0 0 0 /  0) }`,
			fixed: `a { color: rgb(0 0 0 / 0) }`,
			line: 1,
			column: 23,
			message: messages.rejected,
		},
		{
			description: `two spaces after a comma inside a function`,
			code: `a { transform: translate(50%,  50%) }`,
			fixed: `a { transform: translate(50%, 50%) }`,
			line: 1,
			column: 30,
			message: messages.rejected,
		},
		{
			description: `two spaces on the second line of a value`,
			code: `
				a {
				  background-position:
				    top  left,
				    top right;
				}
			`,
			fixed: `
				a {
				  background-position:
				    top left,
				    top right;
				}
			`,
			line: 3,
			column: 8,
			message: messages.rejected,
		},
		{
			description: `two spaces on the third line of a value`,
			code: `
				a {
				  background-position:
				    top left,
				    top  right;
				}
			`,
			fixed: `
				a {
				  background-position:
				    top left,
				    top right;
				}
			`,
			line: 4,
			column: 8,
			message: messages.rejected,
		},
		{
			description: `two spaces on both lines of a value`,
			code: `
				a {
				  background-position:
				    top  left,
				    top  right;
				}
			`,
			fixed: `
				a {
				  background-position:
				    top left,
				    top right;
				}
			`,
			message: messages.rejected,
			warnings: [
				{
					line: 3,
					column: 8,
					message: messages.rejected,
				},
				{
					line: 4,
					column: 8,
					message: messages.rejected,
				},
			],
		},
	],
})
