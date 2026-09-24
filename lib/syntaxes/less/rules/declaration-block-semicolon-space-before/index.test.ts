import { createRule } from "../../../../rules/declaration-block-semicolon-space-before/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `a call named with a code point of an identifier that lies outside ASCII, whose double slashes open a comment the semicolon cannot join`,
			code: `a { b: éurl(http://a/b.png) 1px; c: 2px }`,
			fixed: `a { b: éurl(http://a/b.png) 1px; c: 2px }`,
			line: 1,
			column: 31,
			message: messages.expectedBefore(),
		},
		{
			description: `inline comment before the semicolon: the semicolon cannot join the comment's line, so the code is left alone and the warning stands`,
			code: `
				a {
					color: red // keep me
					;
				}
			`,
			fixed: `
				a {
					color: red // keep me
					;
				}
			`,
			line: 3,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `inline comment in front of the flag: the space goes behind the flag, and the comment stays where it is`,
			code: `
				a {
					color: red // keep me
						!important;
				}
			`,
			fixed: `
				a {
					color: red // keep me
						!important ;
				}
			`,
			line: 3,
			column: 12,
			message: messages.expectedBefore(),
		},
		{
			description: `a flag standing in the text of the comment, which Less reads as comment text while the parser reads it as the flag — the value and the flag's raw together show the comment running on to the semicolon`,
			code: `
				a {
					color: red // c !important
					;
				}
			`,
			fixed: `
				a {
					color: red // c !important
					;
				}
			`,
			line: 3,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `the same flag with the semicolon already standing on the comment's line, which the parser keeps no raw of, so the value alone shows the comment`,
			code: `
				a {
					color: red // c !important;
				}
			`,
			fixed: `
				a {
					color: red // c !important;
				}
			`,
			line: 2,
			column: 27,
			message: messages.expectedBefore(),
		},
		{
			description: `a form feed inside an inline comment, which is whitespace and no line break, so the semicolon stands in the comment's text and the value is left alone`,
			code: `a { b: 1px // c\f\t2px; }`,
			fixed: `a { b: 1px // c\f\t2px; }`,
			line: 1,
			column: 20,
			message: messages.expectedBefore(),
		},
		{
			// A solidus glued to the name makes the tokenizer read the parentheses as code, so the double slash inside the block comment opens nothing
			description: `a block comment holding a parenthesis and a double slash inside an address whose name a solidus is glued to`,
			code: `a { b: x /url(a/* ) // */) 1px; }`,
			fixed: `a { b: x /url(a/* ) // */) 1px ; }`,
			line: 1,
			column: 30,
			message: messages.expectedBefore(),
		},
		{
			// A dollar sign glued to the name leaves a call to the tokenizer and to the value parser alike, as a letter would
			description: `a double slash inside the parentheses of a call whose name a dollar sign is glued to, which opens a comment running past the semicolon`,
			code: `a { b: $url(a // ) 1px; }`,
			fixed: `a { b: $url(a // ) 1px; }`,
			line: 1,
			column: 22,
			message: messages.expectedBefore(),
		},
	],
})
testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `inline comment before the semicolon: the semicolon cannot join the comment's line, so the code is left alone and the warning stands`,
			code: `
				a {
					color: red // keep me
					;
				}
			`,
			fixed: `
				a {
					color: red // keep me
					;
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			// A string inside parentheses whose comments are read hides the comment delimiter it holds, so the comment behind the call stays one the semicolon cannot join
			description: `a comment behind an address whose string holds the opening delimiter of a block comment`,
			code: `
				a {
					b: url( a "/*") // c
					;
				}
			`,
			fixed: `
				a {
					b: url( a "/*") // c
					;
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `a flag standing in the text of the comment, which Less reads as comment text while the parser reads it as the flag — the value and the flag's raw together show the comment running on to the semicolon`,
			code: `
				a {
					color: red // c !important
					;
				}
			`,
			fixed: `
				a {
					color: red // c !important
					;
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedBefore(),
		},
	],
})
