import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a newline in front of the comma`,
			code: `a\n,b {}`,
		},
		{
			description: `two newlines in front of the comma`,
			code: `a\n\n,b {}`,
		},
		{
			description: `a newline in front of each of the two commas`,
			code: `a\n,b\n,c {}`,
		},
		{
			description: `the same list written with carriage-return line breaks`,
			code: `a\r\n,b\r\n,c {}`,
		},
		{
			description: `two carriage-return line breaks in front of the first comma`,
			code: `a\r\n\r\n,b\r\n,c {}`,
		},
		{
			description: `a newline in front of the comma and a space after it`,
			code: `a\n, b {}`,
		},
		{
			description: `a newline on either side of the comma`,
			code: `a\n,\nb {}`,
		},
		{
			description: `the same list written with carriage-return line breaks`,
			code: `a\r\n,\r\nb {}`,
		},
		{
			description: `a comma inside an attribute value, which is no comma of the list`,
			code: `a\n,b[data-foo="tr,tr"] {}`,
		},
		{
			description: `spaces of indentation in front of the comma`,
			code: `a\n    ,b {}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `a\r\n    ,b {}`,
		},
		{
			description: `tabs of indentation in front of the comma`,
			code: `a\n\t\t,b {}`,
		},
		{
			autoStripIndent: false,
			description: `an indented selector list`,
			code: `\ta\n\t, b {}`,
		},
		{
			description: `commas inside the argument of a pseudo-class, which are no commas of the list`,
			code: `a:matches(:hover, :focus) {}`,
		},
		{
			description: `the same inside a negation`,
			code: `:not(:hover, :focus) {}`,
		},
		{
			description: `a custom property under the root selector`,
			code: `:root { --foo: 1px; }`,
		},
		{
			description: `a custom property under a type selector`,
			code: `html { --foo: 1px; }`,
		},
		{
			description: `a custom property set under the root selector`,
			code: `:root { --custom-property-set: {} }`,
		},
		{
			description: `a custom property set under a type selector`,
			code: `html { --custom-property-set: {} }`,
		},
		{
			description: `a comma standing behind a comment and a newline, with another comment after it`,
			code: `a/*comment,comment*/\n,/*comment*/b {}`,
		},
	],

	reject: [
		{
			// See #196
			description: `a form feed beside the comma, which is whitespace and no line break, so the break is written in front of it`,
			code: `a\f,b {}`,
			fixed: `a\f\n,b {}`,
			line: 1,
			column: 3,
			message: messages.expectedBefore(),
		},
		{
			description: `no newline in front of the comma`,
			code: `a,b {}`,
			fixed: `a\n,b {}`,
			line: 1,
			column: 2,
			message: messages.expectedBefore(),
		},
		{
			description: `a space in front of the comma`,
			code: `a ,b {}`,
			fixed: `a\n ,b {}`,
			line: 1,
			column: 3,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces in front of the comma`,
			code: `a  ,b {}`,
			fixed: `a\n  ,b {}`,
			line: 1,
			column: 4,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab in front of the comma`,
			code: `a\t,b {}`,
			fixed: `a\n\t,b {}`,
			line: 1,
			column: 3,
			message: messages.expectedBefore(),
		},
		{
			description: `no newline in front of the second of two commas`,
			code: `a\n,b,c {}`,
			fixed: `a\n,b\n,c {}`,
			line: 2,
			column: 3,
			message: messages.expectedBefore(),
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `a\r\n,b,c {}`,
			fixed: `a\r\n,b\r\n,c {}`,
			line: 2,
			column: 3,
			message: messages.expectedBefore(),
		},
		{
			description: `no newline in front of a comma standing between two comments`,
			code: `a/*comment*/,/*comment*/b {}`,
			fixed: `a/*comment*/\n,/*comment*/b {}`,
			line: 1,
			column: 13,
			message: messages.expectedBefore(),
		},
		{
			description: `no newline in front of any of the six commas`,
			code: `a,b,c,d,e,f,g {}`,
			fixed: `a\n,b\n,c\n,d\n,e\n,f\n,g {}`,
			warnings: [
				{
					line: 1,
					column: 2,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 4,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 6,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 8,
					message: messages.expectedBefore(),
				},
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
			// The search the commas are found with closes no string at a quotation mark a backslash stands in front of, so the comma behind one went unread
			description: `no newline before a comma behind a string ending in an escaped backslash, whose closing quotation mark no escape holds`,
			code: `[a="b\\\\"],c {}`,
			fixed: `[a="b\\\\"]\n,c {}`,
			line: 1,
			column: 10,
			message: messages.expectedBefore(),
		},
		{
			// The run in front of such a comma is `raws.before`, which this rule does not write: a break written into the selector lands in that raw at the next parse, the comma opens the selector again, and every run grows the file by a line
			description: `a comma opening the selector of the first rule of the file`,
			code: `,a {}`,
			fixed: `,a {}`,
			line: 1,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			// The raw here already holds the break the option asks for, and the warning is a false positive of the checker's, recorded as spec 1789593917
			description: `a comma opening the selector of a rule standing behind another, where the run lies in that raw as well`,
			code: `x {}\n,a {}`,
			fixed: `x {}\n,a {}`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a newline in front of the comma of a multi-line list`,
			code: `a\n,b {}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `a\r\n,b {}`,
		},
		{
			description: `a single-line list, which this option does not measure`,
			code: `a, b {}`,
		},
		{
			description: `a single-line list in front of a multi-line block, which does not make the list multi-line`,
			code: `a, b {\n}`,
		},
		{
			description: `an indented multi-line list`,
			code: `\ta\n\t, b {\n}`,
		},
	],

	reject: [
		{
			// The run in front of the delimiter is read over the copy with its escapes masked (1789657288)
			description: `an escaped space in front of the comma of a multi-line list, which is a character of the name and no newline, so the break goes behind it`,
			code: `a\n,b\\ ,c {}`,
			fixed: `a\n,b\\ \n,c {}`,
			line: 2,
			column: 5,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `no newline in front of the second comma of a multi-line list`,
			code: `a\n,b, c {}`,
			fixed: `a\n,b\n, c {}`,
			line: 2,
			column: 3,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `a\r\n,b, c {}`,
			fixed: `a\r\n,b\r\n, c {}`,
			line: 2,
			column: 3,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `the same list in front of a multi-line block`,
			code: `a\n,b, c {\n}`,
			fixed: `a\n,b\n, c {\n}`,
			line: 2,
			column: 3,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			// The same raw in front of a multi-line list: a break written there grows the file by a line every run, and the warning itself is spec 1789593917's false positive
			description: `a comma opening the selector of a multi-line list`,
			code: `x {}\n,a\n,b {}`,
			fixed: `x {}\n,a\n,b {}`,
			line: 2,
			column: 1,
			message: messages.expectedBeforeMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			// The run in front of the delimiter is read over the copy with its escapes masked (1789657288)
			description: `an escaped space in front of the comma of a multi-line list, which is a character of the name and no whitespace`,
			code: `a,b\\ ,c\nd {}`,
		},
		{
			description: `a newline after the comma, which leaves nothing in front of it`,
			code: `a,\nb {}`,
		},
		{
			description: `a single-line list, which this option does not measure`,
			code: `a ,b {}`,
		},
		{
			description: `a single-line list in front of a multi-line block, which does not make the list multi-line`,
			code: `a ,b {\n}`,
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a ,b {\r\n}`,
		},
		{
			description: `commas inside the argument of a pseudo-class, which are no commas of the list`,
			code: `a:matches(:hover, :focus) {}`,
		},
		{
			description: `the same inside a negation`,
			code: `:not(:hover, :focus) {}`,
		},
		{
			description: `a newline inside the text of a comment, which the comma does not stand behind`,
			code: `a/*comment\n,comment*/,/*comment*/b {\n}`,
		},
	],

	reject: [
		{
			// Pins the refusal of a write behind a backslash delimiter (1789661965)
			description: `a backslash ending the selector in front of a line break and the comma, which the write would turn into an escaped comma, so the warning stands`,
			code: `a,\nb\\\n,c {}`,
			fixed: `a,\nb\\\n,c {}`,
			line: 3,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a space in front of the second comma of a multi-line list`,
			code: `a,\nb , c {}`,
			fixed: `a,\nb, c {}`,
			line: 2,
			column: 3,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `the same list in front of a multi-line block`,
			code: `
				a,
				b , c {
				}
			`,
			fixed: `
				a,
				b, c {
				}
			`,
			line: 2,
			column: 3,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `the same list and block written with carriage-return line breaks`,
			code: `a,\r\nb , c {\r\n}`,
			fixed: `a,\r\nb, c {\r\n}`,
			line: 2,
			column: 3,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a newline in front of a comma standing between two comments`,
			code: `
				a/*comment*/
				,/*comment*/b {
				}
			`,
			fixed: `
				a/*comment*/,/*comment*/b {
				}
			`,
			line: 2,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})

// A vertical tab and a no-break space are words to PostCSS's tokenizer (#496): the fix rewrites only the run the tokenizer reads beside its anchor, and such a character stays where the fix used to carry it off with the run.
testRule({
	ruleName,
	config: [`never-multi-line`],

	reject: [
		{
			// See #496
			description: `a vertical tab in the run before a comma of a multi-line list: the run goes down to the character, which stays`,
			code: `a\v\n, b,\nc {}`,
			fixed: `a\v, b,\nc {}`,
			line: 2,
			column: 1,
			endLine: 2,
			endColumn: 2,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})

// The space twin writes the run in front of the comma too, and the library lists it behind this rule, so its write would be the file's last (#704)
testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/selector-list-comma-space-before": `always` },

	reject: [
		{
			// See #704
			description: `a space in front of the comma, which the twin behind this rule accepts and would take the break back from, so the warning stands and nothing is written`,
			code: `a ,b {}`,
			fixed: `a ,b {}`,
			line: 1,
			column: 3,
			message: messages.expectedBefore(),
		},
	],
})
