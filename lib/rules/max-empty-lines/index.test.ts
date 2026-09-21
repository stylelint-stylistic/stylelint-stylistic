import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName, autoStripIndent: false })

testRule({
	ruleName,
	config: [0],

	accept: [
		{
			description: `a rule closed by a newline, with no blank line anywhere`,
			code: `a {}\n`,
		},
		{
			description: `a rule closed by a newline with spaces behind it, which this option counts no line for either`,
			code: `a {}\n   `,
		},
		{
			// Pins the reading of a string inside parentheses the tokenizer reads as code behind a solidus glued to the name, whose empty lines are text of the string (1789637913)
			description: `empty lines inside a string standing in the parentheses of a bare address whose name a solidus is glued to, which are no empty lines of the stylesheet`,
			code: `a {\n\tb: 1/url(a "),\n\n\n\nb" ), 2px;\n}\n`,
		},
	],
	reject: [
		{
			description: `a blank line opening the stylesheet`,
			code: `\na {}`,
			fixed: `a {}`,
			line: 1,
			column: 1,
			message: messages.expected(0),
		},
		{
			description: `a blank line closing the stylesheet with a run of spaces behind it, which this option reported without counting the end of the file at all`,
			code: `a {}\n\n   `,
			fixed: `a {}\n   `,
			line: 2,
			column: 1,
			message: messages.expected(0),
		},
		// See #481
		{
			description: `a blank line in front of the closing brace of a rule`,
			code: `a {\n\tb: c;\n\n}\n`,
			fixed: `a {\n\tb: c;\n}\n`,
			line: 3,
			column: 1,
			message: messages.expected(0),
		},
		// See #404
		{
			description: `a stylesheet holding a line break and a run of spaces, whose one empty line is the line it opens on and whose run ends a line of its own and is left where it stood`,
			code: `\n   `,
			fixed: `   `,
			line: 1,
			column: 1,
			message: messages.expected(0),
		},
		{
			description: `the same stylesheet written with a carriage-return line break`,
			code: `\r\n   `,
			fixed: `   `,
			line: 1,
			column: 1,
			message: messages.expected(0),
		},
		{
			description: `a stylesheet holding two line breaks and a run of spaces, which are two empty lines and are both taken away`,
			code: `\n\n   `,
			fixed: `   `,
			warnings: [
				{
					line: 1,
					column: 1,
					message: messages.expected(0),
				},
				{
					line: 2,
					column: 1,
					message: messages.expected(0),
				},
			],
		},
		{
			description: `a stylesheet holding a line break, a run of spaces and a line break, whose last break closes a line of its own and is let stand as the end of any file is`,
			code: `\n   \n`,
			fixed: `   \n`,
			line: 1,
			column: 1,
			message: messages.expected(0),
		},
		{
			description: `a stylesheet holding a line break and a free semicolon, which is no node of the stylesheet and is left where it stood`,
			code: `\n;`,
			fixed: `;`,
			line: 1,
			column: 1,
			message: messages.expected(0),
		},
		{
			// See #598
			description: `a blank line opening the stylesheet in front of a free semicolon, which stands in the raw of the first rule and is left where it stood`,
			code: `\n;a {}`,
			fixed: `;a {}`,
			line: 1,
			column: 1,
			message: messages.expected(0),
		},
		{
			// See #598
			description: `a blank line behind a free semicolon opening the stylesheet, whose run is not the file's first and keeps one break as any run does`,
			code: `;\n\na {}`,
			fixed: `;\na {}`,
			line: 2,
			column: 1,
			message: messages.expected(0),
		},
		{
			// See #598
			description: `a blank line opening the stylesheet in front of the indentation of the first rule, which stands in the same raw and is left where it stood`,
			code: `\n\ta {}`,
			fixed: `\ta {}`,
			line: 1,
			column: 1,
			message: messages.expected(0),
		},
		// See #601
		{
			description: `two blank lines opening a stylesheet behind a byte-order mark, which is no character of the text the positions are counted in`,
			code: `\uFEFF\n\na {}`,
			fixed: `\uFEFFa {}`,
			warnings: [
				{
					line: 1,
					column: 1,
					message: messages.expected(0),
				},
				{
					line: 2,
					column: 1,
					message: messages.expected(0),
				},
			],
		},
		{
			// See #538
			description: `a blank line in front of the closing brace of a rule a custom property with no semicolon closes, which the parser keeps in that property's value rather than in the block`,
			code: `a {\n\t--b: red\n\n}\n`,
			fixed: `a {\n\t--b: red\n}\n`,
			line: 3,
			column: 1,
			message: messages.expected(0),
		},
	],
})

testRule({
	ruleName,
	config: [1],

	accept: [
		{
			description: `a blank line opening the stylesheet`,
			code: `\na {}`,
		},
		{
			description: `the same blank line written with a carriage-return line break`,
			code: `\r\na {}`,
		},
		{
			description: `a rule closed by a newline`,
			code: `a {}\n`,
		},
		{
			description: `the same rule closed by a carriage-return line break`,
			code: `a {}\r\n`,
		},
		{
			description: `a rule closed by a newline with spaces behind it, which end a line of their own and no empty one`,
			code: `a {}\n   `,
		},
		{
			description: `two rules with a single line break between them`,
			code: `a {}\nb {}`,
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a {}\r\nb {}`,
		},
		{
			description: `a blank line between two rules`,
			code: `a {}\n\nb {}`,
		},
		{
			description: `the same blank line written with carriage-return line breaks`,
			code: `a {}\r\n\r\nb {}`,
		},
		{
			description: `a blank line between a comment and a rule`,
			code: `/** horse */\n\nb {}`,
		},
		{
			description: `the same blank line written with carriage-return line breaks`,
			code: `/** horse */\r\n\r\nb {}`,
		},
		{
			description: `blank lines on either side of a comment standing between two rules`,
			code: `a {}\n\n/** horse */\n\nb {}`,
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n/** horse */\r\n\r\nb {}`,
		},
		// See #404
		{
			description: `a stylesheet holding nothing but a line break, which is one empty line and not one for its beginning and one for its end`,
			code: `\n`,
		},
		{
			description: `the same stylesheet written with a carriage-return line break`,
			code: `\r\n`,
		},
		{
			description: `the same stylesheet with a run of spaces written behind the break, which ends a line of its own and hides nothing`,
			code: `\n   `,
		},
		// See #586
		{
			description: `a blank line between two rules whose two breaks are spelled differently, which is still one blank line`,
			code: `a {}\r\n\nb {}`,
		},
		{
			description: `blank lines inside a string written behind a protocol-relative address on its line, which belong to the string as they do behind no address`,
			code: `a { b: url(//x.y/z) "c\\\n\n\nd" }`,
		},
	],

	reject: [
		{
			description: `two blank lines opening the stylesheet`,
			code: `\n\na {}`,
			fixed: `\na {}`,
			line: 2,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `\r\n\r\na {}`,
			fixed: `\r\na {}`,
			line: 2,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines closing the stylesheet`,
			code: `a {}\n\n`,
			fixed: `a {}\n`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n`,
			fixed: `a {}\r\n`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same two blank lines with a run of spaces written behind them, which ends a line of its own and hides neither of the two`,
			code: `a {}\n\n   `,
			fixed: `a {}\n   `,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same run of spaces behind carriage-return line breaks`,
			code: `a {}\r\n\r\n   `,
			fixed: `a {}\r\n   `,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same run written as a single tab`,
			code: `a {}\n\n\t`,
			fixed: `a {}\n\t`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines between two rules`,
			code: `a {}\n\n\nb {}`,
			fixed: `a {}\n\nb {}`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n\r\nb {}`,
			fixed: `a {}\r\n\r\nb {}`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines behind a comment`,
			code: `a {}\n\n/** horse */\n\n\nb {}`,
			fixed: `a {}\n\n/** horse */\n\nb {}`,
			line: 5,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines in front of a comment`,
			code: `a {}\n\n\n/** horse */\n\nb {}`,
			fixed: `a {}\n\n/** horse */\n\nb {}`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n/** horse */\r\n\r\n\r\nb {}`,
			fixed: `a {}\r\n\r\n/** horse */\r\n\r\nb {}`,
			line: 5,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines inside a comment`,
			code: `/* horse\n\n\n */\na {}`,
			fixed: `/* horse\n\n */\na {}`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `/* horse\r\n\r\n\r\n */\r\na {}`,
			fixed: `/* horse\r\n\r\n */\r\na {}`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		// See #481
		{
			description: `two blank lines in front of the closing brace of a rule`,
			code: `a {\n\tb: c;\n\n\n}\n`,
			fixed: `a {\n\tb: c;\n\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {\r\n\tb: c;\r\n\r\n\r\n}\r\n`,
			fixed: `a {\r\n\tb: c;\r\n\r\n}\r\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines inside an empty block`,
			code: `a {\n\n\n}\n`,
			fixed: `a {\n\n}\n`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines in front of the closing brace of an at-rule`,
			code: `@media (x) {\n\ta {}\n\n\n}\n`,
			fixed: `@media (x) {\n\ta {}\n\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines in front of the closing brace of a rule nested in an at-rule`,
			code: `@media (x) {\n\ta {\n\t\tb: c;\n\n\n\t}\n}\n`,
			fixed: `@media (x) {\n\ta {\n\t\tb: c;\n\n\t}\n}\n`,
			line: 5,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines in front of a stray semicolon standing in front of the closing brace, which is no node of the block and stands in the same raw as the blank lines`,
			code: `a {\n\tb: c;\n\n\n;\n}\n`,
			fixed: `a {\n\tb: c;\n\n;\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		// See #581
		{
			description: `two blank lines between a selector and its opening brace`,
			code: `a\n\n\n{}\n`,
			fixed: `a\n\n{}\n`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a\r\n\r\n\r\n{}\r\n`,
			fixed: `a\r\n\r\n{}\r\n`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines between the colon of a declaration and its value`,
			code: `a {\n\tb:\n\n\nc;\n}\n`,
			fixed: `a {\n\tb:\n\nc;\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines between a property and the colon of its declaration`,
			code: `a {\n\tb\n\n\n: c;\n}\n`,
			fixed: `a {\n\tb\n\n: c;\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines between the value of a declaration and the semicolon closing it, which the parser keeps in the value`,
			code: `a {\n\tb: c\n\n\n;\n}\n`,
			fixed: `a {\n\tb: c\n\n;\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same blank lines behind the value of a custom property`,
			code: `a {\n\t--b: c\n\n\n;\n}\n`,
			fixed: `a {\n\t--b: c\n\n;\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines between a flag and the semicolon closing the declaration, which the parser keeps behind the flag`,
			code: `a {\n\tb: c !important\n\n\n;\n}\n`,
			fixed: `a {\n\tb: c !important\n\n;\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines between a value and the flag behind it, which the parser keeps in the same raw as the flag`,
			code: `a {\n\tb: c\n\n\n!important;\n}\n`,
			fixed: `a {\n\tb: c\n\n!important;\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines inside a flag, between its bang and its word`,
			code: `a {\n\tb: c !\n\n\nimportant;\n}\n`,
			fixed: `a {\n\tb: c !\n\nimportant;\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines between the name of an at-rule and its parameters`,
			code: `@media\n\n\n(x) {}\n`,
			fixed: `@media\n\n(x) {}\n`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines between the parameters of an at-rule and its opening brace`,
			code: `@media (x)\n\n\n{}\n`,
			fixed: `@media (x)\n\n{}\n`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines between the parameters of an at-rule and the semicolon closing it`,
			code: `@import "x"\n\n\n;\n`,
			fixed: `@import "x"\n\n;\n`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines between a bare at-rule and the semicolon closing it`,
			code: `a {\n\t@extend .b\n\n\n;\n}\n`,
			fixed: `a {\n\t@extend .b\n\n;\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines in front of a comment the at-rule closing the block swallowed, which stand in the raw of that at-rule beside the comment`,
			code: `a {\n\t@extend .b\n\n\n\t/* c */\n}\n`,
			fixed: `a {\n\t@extend .b\n\n\t/* c */\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		{
			// See #598
			description: `three blank lines behind a free semicolon opening the stylesheet, which stand in the raw of the first rule and are cut to one as any run is`,
			code: `;\n\n\n\na {}`,
			fixed: `;\n\na {}`,
			warnings: [
				{
					line: 3,
					column: 1,
					message: messages.expected(1),
				},
				{
					line: 4,
					column: 1,
					message: messages.expected(1),
				},
			],
		},
		// See #404
		{
			description: `a stylesheet holding nothing but two line breaks, which are two empty lines and not three, and of which one is taken away`,
			code: `\n\n`,
			fixed: `\n`,
			line: 2,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same stylesheet written with carriage-return line breaks`,
			code: `\r\n\r\n`,
			fixed: `\r\n`,
			line: 2,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same stylesheet with a run of spaces written behind the breaks, which ends a line of its own and hides nothing`,
			code: `\n\n   `,
			fixed: `\n   `,
			line: 2,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `a stylesheet holding a line break, a run of spaces and two line breaks, whose last run is not the one the file opened with and is counted as the end of any file is`,
			code: `\n   \n\n`,
			fixed: `\n   \n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		// See #601
		{
			description: `two blank lines opening a stylesheet behind a byte-order mark, which is no character of the text the positions are counted in`,
			code: `\uFEFF\n\na {}`,
			fixed: `\uFEFF\na {}`,
			line: 2,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines closing a stylesheet behind a byte-order mark`,
			code: `\uFEFFa {}\n\n\n`,
			fixed: `\uFEFFa {}\n`,
			warnings: [
				{
					line: 3,
					column: 1,
					message: messages.expected(1),
				},
				{
					line: 4,
					column: 1,
					message: messages.expected(1),
				},
			],
		},
		// See #586
		{
			description: `three blank lines in front of the closing brace of a rule, whose breaks take turns between a carriage-return pair and a bare newline`,
			code: `a {\r\n\tb: c;\r\n\n\r\n\n}\r\n`,
			fixed: `a {\r\n\tb: c;\r\n\n}\r\n`,
			warnings: [
				{
					line: 4,
					column: 1,
					message: messages.expected(1),
				},
				{
					line: 5,
					column: 1,
					message: messages.expected(1),
				},
			],
		},
		{
			description: `the same blank lines written with bare newlines in a stylesheet otherwise written with carriage-return line breaks`,
			code: `a {\r\n\tb: c;\n\n\n\n}\r\n`,
			fixed: `a {\r\n\tb: c;\n\n}\r\n`,
			warnings: [
				{
					line: 4,
					column: 1,
					message: messages.expected(1),
				},
				{
					line: 5,
					column: 1,
					message: messages.expected(1),
				},
			],
		},
		{
			description: `three blank lines of bare newlines behind a line of spaces opened by a carriage-return pair, which stand in the same whitespace as the pair`,
			code: `a {}\r\n  \n\n\n\nb {}`,
			fixed: `a {}\r\n  \n\nb {}`,
			warnings: [
				{
					line: 4,
					column: 1,
					message: messages.expected(1),
				},
				{
					line: 5,
					column: 1,
					message: messages.expected(1),
				},
			],
		},
		{
			description: `three blank lines between two rules whose breaks take turns and open with a bare newline`,
			code: `a {}\n\r\n\n\r\nb {}`,
			fixed: `a {}\n\r\nb {}`,
			warnings: [
				{
					line: 3,
					column: 1,
					message: messages.expected(1),
				},
				{
					line: 4,
					column: 1,
					message: messages.expected(1),
				},
			],
		},
		{
			description: `three blank lines opening the stylesheet whose breaks take turns`,
			code: `\n\r\n\na {}`,
			fixed: `\na {}`,
			warnings: [
				{
					line: 2,
					column: 1,
					message: messages.expected(1),
				},
				{
					line: 3,
					column: 1,
					message: messages.expected(1),
				},
			],
		},
		{
			description: `three blank lines closing the stylesheet whose breaks take turns`,
			code: `a {}\n\r\n\n\r\n`,
			fixed: `a {}\n`,
			warnings: [
				{
					line: 3,
					column: 1,
					message: messages.expected(1),
				},
				{
					line: 4,
					column: 1,
					message: messages.expected(1),
				},
				{
					line: 5,
					column: 1,
					message: messages.expected(1),
				},
			],
		},
		{
			description: `three blank lines inside a comment whose breaks take turns`,
			code: `/* horse\n\r\n\n\r\n */\na {}`,
			fixed: `/* horse\n\r\n */\na {}`,
			warnings: [
				{
					line: 3,
					column: 1,
					message: messages.expected(1),
				},
				{
					line: 4,
					column: 1,
					message: messages.expected(1),
				},
			],
		},
		{
			description: `two blank lines behind a bare address holding a quotation mark, which is a character of the address and opens no string`,
			code: `a { b: url(x'y) }\n\n\nc {}`,
			fixed: `a { b: url(x'y) }\n\nc {}`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines behind a string ending in an escaped backslash, whose closing quotation mark no escape holds`,
			code: `a { b: "a\\\\" }\n\n\nc {}`,
			fixed: `a { b: "a\\\\" }\n\nc {}`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		// See #582
		{
			description: `two blank lines behind a declaration whose value holds a string of blank lines, which are text of the string and lines of no stylesheet`,
			code: `a {\n\tb: "c\n\n\n\nd";\n}\n\n\ne {}\n`,
			fixed: `a {\n\tb: "c\n\n\n\nd";\n}\n\ne {}\n`,
			line: 9,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines inside the selector of a rule`,
			code: `a,\n\n\nb {}\n`,
			fixed: `a,\n\nb {}\n`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a,\r\n\r\n\r\nb {}\r\n`,
			fixed: `a,\r\n\r\nb {}\r\n`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines inside the parameters of an at-rule`,
			code: `@media (x)\n\n\nand (y) {}\n`,
			fixed: `@media (x)\n\nand (y) {}\n`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines inside the value of a declaration`,
			code: `a {\n\tb: c\n\n\nd;\n}\n`,
			fixed: `a {\n\tb: c\n\nd;\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines inside the value of a custom property, which the parser keeps whole`,
			code: `a {\n\t--b: c\n\n\nd;\n}\n`,
			fixed: `a {\n\t--b: c\n\nd;\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines inside the parentheses of a bare address, which whitespace has made a bad-url token already`,
			code: `a {\n\tb: url(c\n\n\nd);\n}\n`,
			fixed: `a {\n\tb: url(c\n\nd);\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines inside the text of a comment`,
			code: `/* a\n\n\nb */\n`,
			fixed: `/* a\n\nb */\n`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines inside a comment standing in the value of a declaration`,
			code: `a {\n\tb: c /* x\n\n\ny */ d;\n}\n`,
			fixed: `a {\n\tb: c /* x\n\ny */ d;\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines inside a comment standing between a selector and its opening brace`,
			code: `a /* x\n\n\ny */ {}\n`,
			fixed: `a /* x\n\ny */ {}\n`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [1],
	customSyntax: `postcss-html`,

	accept: [
		{
			description: `blank lines around an embedded stylesheet, which stand in the document rather than in it`,
			code: `<div>




<style>
/* horse */
</style>



</div>`,
		},
		{
			description: `a blank line closing an embedded stylesheet`,
			code: `<div>
<style>
/* horse */

</style>
</div>`,
		},
		{
			description: `blank lines in a style attribute and in two embedded stylesheets`,
			code: `<div style="
color: pink;

">
<style>
/* style1 */

</style>
<style>
/* style2 */

</style>
</div>`,
		},
		{
			description: `an embedded stylesheet the document never closes`,
			code: `<html><!-- when there is no end tag -->
<style>
a {color: pink;}

`,
		},
	],

	reject: [
		{
			description: `two blank lines closing an embedded stylesheet`,
			code: `<div>
<style>
/* horse */


</style>
</div>`,
			fixed: `<div>
<style>
/* horse */

</style>
</div>`,
			line: 5,
			column: 1,
			message: messages.expected(1),
		},

		{
			description: `two blank lines inside a style attribute`,
			code: `<div style="color: pink;


">
</div>`,
			fixed: `<div style="color: pink;

">
</div>`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines closing the second of two embedded stylesheets`,
			code: `<div style="color: pink;">
<style>
a {}

</style>
<style>
a {}


</style>
</div>`,
			fixed: `<div style="color: pink;">
<style>
a {}

</style>
<style>
a {}

</style>
</div>`,
			line: 9,
			column: 1,
			message: messages.expected(1),
		},
		// See #481
		{
			description: `two blank lines in front of the closing brace of a rule in an embedded stylesheet`,
			code: `<style>\na {\n\tb: c;\n\n\n}\n</style>\n`,
			fixed: `<style>\na {\n\tb: c;\n\n}\n</style>\n`,
			line: 5,
			column: 1,
			message: messages.expected(1),
		},
		// See #601
		{
			description: `two blank lines between two rules of an embedded stylesheet opening with a byte-order mark, which is a character of the document the lines are placed in`,
			code: `<style>\uFEFFa {}\n\n\nb {}</style>`,
			fixed: `<style>\uFEFFa {}\n\nb {}</style>`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [0],
	customSyntax: `postcss-html`,

	reject: [
		// See #731
		{
			description: `a blank line closing an embedded stylesheet`,
			code: `<style>\na {}\n\n</style>`,
			fixed: `<style>\na {}\n</style>`,
			line: 3,
			column: 1,
			message: messages.expected(0),
		},
		{
			description: `a blank line closing a style attribute`,
			code: `<div style="color: pink;\n\n"></div>`,
			fixed: `<div style="color: pink;\n"></div>`,
			line: 2,
			column: 1,
			message: messages.expected(0),
		},
	],
})

testRule({
	ruleName,
	config: [2],

	accept: [
		{
			description: `two rules with a single line break between them`,
			code: `a {}\nb {}`,
		},
		{
			description: `a blank line between two rules`,
			code: `a {}\n\nb {}`,
		},
		{
			description: `two blank lines between two rules`,
			code: `a {}\n\n\nb {}`,
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n\r\nb {}`,
		},
		{
			description: `two blank lines on either side of a comment`,
			code: `a {}\n\n\n/** horse */\n\n\nb {}`,
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n\r\n/** horse */\r\n\r\n\r\nb {}`,
		},
		{
			description: `a rule closed by two blank lines and a run of spaces, which is exactly the option's count`,
			code: `a {}\n\n   `,
		},
		// See #404
		{
			description: `a stylesheet holding nothing but two line breaks, which are exactly the option's count`,
			code: `\n\n`,
		},
	],

	reject: [
		{
			description: `a rule closed by three blank lines and a run of spaces, which ends a line of its own and hides none of the three`,
			code: `a {}\n\n\n   `,
			fixed: `a {}\n\n   `,
			line: 4,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `three blank lines between two rules`,
			code: `a {}\n\n\n\nb {}`,
			fixed: `a {}\n\n\nb {}`,
			line: 4,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n\r\n\r\nb {}`,
			fixed: `a {}\r\n\r\n\r\nb {}`,
			line: 4,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `three blank lines behind a comment`,
			code: `a {}\n\n/** horse */\n\n\n\nb {}`,
			fixed: `a {}\n\n/** horse */\n\n\nb {}`,
			line: 6,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n/** horse */\r\n\r\n\r\n\r\nb {}`,
			fixed: `a {}\r\n\r\n/** horse */\r\n\r\n\r\nb {}`,
			line: 6,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `three blank lines inside a comment`,
			code: `/* horse\n\n\n\n */\na {}`,
			fixed: `/* horse\n\n\n */\na {}`,
			line: 4,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `/* horse\r\n\r\n\r\n\r\n */\r\na {}`,
			fixed: `/* horse\r\n\r\n\r\n */\r\na {}`,
			line: 4,
			column: 1,
			message: messages.expected(2),
		},
		// See #481
		{
			description: `three blank lines in front of the closing brace of a rule`,
			code: `a {\n\tb: c;\n\n\n\n}\n`,
			fixed: `a {\n\tb: c;\n\n\n}\n`,
			line: 5,
			column: 1,
			message: messages.expected(2),
		},
		// See #404
		{
			description: `a stylesheet holding nothing but three line breaks, which are three empty lines and not four`,
			code: `\n\n\n`,
			fixed: `\n\n`,
			line: 3,
			column: 1,
			message: messages.expected(2),
		},
	],
})

testRule({
	ruleName,
	config: [2, { ignore: `comments` }],

	accept: [
		{
			description: `blank lines inside a comment, which the option lets stand`,
			code: `a {}\n\n/*\n\n\n\n*/\n\nb {}`,
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n/*\r\n\r\n\r\n\r\n*/\r\n\r\nb {}`,
		},
		{
			description: `a longer run of blank lines inside a comment`,
			code: `a {}\n\n/**\n\n\n\n\n\n\n*/\n\nb {}`,
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n/**\r\n\r\n\r\n\r\n\r\n\r\n\r\n*/\r\n\r\nb {}`,
		},
		{
			description: `blank lines inside a comment standing in a block`,
			code: `a {\n display: block;\n /*\n\n\n\n */\n}\n\n`,
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {\r\n display: block;\r\n /*\r\n\r\n\r\n\r\n */\r\n}\r\n\r\n`,
		},
		// See #725
		{
			description: `blank lines inside a string behind a protocol-relative address, which belong to the string and go uncounted as they do behind no address`,
			code: `a { b: url(//x.y/z) "c\\\n\n\n\nd" }`,
		},
		{
			description: `blank lines inside a comment behind a bare address holding a quotation mark, which opens no string that could hold the comment`,
			code: `a { b: url(x'y) }\n/* c\n\n\n\nd */\ne {}`,
		},
	],

	reject: [
		{
			// The escape is masked in the copy the breaks are found over, its closing break left standing (1789649818)
			description: `three blank lines behind the line break closing a hexadecimal escape, which is a line of the file`,
			code: `a { b: 1\\2c\n\n\n\n}`,
			fixed: `a { b: 1\\2c\n\n\n}`,
			line: 4,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `three blank lines behind a comment whose own are let stand`,
			code: `a {}\n\n/*\n\n\n\n\n*/\n\n\n\nb {}`,
			fixed: `a {}\n\n/*\n\n\n\n\n*/\n\n\nb {}`,
			line: 11,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n/**\r\n\r\n\r\n\r\n\r\n*/\r\n\r\n\r\n\r\nb {}`,
			fixed: `a {}\r\n\r\n/**\r\n\r\n\r\n\r\n\r\n*/\r\n\r\n\r\nb {}`,
			line: 11,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `blank lines closing the stylesheet with a run of spaces behind them, which this option counts as the plain one does`,
			code: `a {}\n\n\n   `,
			fixed: `a {}\n\n   `,
			line: 4,
			column: 1,
			message: messages.expected(2),
		},
		// See #586
		{
			description: `four blank lines behind a comment whose breaks take turns, which this option counts as the plain one does`,
			code: `a {}\n\n/*\n\n\n\n\n*/\r\n\n\r\n\n\r\nb {}`,
			fixed: `a {}\n\n/*\n\n\n\n\n*/\r\n\n\r\nb {}`,
			warnings: [
				{
					line: 11,
					column: 1,
					message: messages.expected(2),
				},
				{
					line: 12,
					column: 1,
					message: messages.expected(2),
				},
			],
		},
		// See #725
		{
			description: `three blank lines behind an address spelling a double slash, which opens no comment in plain CSS`,
			code: `a { b: url(http://x.y/z) }\n\n\n\nc {}`,
			fixed: `a { b: url(http://x.y/z) }\n\n\nc {}`,
			line: 4,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `three blank lines in front of the closing brace behind a protocol-relative address`,
			code: `a {\n\tb: url(//x.y/z)\n\n\n\n}\n`,
			fixed: `a {\n\tb: url(//x.y/z)\n\n\n}\n`,
			line: 5,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `three blank lines behind an unquoted address spelling a slash and an asterisk, which open no comment inside it`,
			code: `a { b: url(/*x) }\n\n\n\nc {}`,
			fixed: `a { b: url(/*x) }\n\n\nc {}`,
			line: 4,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `four blank lines behind two block comments written against each other, whose join spells no third comment`,
			code: `/* a *//* b */\n\n\n\n\nc {}`,
			fixed: `/* a *//* b */\n\n\nc {}`,
			warnings: [
				{
					line: 4,
					column: 1,
					message: messages.expected(2),
				},
				{
					line: 5,
					column: 1,
					message: messages.expected(2),
				},
			],
		},
		// See #582
		{
			description: `four blank lines behind a declaration holding a comment in its value, whose own blank lines this option lets stand while the run outside it is cut`,
			code: `a {\n\tb: c /* x\n\n\n\ny */ d;\n}\n\n\n\n\ne {}\n`,
			fixed: `a {\n\tb: c /* x\n\n\n\ny */ d;\n}\n\n\ne {}\n`,
			warnings: [
				{
					line: 10,
					column: 1,
					message: messages.expected(2),
				},
				{
					line: 11,
					column: 1,
					message: messages.expected(2),
				},
			],
		},
		// See #581
		{
			description: `four blank lines behind a rule holding a comment between its selector and its opening brace, whose own blank lines this option lets stand while the run outside it is cut`,
			code: `a /* x\n\n\n\ny */ {}\n\n\n\n\nb {}\n`,
			fixed: `a /* x\n\n\n\ny */ {}\n\n\nb {}\n`,
			warnings: [
				{
					line: 8,
					column: 1,
					message: messages.expected(2),
				},
				{
					line: 9,
					column: 1,
					message: messages.expected(2),
				},
			],
		},
	],
})
