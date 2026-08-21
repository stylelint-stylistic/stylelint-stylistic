import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a { color: pink; }`,
			description: `a single block, with nothing behind its closing brace`,
		},
		{
			code: `a { color: pink; } b { color: red; }`,
			description: `a space between two blocks`,
		},
		{
			code: `a { color: pink;} b { color: red;}`,
			description: `the same pair with no space inside the braces`,
		},
		{
			code: `@media print { a { color: pink; } b { color: red; } }`,
			description: `a space between two nested blocks`,
		},
		{
			code: `@media print { a { color: pink; } } @media screen { b { color: red; } }`,
			description: `a space between two at-rules`,
		},
		{
			code: `@import 'foo.css';\n@import 'bar.css';`,
			description: `two at-rules holding no block at all, so no brace to space from`,
		},
		{
			code: `@media print { a { color: pink; } b { color: red; }}`,
			description: `a nested block whose brace stands last, with nothing behind it to space from`,
		},
		{
			code: `@media print { a { color: pink; }} @media screen { b { color: red; }}`,
			description: `a space between two at-rules whose inner braces stand last`,
		},
		{
			code: `.a {} /* stylelint-disable-line block-no-empty */`,
			description: `a comment behind the brace, standing where the space is asked for`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }b { color: red; }`,
			description: `a second block abutting the brace`,
			message: messages.expectedAfter(),
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; }  b { color: red; }`,
			description: `two spaces where one belongs`,
			message: messages.expectedAfter(),
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; }\nb { color: red; }`,
			description: `a break where the space belongs`,
			message: messages.expectedAfter(),
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; }\r\nb { color: red; }`,
			description: `the same break spelled with a carriage return`,
			message: messages.expectedAfter(),
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; }\tb { color: red; }`,
			description: `a tab where the space belongs`,
			message: messages.expectedAfter(),
			line: 1,
			column: 19,
		},
		{
			code: `@media print { a { color: pink; }b { color: red; }}`,
			description: `two nested blocks abutting one another`,
			message: messages.expectedAfter(),
			line: 1,
			column: 34,
		},
		{
			code: `@media print { a { color: pink; }}@media screen { b { color: red; }}`,
			description: `two at-rules abutting one another`,
			message: messages.expectedAfter(),
			line: 1,
			column: 35,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `a { color: pink; }`,
			description: `a single block, with nothing behind its closing brace`,
		},
		{
			code: `a { color: pink; }b { color: red; }`,
			description: `two blocks abutting one another`,
		},
		{
			code: `a { color: pink;}b { color: red;}`,
			description: `the same pair with no space inside the braces`,
		},
		{
			code: `@media print { a { color: pink; }b { color: red; } }`,
			description: `two nested blocks abutting one another`,
		},
		{
			code: `@media print { a { color: pink; } }@media screen { b { color: red; } }`,
			description: `two at-rules abutting one another`,
		},
	],

	reject: [
		{
			code: `a { color: pink; } b { color: red; }`,
			description: `a space between two blocks`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; }  b { color: red; }`,
			description: `two spaces between two blocks`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; }\nb { color: red; }`,
			description: `a break between two blocks`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; }\r\nb { color: red; }`,
			description: `the same break spelled with a carriage return`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; }\tb { color: red; }`,
			description: `a tab between two blocks`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 19,
		},
		{
			code: `@media print { a { color: pink; } b { color: red; }}`,
			description: `a space between two nested blocks`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 34,
		},
		{
			code: `@media print { a { color: pink; }} @media screen { b { color: red; }}`,
			description: `a space between two at-rules`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 35,
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			code: `a { color: pink; background: orange; }`,
			description: `a single-line block, with nothing behind its closing brace`,
		},
		{
			code: `a { color: pink; background: orange; } b { color: red; }`,
			description: `a space behind a single-line block`,
		},
		{
			code: `a { color: pink; background: orange;} b { color: red;}`,
			description: `the same pair with no space inside the braces`,
		},
		{
			code: `a { color:\npink;}`,
			description: `a multi-line block, which this option passes over`,
		},
		{
			code: `a { color:\r\npink;}`,
			description: `the same block spelled with a carriage return`,
		},
		{
			code: `a { color:\npink;}b { color: red; }`,
			description: `a multi-line block abutting the block behind it`,
		},
		{
			code: `a { color:\npink;}b { color:\nred;}`,
			description: `two multi-line blocks abutting one another`,
		},
		{
			code: `@media print { a {\ncolor: pink; } b { color: red;}}`,
			description: `a space behind a nested multi-line block`,
		},
		{
			code: `@media print { a {\ncolor: pink; }} @media screen { b { color: red;}}`,
			description: `a space between two at-rules, the first holding a multi-line block`,
		},
		{
			code: `@media print { a {\r\ncolor: pink; }} @media screen { b { color: red;}}`,
			description: `the same pair spelled with a carriage return`,
		},
	],

	reject: [
		{
			code: `a { color: pink; background: orange;}b { color: red; }`,
			description: `a single-line block abutting the block behind it`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 38,
		},
		{
			code: `a { color: pink; background: orange;}  b { color: red; }`,
			description: `two spaces behind a single-line block`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 38,
		},
		{
			code: `a { color: pink; background: orange;}\tb { color: red; }`,
			description: `a tab behind a single-line block`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 38,
		},
		{
			code: `@media print { a { color: pink; }b { color: red; }}`,
			description: `two nested single-line blocks abutting one another`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 34,
		},
		{
			code: `@media print { a { color: pink; }}@media screen { b { color: red; }}`,
			description: `two at-rules holding single-line blocks, abutting one another`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 35,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			code: `a { color: pink; background: orange; }`,
			description: `a single-line block, with nothing behind its closing brace`,
		},
		{
			code: `a { color: pink; background: orange; }b { color: red; }`,
			description: `a single-line block abutting the block behind it`,
		},
		{
			code: `a { color: pink; background: orange;}b { color: red;}`,
			description: `the same pair with no space inside the braces`,
		},
		{
			code: `a { color:\npink;}`,
			description: `a multi-line block, which this option passes over`,
		},
		{
			code: `a { color:\r\npink;}`,
			description: `the same block spelled with a carriage return`,
		},
		{
			code: `a { color:\npink;} b { color: red; }`,
			description: `a space behind a multi-line block`,
		},
		{
			code: `a { color:\npink;} b { color:\nred;}`,
			description: `a space between two multi-line blocks`,
		},
		{
			code: `@media print { a {\ncolor: pink;} b { color: red;} }`,
			description: `a space behind a nested multi-line block`,
		},
		{
			code: `@media print { a {\r\ncolor: pink;} b { color: red;} }`,
			description: `the same pair spelled with a carriage return`,
		},
		{
			code: `@media print { a {\ncolor: pink;} } @media screen { b { color: red;} }`,
			description: `a space between two at-rules, the first holding a multi-line block`,
		},
	],

	reject: [
		{
			code: `a { color: pink; background: orange;} b { color: red; }`,
			description: `a space behind a single-line block`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 38,
		},
		{
			code: `a { color: pink; background: orange;}  b { color: red; }`,
			description: `two spaces behind a single-line block`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 38,
		},
		{
			code: `a { color: pink; background: orange;}\tb { color: red; }`,
			description: `a tab behind a single-line block`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 38,
		},
		{
			code: `@media print { a { color: pink; } b { color: red; }}`,
			description: `a space between two nested single-line blocks`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 34,
		},
		{
			code: `@media print { a { color: pink; }} @media screen { b { color: red; }}`,
			description: `a space between two at-rules holding single-line blocks`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 35,
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			code: `a { color: pink;\nbackground: orange; }`,
			description: `a multi-line block, with nothing behind its closing brace`,
		},
		{
			code: `a { color: pink;\r\nbackground: orange; }`,
			description: `the same block spelled with a carriage return`,
		},
		{
			code: `a { color: pink;\nbackground: orange; } b { color: red; }`,
			description: `a space behind a multi-line block`,
		},
		{
			code: `a { color: pink;\nbackground: orange;} b { color: red;}`,
			description: `the same pair with no space inside the braces`,
		},
		{
			code: `a { color: pink; }`,
			description: `a single-line block, which this option passes over`,
		},
		{
			code: `a { color: pink; }b { color: red; }`,
			description: `a single-line block abutting the block behind it`,
		},
		{
			code: `a { color: pink;}b { color: red;}`,
			description: `the same pair with no space inside the braces`,
		},
		{
			code: `@media print { a {\ncolor: pink; } b { color: red; }}`,
			description: `a space behind a nested multi-line block`,
		},
		{
			code: `@media print { a {\r\ncolor: pink; } b { color: red; }}`,
			description: `the same pair spelled with a carriage return`,
		},
		{
			code: `@media print { a {\ncolor: pink; }} @media screen { b { color: red; }}`,
			description: `a space between two at-rules, the first holding a multi-line block`,
		},
	],

	reject: [
		{
			code: `a { color: pink;\nbackground: orange;}b { color: red; }`,
			description: `a multi-line block abutting the block behind it`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 21,
		},
		{
			code: `a { color: pink;\nbackground: orange;}  b { color: red; }`,
			description: `two spaces behind a multi-line block`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 21,
		},
		{
			code: `a { color: pink;\nbackground: orange;}\nb { color: red; }`,
			description: `a break behind a multi-line block`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 21,
		},
		{
			code: `a { color: pink;\r\nbackground: orange;}\r\nb { color: red; }`,
			description: `the same break spelled with a carriage return`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 21,
		},
		{
			code: `a { color: pink;\nbackground: orange;}\tb { color: red; }`,
			description: `a tab behind a multi-line block`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 21,
		},
		{
			code: `@media print { a {\ncolor: pink; }b { color: red; }}`,
			description: `two nested blocks abutting one another, the first multi-line`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 15,
		},
		{
			code: `@media print { a {\ncolor: pink; }}@media screen { b {\ncolor: red; }}`,
			description: `two at-rules abutting one another, each holding a multi-line block`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 16,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			code: `a { color: pink;\nbackground: orange; }`,
			description: `a multi-line block, with nothing behind its closing brace`,
		},
		{
			code: `a { color: pink;\r\nbackground: orange; }`,
			description: `the same block spelled with a carriage return`,
		},
		{
			code: `a { color: pink;\nbackground: orange; }b { color: red; }`,
			description: `a multi-line block abutting the block behind it`,
		},
		{
			code: `a { color: pink;\nbackground: orange;}b { color: red;}`,
			description: `the same pair with no space inside the braces`,
		},
		{
			code: `a { color: pink; }`,
			description: `a single-line block, which this option passes over`,
		},
		{
			code: `a { color: pink; } b { color: red; }`,
			description: `a space behind a single-line block`,
		},
		{
			code: `a { color: pink;} b { color: red;}`,
			description: `the same pair with no space inside the braces`,
		},
		{
			code: `@media print { a {\ncolor: pink; }b { color: red; } }`,
			description: `a nested multi-line block abutting the block behind it`,
		},
		{
			code: `@media print { a {\r\ncolor: pink; }b { color: red; } }`,
			description: `the same pair spelled with a carriage return`,
		},
		{
			code: `@media print { a {\ncolor: pink; }}@media screen { b { color: red; } }`,
			description: `two at-rules abutting one another, the first holding a multi-line block`,
		},
	],

	reject: [
		{
			code: `a { color: pink;\nbackground: orange;} b { color: red; }`,
			description: `a space behind a multi-line block`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 21,
		},
		{
			code: `a { color: pink;\nbackground: orange;}  b { color: red; }`,
			description: `two spaces behind a multi-line block`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 21,
		},
		{
			code: `a { color: pink;\nbackground: orange;}\nb { color: red; }`,
			description: `a break behind a multi-line block`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 21,
		},
		{
			code: `a { color: pink;\nbackground: orange;}\tb { color: red; }`,
			description: `a tab behind a multi-line block`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 21,
		},
		{
			code: `@media print { a {\ncolor: pink; } b { color: red; }}`,
			description: `a space between two nested blocks, the first multi-line`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 15,
		},
		{
			code: `@media print { a {\ncolor: pink; }} @media screen { b {\ncolor: red; }}`,
			description: `a space between two at-rules, each holding a multi-line block`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 16,
		},
		{
			code: `@media print { a {\r\ncolor: pink; }} @media screen { b {\r\ncolor: red; }}`,
			description: `the same pair spelled with carriage returns`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 16,
		},
	],
})
