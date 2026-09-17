import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a comma inside the address of an import, which opens no query list`,
			code: `@import url(x.com?a=b,c=d)`,
		},
		{
			description: `a single query, with no comma to measure`,
			code: `@media (max-width: 600px) {}`,
		},
		{
			description: `the same query under a mixed-case at-rule name`,
			code: `@mEdIa (max-width: 600px) {}`,
		},
		{
			description: `the same query under an upper-case at-rule name`,
			code: `@MEDIA (max-width: 600px) {}`,
		},
		{
			description: `a newline in front of the comma`,
			code: `@media screen and (color)\n, projection and (color) {}`,
		},
		{
			description: `two newlines in front of the comma`,
			code: `@media screen and (color)\n\n, projection and (color) {}`,
		},
		{
			description: `a carriage return and a newline in front of the comma`,
			code: `@media screen and (color)\r\n, projection and (color) {}`,
		},
		{
			description: `two carriage-return line breaks in front of the comma`,
			code: `@media screen and (color)\r\n\r\n, projection and (color) {}`,
		},
		{
			description: `a newline and indentation in front of the comma`,
			code: `@media screen and (color)\n     ,  projection and (color) {}`,
		},
		{
			description: `a comma indented on a line of its own`,
			code: `@media screen and (color)\n\t\t,\nprojection and (color) {}`,
		},
		{
			description: `the same list written with carriage-return line breaks`,
			code: `@media screen and (color)\r\n\t\t,\r\nprojection and (color) {}`,
		},
		{
			description: `a query list that carries no block`,
			code: `@media screen and (color)\n\n, projection and (color)`,
		},
		{
			description: `an at-rule whose name ends in media`,
			code: `@non-media screen and (color), projection and (color) {}`,
		},
		{
			description: `an at-rule whose name opens with media`,
			code: `@media-non screen and (color), projection and (color) {}`,
		},
		{
			// See #153
			description: `a bare address in front of the comma, whose double slash opens no comment`,
			code: `
				@media (min-width: url(http://x/y.png))
				,print { a { b: c; } }
			`,
		},
		{
			// See #213
			description: `a comma inside the arguments of a function is a comma of the address and of no query list`,
			code: `@media (min-width: url(x/a,b.png)) { a { b: c; } }`,
		},
	],

	reject: [
		{
			description: `no newline in front of the comma`,
			code: `@media screen and (color), projection and (color) {}`,
			fixed: `@media screen and (color)\n, projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
		{
			description: `no newline in front of the comma, under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color), projection and (color) {}`,
			fixed: `@mEdIa screen and (color)\n, projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
		{
			description: `no newline in front of the comma, under an upper-case at-rule name`,
			code: `@MEDIA screen and (color), projection and (color) {}`,
			fixed: `@MEDIA screen and (color)\n, projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces in front of the comma`,
			code: `@media screen and (color)  , projection and (color) {}`,
			fixed: `@media screen and (color)\n  , projection and (color) {}`,
			line: 1,
			column: 28,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab in front of the comma`,
			code: `@media screen and (color)\t, projection and (color) {}`,
			fixed: `@media screen and (color)\n\t, projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.expectedBefore(),
		},
		{
			// See #153
			description: `a comma behind a bare address, whose double slash opens no comment`,
			code: `@media (min-width: url(http://x/y.png)),print { a { b: c; } }`,
			fixed: `@media (min-width: url(http://x/y.png))\n,print { a { b: c; } }`,
			line: 1,
			column: 40,
			message: messages.expectedBefore(),
		},
		{
			description: `a comma opening the parameters, whose whitespace is the at-rule name's and out of the fixer's reach, so the warning stands and nothing is written`,
			code: `@media ,screen and (color) {}`,
			fixed: `@media ,screen and (color) {}`,
			line: 1,
			column: 8,
			message: messages.expectedBefore(),
		},
		{
			description: `a comment standing right in front of the comma`,
			code: `@media screen and (color)/*comment*/, projection and (color) {}`,
			fixed: `@media screen and (color)/*comment*/\n, projection and (color) {}`,
			line: 1,
			column: 37,
			message: messages.expectedBefore(),
		},
		{
			description: `a space between a comment and the comma, which becomes the indentation of the comma's line`,
			code: `@media screen and (color)/*comment*/ , projection and (color) {}`,
			fixed: `@media screen and (color)/*comment*/\n , projection and (color) {}`,
			line: 1,
			column: 38,
			message: messages.expectedBefore(),
		},
		{
			description: `a bare carriage return in front of the comma, which is no line break, so the break goes behind it`,
			code: `@media screen and (color)\r, projection and (color) {}`,
			fixed: `@media screen and (color)\r\n, projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.expectedBefore(),
		},
		{
			description: `three commas in a list of media types, none of them with a newline in front`,
			code: `@media tv,tv,tv,print {}`,
			fixed: `@media tv\n,tv\n,tv\n,print {}`,
			warnings: [
				{
					line: 1,
					column: 10,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 13,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 16,
					message: messages.expectedBefore(),
				},
			],
		},
		{
			// PostCSS holds `(a,[b)` as one token, opaque to the parser; a break inside makes it code, whose `[` opens a group nothing closes, so the at-rule gets no block and its params run to the end of the file, or the rule holding it is left unclosed
			description: `a media feature's parentheses holding a square bracket nothing closes, where the break is refused and the warning stands`,
			code: `@media a (a,[b) {}`,
			fixed: `@media a (a,[b) {}`,
			line: 1,
			column: 12,
			message: messages.expectedBefore(),
		},
		{
			description: `parentheses holding a brace nothing closes, which the parser reads as a group inside an at-rule's params too, refused likewise`,
			code: `@media a (a,{b) {}`,
			fixed: `@media a (a,{b) {}`,
			line: 1,
			column: 12,
			message: messages.expectedBefore(),
		},
		{
			description: `parentheses holding a square bracket closed inside them, which code reads as a group of its own, so the break is written`,
			code: `@media (a[b],c) {}`,
			fixed: `@media (a[b]\n,c) {}`,
			line: 1,
			column: 13,
			message: messages.expectedBefore(),
		},
		{
			description: `parentheses holding a brace closed inside them, so the break is written`,
			code: `@media (a{b},c) {}`,
			fixed: `@media (a{b}\n,c) {}`,
			line: 1,
			column: 13,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a multi-line list in a single-line block`,
			code: `@media screen and (color)\n, projection and (color) {}`,
		},
		{
			description: `the same list under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color)\n, projection and (color) {}`,
		},
		{
			description: `the same list under an upper-case at-rule name`,
			code: `@MEDIA screen and (color)\n, projection and (color) {}`,
		},
		{
			description: `a multi-line list written with a carriage-return line break`,
			code: `@media screen and (color)\r\n, projection and (color) {}`,
		},
		{
			description: `a multi-line list in a multi-line block`,
			code: `@media screen and (color)\n, projection and (color) {\n}`,
		},
		{
			description: `a single-line list, which this option does not measure`,
			code: `@media screen and (color),projection and (color) {}`,
		},
		{
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
			code: `@media screen and (color),projection and (color) {\n}`,
		},
		{
			description: `an at-rule whose name ends in media`,
			code: `@non-media screen and (color),projection and (color)\n, print {}`,
		},
		{
			description: `an at-rule whose name opens with media`,
			code: `@media-non screen and (color),projection and (color)\n, print {}`,
		},
	],

	reject: [
		{
			description: `the first comma of a multi-line list, with no newline in front of it`,
			code: `@media screen and (color),projection and (color)\n, print {}`,
			fixed: `@media screen and (color)\n,projection and (color)\n, print {}`,
			line: 1,
			column: 26,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `the same list under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color),projection and (color)\n, print {}`,
			fixed: `@mEdIa screen and (color)\n,projection and (color)\n, print {}`,
			line: 1,
			column: 26,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `the same list under an upper-case at-rule name`,
			code: `@MEDIA screen and (color),projection and (color)\n, print {}`,
			fixed: `@MEDIA screen and (color)\n,projection and (color)\n, print {}`,
			line: 1,
			column: 26,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `@media screen and (color),projection and (color)\r\n, print {}`,
			fixed: `@media screen and (color)\r\n,projection and (color)\r\n, print {}`,
			line: 1,
			column: 26,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `the same list in a multi-line block`,
			code: `@media screen and (color),projection and (color)\n, print {\n}`,
			fixed: `@media screen and (color)\n,projection and (color)\n, print {\n}`,
			line: 1,
			column: 26,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			// The list is multi-line by a break outside the parentheses, which PostCSS still holds as one token; a break written inside makes them code, whose `[` nothing closes
			description: `a multi-line list holding a media feature's parentheses whose square bracket nothing closes, where the break is refused and the warning stands`,
			code: `@media a (a,[b)\n,b {}`,
			fixed: `@media a (a,[b)\n,b {}`,
			line: 1,
			column: 12,
			message: messages.expectedBeforeMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			description: `a newline after the comma, which leaves nothing in front of it`,
			code: `@media screen and (color),\nprojection and (color) {}`,
		},
		{
			description: `the same list under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color),\nprojection and (color) {}`,
		},
		{
			description: `the same list under an upper-case at-rule name`,
			code: `@MEDIA screen and (color),\nprojection and (color) {}`,
		},
		{
			description: `the same list in a multi-line block`,
			code: `
				@media screen and (color),
				projection and (color) {
				}
			`,
		},
		{
			description: `the same list and block written with carriage-return line breaks`,
			code: `@media screen and (color),\r\nprojection and (color) {\r\n}`,
		},
		{
			description: `a single-line list, which this option does not measure`,
			code: `@media screen and (color) ,projection and (color) {}`,
		},
		{
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
			code: `@media screen and (color) ,projection and (color) {\n}`,
		},
		{
			description: `an at-rule whose name ends in media`,
			code: `@non-media screen and (color) ,projection and (color),\nprint {}`,
		},
		{
			description: `an at-rule whose name opens with media`,
			code: `@media-non screen and (color) ,projection and (color),\nprint {}`,
		},
	],

	reject: [
		{
			description: `a space in front of the first comma of a multi-line list`,
			code: `@media screen and (color) ,projection and (color),\nprint {}`,
			fixed: `@media screen and (color),projection and (color),\nprint {}`,
			line: 1,
			column: 27,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `the same list under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color) ,projection and (color),\nprint {}`,
			fixed: `@mEdIa screen and (color),projection and (color),\nprint {}`,
			line: 1,
			column: 27,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `the same list under an upper-case at-rule name`,
			code: `@MEDIA screen and (color) ,projection and (color),\nprint {}`,
			fixed: `@MEDIA screen and (color),projection and (color),\nprint {}`,
			line: 1,
			column: 27,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `the same list in a multi-line block`,
			code: `
				@media screen and (color) ,projection and (color),
				print {
				}
			`,
			fixed: `
				@media screen and (color),projection and (color),
				print {
				}
			`,
			line: 1,
			column: 27,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `the same list and block written with carriage-return line breaks`,
			code: `@media screen and (color) ,projection and (color),\r\nprint {\r\n}`,
			fixed: `@media screen and (color),projection and (color),\r\nprint {\r\n}`,
			line: 1,
			column: 27,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a newline and indentation in front of the first comma of a multi-line list`,
			code: `@media screen and (color)\n\t,projection and (color),\nprint {}`,
			fixed: `@media screen and (color),projection and (color),\nprint {}`,
			line: 2,
			column: 2,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})

// The space twin writes the run in front of the comma too, and the library lists it behind this rule, so its write would be the file's last (#704)
testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/media-query-list-comma-space-before": `always` },

	reject: [
		{
			// See #704
			description: `a space in front of the comma, which the twin behind this rule accepts and would take the break back from, so the warning stands and nothing is written`,
			code: `@media (a) ,(b) {}`,
			fixed: `@media (a) ,(b) {}`,
			line: 1,
			column: 12,
			message: messages.expectedBefore(),
		},
	],
})
