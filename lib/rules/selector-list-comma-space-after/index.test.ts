import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a space after the comma`,
			code: `a, b {}`,
		},
		{
			description: `a space after each of the two commas`,
			code: `a, b, c {}`,
		},
		{
			description: `a space on either side of the comma`,
			code: `a , b {}`,
		},
		{
			description: `a newline in front of the comma and a space after it`,
			code: `a\n, b {}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `a\r\n, b {}`,
		},
		{
			description: `a comma inside an attribute value, which is no comma of the list`,
			code: `a, b[data-foo="tr,tr"] {}`,
		},
		{
			description: `commas inside the argument of a pseudo-class, which are no commas of the list`,
			code: `a:matches(:hover,:focus) {}`,
		},
		{
			description: `the same inside a negation`,
			code: `:not(:hover,:focus) {}`,
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
			description: `a comma standing behind a comment, the space in front of another`,
			code: `a/*comment,comment*/, /*comment*/b {}`,
		},
	],

	reject: [
		{
			description: `no space after the comma`,
			code: `a,b {}`,
			fixed: `a, b {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces after the comma`,
			code: `a,  b {}`,
			fixed: `a, b {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
		{
			description: `a newline after the comma`,
			code: `a,\nb {}`,
			fixed: `a, b {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
		{
			description: `a carriage-return line break after the comma`,
			code: `a,\r\nb {}`,
			fixed: `a, b {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab after the comma`,
			code: `a,\tb {}`,
			fixed: `a, b {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
		{
			description: `no space after the second of two commas`,
			code: `a, b,c {}`,
			fixed: `a, b, c {}`,
			line: 1,
			column: 5,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces after the second of two commas`,
			code: `a, b,  c {}`,
			fixed: `a, b, c {}`,
			line: 1,
			column: 5,
			message: messages.expectedAfter(),
		},
		{
			description: `no space after a comma standing between two comments`,
			code: `a/*comment*/,/*comment*/b {}`,
			fixed: `a/*comment*/, /*comment*/b {}`,
			line: 1,
			column: 13,
			message: messages.expectedAfter(),
		},
		{
			description: `no space after either of the two commas`,
			code: `a,b,c {}`,
			fixed: `a, b, c {}`,
			warnings: [
				{
					line: 1,
					column: 2,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 4,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			description: `no space after any of the six commas`,
			code: `a,b,c,d,e,f,g {}`,
			fixed: `a, b, c, d, e, f, g {}`,
			warnings: [
				{
					line: 1,
					column: 2,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 4,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 6,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 8,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 10,
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
			// The search the commas are found with closes no string at a quotation mark a backslash stands in front of, so the comma behind one went unread
			description: `no space after a comma behind a string ending in an escaped backslash, whose closing quotation mark no escape holds`,
			code: `[a="b\\\\"],c {}`,
			fixed: `[a="b\\\\"], c {}`,
			line: 1,
			column: 10,
			message: messages.expectedAfter(),
		},
		{
			// The search opens a string at a quotation mark inside a bare address, which the tokenizer reads as a character of the address
			description: `no space after a comma behind a bare address holding a quotation mark`,
			code: `:is(url(x'y)),c {}`,
			fixed: `:is(url(x'y)), c {}`,
			line: 1,
			column: 14,
			message: messages.expectedAfter(),
		},
		{
			// A quotation mark inside a comment opens no string, so the comma behind the comment is read
			description: `no space after a comma behind a comment holding a quotation mark`,
			code: `a/*"*/,c {}`,
			fixed: `a/*"*/, c {}`,
			line: 1,
			column: 7,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `no space after the comma`,
			code: `a,b {}`,
		},
		{
			description: `no space after either of the two commas`,
			code: `a,b,c {}`,
		},
		{
			description: `a space in front of the comma and none after it`,
			code: `a ,b {}`,
		},
		{
			description: `a newline in front of the comma and nothing after it`,
			code: `a\n,b {}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `a\r\n,b {}`,
		},
		{
			description: `a comma and a space inside an attribute value, which are no commas of the list`,
			code: `a,b[data-foo="tr, tr"] {}`,
		},
		{
			description: `spaced commas inside the argument of a pseudo-class`,
			code: `a:matches(:hover, :focus) {}`,
		},
		{
			description: `the same inside a negation`,
			code: `:not(:hover, :focus) {}`,
		},
		{
			description: `comments on either side of the comma, with no space anywhere`,
			code: `a/*comment, comment*/,/*comment*/b {}`,
		},
	],

	reject: [
		{
			description: `a space after the comma`,
			code: `a, b {}`,
			fixed: `a,b {}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfter(),
		},
		{
			description: `two spaces after the comma`,
			code: `a,  b {}`,
			fixed: `a,b {}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfter(),
		},
		{
			description: `a newline after the comma`,
			code: `a,\nb {}`,
			fixed: `a,b {}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfter(),
		},
		{
			description: `a carriage-return line break after the comma`,
			code: `a,\r\nb {}`,
			fixed: `a,b {}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfter(),
		},
		{
			description: `a tab after the comma`,
			code: `a,\tb {}`,
			fixed: `a,b {}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space after the second of two commas`,
			code: `a,b, c {}`,
			fixed: `a,b,c {}`,
			line: 1,
			column: 4,
			message: messages.rejectedAfter(),
		},
		{
			description: `two spaces after the second of two commas`,
			code: `a,b,  c {}`,
			fixed: `a,b,c {}`,
			line: 1,
			column: 4,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space after a comma standing between two comments`,
			code: `a/*comment*/, /*comment*/b {}`,
			fixed: `a/*comment*/,/*comment*/b {}`,
			line: 1,
			column: 13,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space after either of the two commas`,
			code: `a, b, c {}`,
			fixed: `a,b,c {}`,
			warnings: [
				{
					line: 1,
					column: 2,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 5,
					message: messages.rejectedAfter(),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			description: `a space after the comma of a single-line list`,
			code: `a, b {}`,
		},
		{
			description: `a single-line list in front of a multi-line block, which does not make the list multi-line`,
			code: `a, b {\n}`,
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a, b {\r\n}`,
		},
	],

	reject: [
		{
			description: `no space after the comma of a single-line list`,
			code: `a,b {}`,
			fixed: `a, b {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same list in front of a multi-line block`,
			code: `a,b {\n}`,
			fixed: `a, b {\n}`,
			line: 1,
			column: 2,
			message: messages.expectedAfterSingleLine(),
		},
		{
			// See #244
			description: `a form feed in front of the comma, which is whitespace and no line break, so the list is single-line`,
			code: `a\f,b {}`,
			fixed: `a\f, b {}`,
			line: 1,
			column: 3,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a,b {\r\n}`,
			fixed: `a, b {\r\n}`,
			line: 1,
			column: 2,
			message: messages.expectedAfterSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `no space after the comma of a single-line list`,
			code: `a,b {}`,
		},
		{
			description: `a single-line list in front of a multi-line block, which does not make the list multi-line`,
			code: `a,b {\n}`,
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a,b {\r\n}`,
		},
	],

	reject: [
		{
			description: `a space after the comma of a single-line list`,
			code: `a, b {}`,
			fixed: `a,b {}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `the same list in front of a multi-line block`,
			code: `a, b {\n}`,
			fixed: `a,b {\n}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a, b {\r\n}`,
			fixed: `a,b {\r\n}`,
			line: 1,
			column: 2,
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
			code: `a,\vb {}`,
			fixed: `a, \vb {}`,
			line: 1,
			column: 2,
			endLine: 1,
			endColumn: 3,
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
			description: `a vertical tab behind the run after the comma: only the tokenizer's run goes, and the character stays`,
			code: `a, \vb {}`,
			fixed: `a,\vb {}`,
			line: 1,
			column: 2,
			endLine: 1,
			endColumn: 3,
			message: messages.rejectedAfter(),
		},
	],
})

// The break twin writes the run behind the comma too, and the library lists it behind this rule, so its write would be the file's last (#704)
testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/selector-list-comma-newline-after": `always` },

	reject: [
		{
			// See #704
			description: `a break behind the comma, which the twin behind this rule accepts and would put back, so the warning stands and nothing is written`,
			code: `a,\nb {}`,
			fixed: `a,\nb {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces in front of a comment behind the comma, past which the twin reads, so the two contend for nothing and the space is written`,
			code: `a,  /* c */\nb {}`,
			fixed: `a, /* c */\nb {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
	],
})

// The break twin reads past a comment behind whitespace, and a write taking that whitespace away puts the comment against the comma, where the twin reads the run (#704)
testRule({
	ruleName,
	config: [`never`],
	extraRules: { "@stylistic/selector-list-comma-newline-after": `always` },

	reject: [
		{
			// See #704
			description: `a space in front of a comment behind the comma, whose removal would leave the twin behind this rule reading the comma's own run and writing a break there, so the warning stands and nothing is written`,
			code: `a, /* c */\nb {}`,
			fixed: `a, /* c */\nb {}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfter(),
		},
	],
})
