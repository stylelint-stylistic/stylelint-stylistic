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
			code: `a { color: pink; }\nb { color: red; }`,
			description: `a break behind the brace`,
		},
		{
			code: `a { color: pink; }\r\nb { color: red; }`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `a { color: pink; }\n\nb { color: red; }`,
			description: `an empty line behind the brace, which is a break all the same`,
		},
		{
			code: `a { color: pink; }\r\n\r\nb { color: red; }`,
			description: `the same empty line spelled with carriage returns`,
		},
		{
			code: `a { color: pink;}\n\t\tb { color: red;}`,
			description: `indentation behind the break`,
		},
		{
			code: `a { color: pink;}\r\n\t\tb { color: red;}`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `a { @extend foo; color: pink; }`,
			description: `a nested at-rule with no block of its own, and so no brace for this rule to follow`,
		},
		{
			code: `a { @extend foo; /* comment */\ncolor: pink;  }`,
			description: `a comment behind a nested at-rule, with the break behind the comment`,
		},
		{
			code: `@media print { a { color: pink; }\nb { color: red; }}`,
			description: `a break behind the brace of a nested block`,
		},
		{
			code: `@media print { a { color: pink; }}\n@media screen { b { color: red; }}`,
			description: `a break between two at-rules, each holding a block`,
		},
		{
			code: `.a {} /* comment */`,
			description: `an end-of-line comment behind the brace, which is allowed to stand there`,
		},
		{
			code: `.a {} /* comment */\n b {}`,
			description: `an end-of-line comment with the break behind it`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/204
			code: `a { color: pink; }  \rb { color: red; }`,
			fixed: `a { color: pink; }\rb { color: red; }`,
			description: `spaces in front of a bare carriage return, which the fix trims up to the break rather than writing a line feed in front of them`,
			message: messages.expectedAfter(),
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; }  \fb { color: red; }`,
			fixed: `a { color: pink; }\fb { color: red; }`,
			description: `spaces in front of a form feed, which ends a line to every syntax this plugin reads through`,
			message: messages.expectedAfter(),
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; } /* c\r d */b { color: red; }`,
			fixed: `a { color: pink; }\n /* c\r d */b { color: red; }`,
			description: `a comment broken by a bare carriage return, which is no end-of-line comment, so the break goes in front of it as it does for a line feed`,
			message: messages.expectedAfter(),
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; }b { color: red; }`,
			fixed: `a { color: pink; }\nb { color: red; }`,
			description: `nothing at all behind the brace`,
			message: messages.expectedAfter(),
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; } b { color: red; }`,
			fixed: `a { color: pink; }\n b { color: red; }`,
			description: `a space behind the brace`,
			message: messages.expectedAfter(),
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; }  b { color: red; }`,
			fixed: `a { color: pink; }\n  b { color: red; }`,
			description: `two spaces behind the brace`,
			message: messages.expectedAfter(),
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; }\tb { color: red; }`,
			fixed: `a { color: pink; }\n\tb { color: red; }`,
			description: `a tab behind the brace`,
			message: messages.expectedAfter(),
			line: 1,
			column: 19,
		},
		{
			code: `@media print { a { color: pink; } b { color: red; }}`,
			fixed: `@media print { a { color: pink; }\n b { color: red; }}`,
			description: `a space between two nested blocks`,
			message: messages.expectedAfter(),
			line: 1,
			column: 34,
		},
		{
			code: `@media print { a { color: pink; }} @media screen { b { color: red; }}`,
			fixed: `@media print { a { color: pink; }}\n @media screen { b { color: red; }}`,
			description: `a space between two at-rules`,
			message: messages.expectedAfter(),
			line: 1,
			column: 35,
		},
		{
			code: `.a {} /* comment */ b {}`,
			fixed: `.a {} /* comment */\n b {}`,
			description: `a comment behind the brace and a rule behind the comment, all on one line`,
			message: messages.expectedAfter(),
			line: 1,
			column: 6,
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignoreAtRules: [`if`, `else`] }],

	accept: [
		{
			code: `a { color: pink; }\nb {}`,
			description: `a break behind the brace, which the ignored at-rules have nothing to do with`,
		},
		{
			code: `@if ... { color: pink; } @else {}`,
			description: `an @else abutting the brace of the @if it belongs to, both named in the option`,
		},
		{
			code: `@if ... { color: pink; } @else if {} else {}`,
			description: `a chain of @else, each abutting the brace in front of it`,
		},
		{
			code: `@if ... {\r\n  color: pink; \n} @else if {\n  color: pink;\n} else {}`,
			description: `the same chain broken across lines, with both kinds of break in it`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }b{}`,
			fixed: `a { color: pink; }\nb{}`,
			description: `a rule abutting a brace, with no ignored at-rule anywhere near it`,
			message: messages.expectedAfter(),
			line: 1,
			column: 19,
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignoreAtRules: `/if/` }],

	accept: [
		{
			code: `a { color: pink; }\nb {}`,
			description: `a break behind the brace, which the pattern has nothing to do with`,
		},
		{
			code: `@if ... { color: pink; } @else {}`,
			description: `an @else abutting the brace, matched by the pattern`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }b{}`,
			fixed: `a { color: pink; }\nb{}`,
			description: `a rule abutting a brace, which the pattern does not match`,
			message: messages.expectedAfter(),
			line: 1,
			column: 19,
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			code: `a { color: pink; }`,
			description: `a single-line block with nothing behind it`,
		},
		{
			code: `a { color: pink; }\nb { color: red; }`,
			description: `a break behind a single-line block`,
		},
		{
			code: `a { color: pink; }\r\nb { color: red; }`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `a { color: pink;}\n\t\tb { color: red;}`,
			description: `indentation behind the break`,
		},
		{
			code: `a { color: pink;}\r\n\t\tb { color: red;}`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `@media print { a { color: pink; }\nb { color: red; }}`,
			description: `a break behind a nested single-line block`,
		},
		{
			code: `@media print { a { color: pink; }}\n@media screen { b { color: red; }}`,
			description: `a break between two at-rules`,
		},
		{
			code: `a { color: pink;\ntop: 0; }b { color: red; }`,
			description: `a multi-line block, which this option passes over`,
		},
		{
			code: `a { color: pink;\ntop: 0;}b { color: red;}`,
			description: `a multi-line block abutting the rule behind it`,
		},
		{
			code: `a { color: pink;\r\ntop: 0;}b { color: red;}`,
			description: `the same pair spelled with carriage returns`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }b { color: red; }`,
			fixed: `a { color: pink; }\nb { color: red; }`,
			description: `a single-line block abutting the rule behind it`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; } b { color: red; }`,
			fixed: `a { color: pink; }\n b { color: red; }`,
			description: `a space behind a single-line block`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; }  b { color: red; }`,
			fixed: `a { color: pink; }\n  b { color: red; }`,
			description: `two spaces behind a single-line block`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; }\tb { color: red; }`,
			fixed: `a { color: pink; }\n\tb { color: red; }`,
			description: `a tab behind a single-line block`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 19,
		},
		{
			code: `@media print { a { color: pink; } b { color: red; }}`,
			fixed: `@media print { a { color: pink; }\n b { color: red; }}`,
			description: `a space between two nested single-line blocks`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 34,
		},
		{
			code: `@media print { a { color: pink; }} @media screen { b { color: red; }}`,
			fixed: `@media print { a { color: pink; }}\n @media screen { b { color: red; }}`,
			description: `a space between two at-rules, each holding a single-line block`,
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
			code: `a { color: pink; }`,
			description: `a single-line block with nothing behind it`,
		},
		{
			code: `a { color: pink; }b { color: red; }`,
			description: `a single-line block abutting the rule behind it`,
		},
		{
			code: `a { color: pink;}b { color: red;}`,
			description: `the same pair with no space inside the braces`,
		},
		{
			code: `@media print { a { color: pink; }b { color: red; }}`,
			description: `nested single-line blocks abutting one another`,
		},
		{
			code: `@media print { a { color: pink; }}@media screen { b { color: red; }}`,
			description: `two at-rules abutting one another`,
		},
		{
			code: `a { color: pink;\ntop: 0; }\nb { color: red; }`,
			description: `a multi-line block, which this option passes over`,
		},
		{
			code: `a { color: pink;\ntop: 0;} b { color: red;}`,
			description: `a space behind a multi-line block`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }\nb { color: red; }`,
			fixed: `a { color: pink; }b { color: red; }`,
			description: `a break behind a single-line block`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; } b { color: red; }`,
			fixed: `a { color: pink; }b { color: red; }`,
			description: `a space behind a single-line block`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; }  b { color: red; }`,
			fixed: `a { color: pink; }b { color: red; }`,
			description: `two spaces behind a single-line block`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; }\tb { color: red; }`,
			fixed: `a { color: pink; }b { color: red; }`,
			description: `a tab behind a single-line block`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 19,
		},
		{
			code: `@media print { a { color: pink; }\nb { color: red; }}`,
			fixed: `@media print { a { color: pink; }b { color: red; }}`,
			description: `a break between two nested single-line blocks`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 34,
		},
		{
			code: `@media print { a { color: pink; }}\n @media screen { b { color: red; }}`,
			fixed: `@media print { a { color: pink; }}@media screen { b { color: red; }}`,
			description: `a break and a space between two at-rules`,
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
			code: `a { color: pink;\ntop: 0; }`,
			description: `a multi-line block with nothing behind it`,
		},
		{
			code: `a { color: pink;\ntop: 0; }\nb { color: red; }`,
			description: `a break behind a multi-line block`,
		},
		{
			code: `a { color: pink;\r\ntop: 0; }\r\nb { color: red; }`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `a { color: pink;\ntop: 0;}\n\t\tb { color: red;}`,
			description: `indentation behind the break`,
		},
		{
			code: `@media print { a {\ncolor: pink; }\nb { color: red; }}`,
			description: `a break behind a nested multi-line block`,
		},
		{
			code: `@media print { a {\ncolor: pink; }}\n@media screen { b { color: red; }}`,
			description: `a break between two at-rules, the first holding a multi-line block`,
		},
		{
			code: `a { color: pink; }\nb { color: red; }`,
			description: `a single-line block, which this option passes over`,
		},
		{
			code: `a { color: pink; }b { color: red;}`,
			description: `a single-line block abutting the rule behind it`,
		},
	],

	reject: [
		{
			code: `a { color: pink;\ntop: 0; }b { color: red; }`,
			fixed: `a { color: pink;\ntop: 0; }\nb { color: red; }`,
			description: `a multi-line block abutting the rule behind it`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 10,
		},
		{
			code: `a { color: pink;\r\ntop: 0; }b { color: red; }`,
			fixed: `a { color: pink;\r\ntop: 0; }\r\nb { color: red; }`,
			description: `the same pair spelled with carriage returns`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 10,
		},
		{
			code: `a { color: pink;\ntop: 0; } b { color: red; }`,
			fixed: `a { color: pink;\ntop: 0; }\n b { color: red; }`,
			description: `a space behind a multi-line block`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 10,
		},
		{
			code: `a { color: pink;\ntop: 0; }  b { color: red; }`,
			fixed: `a { color: pink;\ntop: 0; }\n  b { color: red; }`,
			description: `two spaces behind a multi-line block`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 10,
		},
		{
			code: `a { color: pink;\ntop: 0; }\tb { color: red; }`,
			fixed: `a { color: pink;\ntop: 0; }\n\tb { color: red; }`,
			description: `a tab behind a multi-line block`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 10,
		},
		{
			code: `@media print { a {\ncolor: pink; } b { color: red; }}`,
			fixed: `@media print { a {\ncolor: pink; }\n b { color: red; }}`,
			description: `a space behind a nested multi-line block`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 15,
		},
		{
			code: `@media print { a {\ncolor: pink; }} @media screen { b {\ncolor: red; }}`,
			fixed: `@media print { a {\ncolor: pink; }}\n @media screen { b {\ncolor: red; }}`,
			description: `a space between two at-rules, each holding a multi-line block`,
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
			code: `a { color: pink;\ntop: 0; }`,
			description: `a multi-line block with nothing behind it`,
		},
		{
			code: `a { color: pink;\ntop: 0; }b { color: red; }`,
			description: `a multi-line block abutting the rule behind it`,
		},
		{
			code: `a { color: pink;\ntop: 0;}b { color: red;}`,
			description: `the same pair with no space inside the braces`,
		},
		{
			code: `a { color: pink;\r\ntop: 0;}b { color: red;}`,
			description: `the same pair spelled with carriage returns`,
		},
		{
			code: `@media print { a {\ncolor: pink; }b { color: red; }}`,
			description: `nested multi-line blocks abutting one another`,
		},
		{
			code: `@media print { a {\ncolor: pink; }}@media screen { b { color: red; }}`,
			description: `two at-rules abutting one another`,
		},
		{
			code: `@media print { a {\r\ncolor: pink; }}@media screen { b { color: red; }}`,
			description: `the same pair spelled with a carriage return`,
		},
		{
			code: `a { color: pink; }\nb { color: red; }`,
			description: `a single-line block, which this option passes over`,
		},
		{
			code: `a { color: pink; }\r\nb { color: red; }`,
			description: `the same block spelled with a carriage return`,
		},
		{
			code: `a { color: pink;} b { color: red;}`,
			description: `a space behind a single-line block`,
		},
	],

	reject: [
		{
			code: `a { color: pink;\ntop: 0; }\nb { color: red; }`,
			fixed: `a { color: pink;\ntop: 0; }b { color: red; }`,
			description: `a break behind a multi-line block`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 10,
		},
		{
			code: `a { color: pink;\r\ntop: 0; }\r\nb { color: red; }`,
			fixed: `a { color: pink;\r\ntop: 0; }b { color: red; }`,
			description: `the same break spelled with carriage returns`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 10,
		},
		{
			code: `a { color: pink;\ntop: 0; } b { color: red; }`,
			fixed: `a { color: pink;\ntop: 0; }b { color: red; }`,
			description: `a space behind a multi-line block`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 10,
		},
		{
			code: `a { color: pink;\ntop: 0; }  b { color: red; }`,
			fixed: `a { color: pink;\ntop: 0; }b { color: red; }`,
			description: `two spaces behind a multi-line block`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 10,
		},
		{
			code: `a { color: pink;\ntop: 0; }\tb { color: red; }`,
			fixed: `a { color: pink;\ntop: 0; }b { color: red; }`,
			description: `a tab behind a multi-line block`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 10,
		},
		{
			code: `@media print { a {\ncolor: pink; }\nb { color: red; }}`,
			fixed: `@media print { a {\ncolor: pink; }b { color: red; }}`,
			description: `a break behind a nested multi-line block`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 15,
		},
		{
			code: `@media print { a {\ncolor: pink; }}\n@media screen { b {\ncolor: red; }}`,
			fixed: `@media print { a {\ncolor: pink; }}@media screen { b {\ncolor: red; }}`,
			description: `a break between two at-rules, each holding a multi-line block`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 16,
		},
	],
})
