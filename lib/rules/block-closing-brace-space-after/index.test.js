import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a single block, with nothing behind its closing brace`,
			code: `a { color: pink; }`,
		},
		{
			description: `a space between two blocks`,
			code: `a { color: pink; } b { color: red; }`,
		},
		{
			description: `the same pair with no space inside the braces`,
			code: `a { color: pink;} b { color: red;}`,
		},
		{
			description: `a space between two nested blocks`,
			code: `@media print { a { color: pink; } b { color: red; } }`,
		},
		{
			description: `a space between two at-rules`,
			code: `@media print { a { color: pink; } } @media screen { b { color: red; } }`,
		},
		{
			description: `two at-rules holding no block at all, so no brace to space from`,
			code: `@import 'foo.css';\n@import 'bar.css';`,
		},
		{
			description: `a nested block whose brace stands last, with nothing behind it to space from`,
			code: `@media print { a { color: pink; } b { color: red; }}`,
		},
		{
			description: `a space between two at-rules whose inner braces stand last`,
			code: `@media print { a { color: pink; }} @media screen { b { color: red; }}`,
		},
		{
			description: `a comment behind the brace, standing where the space is asked for`,
			code: `.a {} /* stylelint-disable-line block-no-empty */`,
		},
	],

	reject: [
		{
			description: `a second block abutting the brace`,
			code: `a { color: pink; }b { color: red; }`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces where one belongs`,
			code: `a { color: pink; }  b { color: red; }`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(),
		},
		{
			description: `a break where the space belongs`,
			code: `a { color: pink; }\nb { color: red; }`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink; }\r\nb { color: red; }`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab where the space belongs`,
			code: `a { color: pink; }\tb { color: red; }`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(),
		},
		{
			description: `two nested blocks abutting one another`,
			code: `@media print { a { color: pink; }b { color: red; }}`,
			line: 1,
			column: 34,
			message: messages.expectedAfter(),
		},
		{
			description: `two at-rules abutting one another`,
			code: `@media print { a { color: pink; }}@media screen { b { color: red; }}`,
			line: 1,
			column: 35,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a single block, with nothing behind its closing brace`,
			code: `a { color: pink; }`,
		},
		{
			description: `two blocks abutting one another`,
			code: `a { color: pink; }b { color: red; }`,
		},
		{
			description: `the same pair with no space inside the braces`,
			code: `a { color: pink;}b { color: red;}`,
		},
		{
			description: `two nested blocks abutting one another`,
			code: `@media print { a { color: pink; }b { color: red; } }`,
		},
		{
			description: `two at-rules abutting one another`,
			code: `@media print { a { color: pink; } }@media screen { b { color: red; } }`,
		},
	],

	reject: [
		{
			description: `a space between two blocks`,
			code: `a { color: pink; } b { color: red; }`,
			line: 1,
			column: 19,
			message: messages.rejectedAfter(),
		},
		{
			description: `two spaces between two blocks`,
			code: `a { color: pink; }  b { color: red; }`,
			line: 1,
			column: 19,
			message: messages.rejectedAfter(),
		},
		{
			description: `a break between two blocks`,
			code: `a { color: pink; }\nb { color: red; }`,
			line: 1,
			column: 19,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink; }\r\nb { color: red; }`,
			line: 1,
			column: 19,
			message: messages.rejectedAfter(),
		},
		{
			description: `a tab between two blocks`,
			code: `a { color: pink; }\tb { color: red; }`,
			line: 1,
			column: 19,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space between two nested blocks`,
			code: `@media print { a { color: pink; } b { color: red; }}`,
			line: 1,
			column: 34,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space between two at-rules`,
			code: `@media print { a { color: pink; }} @media screen { b { color: red; }}`,
			line: 1,
			column: 35,
			message: messages.rejectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			description: `a single-line block, with nothing behind its closing brace`,
			code: `a { color: pink; background: orange; }`,
		},
		{
			description: `a space behind a single-line block`,
			code: `a { color: pink; background: orange; } b { color: red; }`,
		},
		{
			description: `the same pair with no space inside the braces`,
			code: `a { color: pink; background: orange;} b { color: red;}`,
		},
		{
			description: `a multi-line block, which this option passes over`,
			code: `a { color:\npink;}`,
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a { color:\r\npink;}`,
		},
		{
			description: `a multi-line block abutting the block behind it`,
			code: `a { color:\npink;}b { color: red; }`,
		},
		{
			description: `two multi-line blocks abutting one another`,
			code: `
				a { color:
				pink;}b { color:
				red;}
			`,
		},
		{
			description: `a space behind a nested multi-line block`,
			code: `@media print { a {\ncolor: pink; } b { color: red;}}`,
		},
		{
			description: `a space between two at-rules, the first holding a multi-line block`,
			code: `@media print { a {\ncolor: pink; }} @media screen { b { color: red;}}`,
		},
		{
			description: `the same pair spelled with a carriage return`,
			code: `@media print { a {\r\ncolor: pink; }} @media screen { b { color: red;}}`,
		},
	],

	reject: [
		{
			description: `a single-line block abutting the block behind it`,
			code: `a { color: pink; background: orange;}b { color: red; }`,
			line: 1,
			column: 38,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `two spaces behind a single-line block`,
			code: `a { color: pink; background: orange;}  b { color: red; }`,
			line: 1,
			column: 38,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a tab behind a single-line block`,
			code: `a { color: pink; background: orange;}\tb { color: red; }`,
			line: 1,
			column: 38,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `two nested single-line blocks abutting one another`,
			code: `@media print { a { color: pink; }b { color: red; }}`,
			line: 1,
			column: 34,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `two at-rules holding single-line blocks, abutting one another`,
			code: `@media print { a { color: pink; }}@media screen { b { color: red; }}`,
			line: 1,
			column: 35,
			message: messages.expectedAfterSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `a single-line block, with nothing behind its closing brace`,
			code: `a { color: pink; background: orange; }`,
		},
		{
			description: `a single-line block abutting the block behind it`,
			code: `a { color: pink; background: orange; }b { color: red; }`,
		},
		{
			description: `the same pair with no space inside the braces`,
			code: `a { color: pink; background: orange;}b { color: red;}`,
		},
		{
			description: `a multi-line block, which this option passes over`,
			code: `a { color:\npink;}`,
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a { color:\r\npink;}`,
		},
		{
			description: `a space behind a multi-line block`,
			code: `a { color:\npink;} b { color: red; }`,
		},
		{
			description: `a space between two multi-line blocks`,
			code: `
				a { color:
				pink;} b { color:
				red;}
			`,
		},
		{
			description: `a space behind a nested multi-line block`,
			code: `@media print { a {\ncolor: pink;} b { color: red;} }`,
		},
		{
			description: `the same pair spelled with a carriage return`,
			code: `@media print { a {\r\ncolor: pink;} b { color: red;} }`,
		},
		{
			description: `a space between two at-rules, the first holding a multi-line block`,
			code: `@media print { a {\ncolor: pink;} } @media screen { b { color: red;} }`,
		},
	],

	reject: [
		{
			description: `a space behind a single-line block`,
			code: `a { color: pink; background: orange;} b { color: red; }`,
			line: 1,
			column: 38,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `two spaces behind a single-line block`,
			code: `a { color: pink; background: orange;}  b { color: red; }`,
			line: 1,
			column: 38,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `a tab behind a single-line block`,
			code: `a { color: pink; background: orange;}\tb { color: red; }`,
			line: 1,
			column: 38,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `a space between two nested single-line blocks`,
			code: `@media print { a { color: pink; } b { color: red; }}`,
			line: 1,
			column: 34,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `a space between two at-rules holding single-line blocks`,
			code: `@media print { a { color: pink; }} @media screen { b { color: red; }}`,
			line: 1,
			column: 35,
			message: messages.rejectedAfterSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a multi-line block, with nothing behind its closing brace`,
			code: `a { color: pink;\nbackground: orange; }`,
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a { color: pink;\r\nbackground: orange; }`,
		},
		{
			description: `a space behind a multi-line block`,
			code: `a { color: pink;\nbackground: orange; } b { color: red; }`,
		},
		{
			description: `the same pair with no space inside the braces`,
			code: `a { color: pink;\nbackground: orange;} b { color: red;}`,
		},
		{
			description: `a single-line block, which this option passes over`,
			code: `a { color: pink; }`,
		},
		{
			description: `a single-line block abutting the block behind it`,
			code: `a { color: pink; }b { color: red; }`,
		},
		{
			description: `the same pair with no space inside the braces`,
			code: `a { color: pink;}b { color: red;}`,
		},
		{
			description: `a space behind a nested multi-line block`,
			code: `@media print { a {\ncolor: pink; } b { color: red; }}`,
		},
		{
			description: `the same pair spelled with a carriage return`,
			code: `@media print { a {\r\ncolor: pink; } b { color: red; }}`,
		},
		{
			description: `a space between two at-rules, the first holding a multi-line block`,
			code: `@media print { a {\ncolor: pink; }} @media screen { b { color: red; }}`,
		},
	],

	reject: [
		{
			description: `a multi-line block abutting the block behind it`,
			code: `a { color: pink;\nbackground: orange;}b { color: red; }`,
			line: 2,
			column: 21,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `two spaces behind a multi-line block`,
			code: `a { color: pink;\nbackground: orange;}  b { color: red; }`,
			line: 2,
			column: 21,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `a break behind a multi-line block`,
			code: `
				a { color: pink;
				background: orange;}
				b { color: red; }
			`,
			line: 2,
			column: 21,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink;\r\nbackground: orange;}\r\nb { color: red; }`,
			line: 2,
			column: 21,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `a tab behind a multi-line block`,
			code: `a { color: pink;\nbackground: orange;}\tb { color: red; }`,
			line: 2,
			column: 21,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `two nested blocks abutting one another, the first multi-line`,
			code: `@media print { a {\ncolor: pink; }b { color: red; }}`,
			line: 2,
			column: 15,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `two at-rules abutting one another, each holding a multi-line block`,
			code: `
				@media print { a {
				color: pink; }}@media screen { b {
				color: red; }}
			`,
			line: 2,
			column: 16,
			message: messages.expectedAfterMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			description: `a multi-line block, with nothing behind its closing brace`,
			code: `a { color: pink;\nbackground: orange; }`,
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a { color: pink;\r\nbackground: orange; }`,
		},
		{
			description: `a multi-line block abutting the block behind it`,
			code: `a { color: pink;\nbackground: orange; }b { color: red; }`,
		},
		{
			description: `the same pair with no space inside the braces`,
			code: `a { color: pink;\nbackground: orange;}b { color: red;}`,
		},
		{
			description: `a single-line block, which this option passes over`,
			code: `a { color: pink; }`,
		},
		{
			description: `a space behind a single-line block`,
			code: `a { color: pink; } b { color: red; }`,
		},
		{
			description: `the same pair with no space inside the braces`,
			code: `a { color: pink;} b { color: red;}`,
		},
		{
			description: `a nested multi-line block abutting the block behind it`,
			code: `@media print { a {\ncolor: pink; }b { color: red; } }`,
		},
		{
			description: `the same pair spelled with a carriage return`,
			code: `@media print { a {\r\ncolor: pink; }b { color: red; } }`,
		},
		{
			description: `two at-rules abutting one another, the first holding a multi-line block`,
			code: `@media print { a {\ncolor: pink; }}@media screen { b { color: red; } }`,
		},
	],

	reject: [
		{
			description: `a space behind a multi-line block`,
			code: `a { color: pink;\nbackground: orange;} b { color: red; }`,
			line: 2,
			column: 21,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `two spaces behind a multi-line block`,
			code: `a { color: pink;\nbackground: orange;}  b { color: red; }`,
			line: 2,
			column: 21,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a break behind a multi-line block`,
			code: `
				a { color: pink;
				background: orange;}
				b { color: red; }
			`,
			line: 2,
			column: 21,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a tab behind a multi-line block`,
			code: `a { color: pink;\nbackground: orange;}\tb { color: red; }`,
			line: 2,
			column: 21,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a space between two nested blocks, the first multi-line`,
			code: `@media print { a {\ncolor: pink; } b { color: red; }}`,
			line: 2,
			column: 15,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a space between two at-rules, each holding a multi-line block`,
			code: `
				@media print { a {
				color: pink; }} @media screen { b {
				color: red; }}
			`,
			line: 2,
			column: 16,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `@media print { a {\r\ncolor: pink; }} @media screen { b {\r\ncolor: red; }}`,
			line: 2,
			column: 16,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139
			description: `no space behind the closing brace of an at-rule whose parameters carry on past an inline comment, which this syntax keeps a second copy of`,
			code: `
				@media (min-width: 100px // c
					) { a { color: red; } }b { color: red; }
			`,
			fixed: `
				@media (min-width: 100px // c
					) { a { color: red; } }b { color: red; }
			`,
			line: 2,
			column: 25,
			message: messages.expectedAfter(),
		},
	],
})
