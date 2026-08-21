import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a single block, with nothing behind its closing brace`,
			code: `a { color: pink; }`,
		},
		{
			description: `a break behind the brace`,
			code: `a { color: pink; }\nb { color: red; }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink; }\r\nb { color: red; }`,
		},
		{
			description: `an empty line behind the brace, which is a break all the same`,
			code: `
				a { color: pink; }

				b { color: red; }
			`,
		},
		{
			description: `the same empty line spelled with carriage returns`,
			code: `a { color: pink; }\r\n\r\nb { color: red; }`,
		},
		{
			description: `indentation behind the break`,
			code: `a { color: pink;}\n\t\tb { color: red;}`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink;}\r\n\t\tb { color: red;}`,
		},
		{
			description: `a nested at-rule with no block of its own, and so no brace for this rule to follow`,
			code: `a { @extend foo; color: pink; }`,
		},
		{
			description: `a comment behind a nested at-rule, with the break behind the comment`,
			code: `a { @extend foo; /* comment */\ncolor: pink;  }`,
		},
		{
			description: `a break behind the brace of a nested block`,
			code: `@media print { a { color: pink; }\nb { color: red; }}`,
		},
		{
			description: `a break between two at-rules, each holding a block`,
			code: `@media print { a { color: pink; }}\n@media screen { b { color: red; }}`,
		},
		{
			description: `an end-of-line comment behind the brace, which is allowed to stand there`,
			code: `.a {} /* comment */`,
		},
		{
			description: `an end-of-line comment with the break behind it`,
			code: `.a {} /* comment */\n b {}`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/204
			description: `spaces in front of a bare carriage return, which the fix trims up to the break rather than writing a line feed in front of them`,
			code: `a { color: pink; }  \rb { color: red; }`,
			fixed: `a { color: pink; }\rb { color: red; }`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(),
		},
		{
			description: `spaces in front of a form feed, which ends a line to every syntax this plugin reads through`,
			code: `a { color: pink; }  \fb { color: red; }`,
			fixed: `a { color: pink; }\fb { color: red; }`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment broken by a bare carriage return, which is no end-of-line comment, so the break goes in front of it as it does for a line feed`,
			code: `a { color: pink; } /* c\r d */b { color: red; }`,
			fixed: `a { color: pink; }\n /* c\r d */b { color: red; }`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(),
		},
		{
			description: `nothing at all behind the brace`,
			code: `a { color: pink; }b { color: red; }`,
			fixed: `a { color: pink; }\nb { color: red; }`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(),
		},
		{
			description: `a space behind the brace`,
			code: `a { color: pink; } b { color: red; }`,
			fixed: `a { color: pink; }\n b { color: red; }`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces behind the brace`,
			code: `a { color: pink; }  b { color: red; }`,
			fixed: `a { color: pink; }\n  b { color: red; }`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab behind the brace`,
			code: `a { color: pink; }\tb { color: red; }`,
			fixed: `a { color: pink; }\n\tb { color: red; }`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(),
		},
		{
			description: `a space between two nested blocks`,
			code: `@media print { a { color: pink; } b { color: red; }}`,
			fixed: `@media print { a { color: pink; }\n b { color: red; }}`,
			line: 1,
			column: 34,
			message: messages.expectedAfter(),
		},
		{
			description: `a space between two at-rules`,
			code: `@media print { a { color: pink; }} @media screen { b { color: red; }}`,
			fixed: `@media print { a { color: pink; }}\n @media screen { b { color: red; }}`,
			line: 1,
			column: 35,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment behind the brace and a rule behind the comment, all on one line`,
			code: `.a {} /* comment */ b {}`,
			fixed: `.a {} /* comment */\n b {}`,
			line: 1,
			column: 6,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignoreAtRules: [`if`, `else`] }],

	accept: [
		{
			description: `a break behind the brace, which the ignored at-rules have nothing to do with`,
			code: `a { color: pink; }\nb {}`,
		},
		{
			description: `an @else abutting the brace of the @if it belongs to, both named in the option`,
			code: `@if ... { color: pink; } @else {}`,
		},
		{
			description: `a chain of @else, each abutting the brace in front of it`,
			code: `@if ... { color: pink; } @else if {} else {}`,
		},
		{
			description: `the same chain broken across lines, with both kinds of break in it`,
			code: `@if ... {\r\n  color: pink; \n} @else if {\n  color: pink;\n} else {}`,
		},
	],

	reject: [
		{
			description: `a rule abutting a brace, with no ignored at-rule anywhere near it`,
			code: `a { color: pink; }b{}`,
			fixed: `a { color: pink; }\nb{}`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignoreAtRules: `/if/` }],

	accept: [
		{
			description: `a break behind the brace, which the pattern has nothing to do with`,
			code: `a { color: pink; }\nb {}`,
		},
		{
			description: `an @else abutting the brace, matched by the pattern`,
			code: `@if ... { color: pink; } @else {}`,
		},
	],

	reject: [
		{
			description: `a rule abutting a brace, which the pattern does not match`,
			code: `a { color: pink; }b{}`,
			fixed: `a { color: pink; }\nb{}`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			description: `a single-line block with nothing behind it`,
			code: `a { color: pink; }`,
		},
		{
			description: `a break behind a single-line block`,
			code: `a { color: pink; }\nb { color: red; }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink; }\r\nb { color: red; }`,
		},
		{
			description: `indentation behind the break`,
			code: `a { color: pink;}\n\t\tb { color: red;}`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink;}\r\n\t\tb { color: red;}`,
		},
		{
			description: `a break behind a nested single-line block`,
			code: `@media print { a { color: pink; }\nb { color: red; }}`,
		},
		{
			description: `a break between two at-rules`,
			code: `@media print { a { color: pink; }}\n@media screen { b { color: red; }}`,
		},
		{
			description: `a multi-line block, which this option passes over`,
			code: `a { color: pink;\ntop: 0; }b { color: red; }`,
		},
		{
			description: `a multi-line block abutting the rule behind it`,
			code: `a { color: pink;\ntop: 0;}b { color: red;}`,
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `a { color: pink;\r\ntop: 0;}b { color: red;}`,
		},
	],

	reject: [
		{
			description: `a single-line block abutting the rule behind it`,
			code: `a { color: pink; }b { color: red; }`,
			fixed: `a { color: pink; }\nb { color: red; }`,
			line: 1,
			column: 19,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a space behind a single-line block`,
			code: `a { color: pink; } b { color: red; }`,
			fixed: `a { color: pink; }\n b { color: red; }`,
			line: 1,
			column: 19,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `two spaces behind a single-line block`,
			code: `a { color: pink; }  b { color: red; }`,
			fixed: `a { color: pink; }\n  b { color: red; }`,
			line: 1,
			column: 19,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a tab behind a single-line block`,
			code: `a { color: pink; }\tb { color: red; }`,
			fixed: `a { color: pink; }\n\tb { color: red; }`,
			line: 1,
			column: 19,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a space between two nested single-line blocks`,
			code: `@media print { a { color: pink; } b { color: red; }}`,
			fixed: `@media print { a { color: pink; }\n b { color: red; }}`,
			line: 1,
			column: 34,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a space between two at-rules, each holding a single-line block`,
			code: `@media print { a { color: pink; }} @media screen { b { color: red; }}`,
			fixed: `@media print { a { color: pink; }}\n @media screen { b { color: red; }}`,
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
			description: `a single-line block with nothing behind it`,
			code: `a { color: pink; }`,
		},
		{
			description: `a single-line block abutting the rule behind it`,
			code: `a { color: pink; }b { color: red; }`,
		},
		{
			description: `the same pair with no space inside the braces`,
			code: `a { color: pink;}b { color: red;}`,
		},
		{
			description: `nested single-line blocks abutting one another`,
			code: `@media print { a { color: pink; }b { color: red; }}`,
		},
		{
			description: `two at-rules abutting one another`,
			code: `@media print { a { color: pink; }}@media screen { b { color: red; }}`,
		},
		{
			description: `a multi-line block, which this option passes over`,
			code: `
				a { color: pink;
				top: 0; }
				b { color: red; }
			`,
		},
		{
			description: `a space behind a multi-line block`,
			code: `a { color: pink;\ntop: 0;} b { color: red;}`,
		},
	],

	reject: [
		{
			description: `a break behind a single-line block`,
			code: `a { color: pink; }\nb { color: red; }`,
			fixed: `a { color: pink; }b { color: red; }`,
			line: 1,
			column: 19,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `a space behind a single-line block`,
			code: `a { color: pink; } b { color: red; }`,
			fixed: `a { color: pink; }b { color: red; }`,
			line: 1,
			column: 19,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `two spaces behind a single-line block`,
			code: `a { color: pink; }  b { color: red; }`,
			fixed: `a { color: pink; }b { color: red; }`,
			line: 1,
			column: 19,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `a tab behind a single-line block`,
			code: `a { color: pink; }\tb { color: red; }`,
			fixed: `a { color: pink; }b { color: red; }`,
			line: 1,
			column: 19,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `a break between two nested single-line blocks`,
			code: `@media print { a { color: pink; }\nb { color: red; }}`,
			fixed: `@media print { a { color: pink; }b { color: red; }}`,
			line: 1,
			column: 34,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `a break and a space between two at-rules`,
			code: `@media print { a { color: pink; }}\n @media screen { b { color: red; }}`,
			fixed: `@media print { a { color: pink; }}@media screen { b { color: red; }}`,
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
			description: `a multi-line block with nothing behind it`,
			code: `a { color: pink;\ntop: 0; }`,
		},
		{
			description: `a break behind a multi-line block`,
			code: `
				a { color: pink;
				top: 0; }
				b { color: red; }
			`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink;\r\ntop: 0; }\r\nb { color: red; }`,
		},
		{
			description: `indentation behind the break`,
			code: `
				a { color: pink;
				top: 0;}
						b { color: red;}
			`,
		},
		{
			description: `a break behind a nested multi-line block`,
			code: `
				@media print { a {
				color: pink; }
				b { color: red; }}
			`,
		},
		{
			description: `a break between two at-rules, the first holding a multi-line block`,
			code: `
				@media print { a {
				color: pink; }}
				@media screen { b { color: red; }}
			`,
		},
		{
			description: `a single-line block, which this option passes over`,
			code: `a { color: pink; }\nb { color: red; }`,
		},
		{
			description: `a single-line block abutting the rule behind it`,
			code: `a { color: pink; }b { color: red;}`,
		},
	],

	reject: [
		{
			description: `a multi-line block abutting the rule behind it`,
			code: `a { color: pink;\ntop: 0; }b { color: red; }`,
			fixed: `a { color: pink;\ntop: 0; }\nb { color: red; }`,
			line: 2,
			column: 10,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `a { color: pink;\r\ntop: 0; }b { color: red; }`,
			fixed: `a { color: pink;\r\ntop: 0; }\r\nb { color: red; }`,
			line: 2,
			column: 10,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `a space behind a multi-line block`,
			code: `a { color: pink;\ntop: 0; } b { color: red; }`,
			fixed: `a { color: pink;\ntop: 0; }\n b { color: red; }`,
			line: 2,
			column: 10,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `two spaces behind a multi-line block`,
			code: `a { color: pink;\ntop: 0; }  b { color: red; }`,
			fixed: `a { color: pink;\ntop: 0; }\n  b { color: red; }`,
			line: 2,
			column: 10,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `a tab behind a multi-line block`,
			code: `a { color: pink;\ntop: 0; }\tb { color: red; }`,
			fixed: `a { color: pink;\ntop: 0; }\n\tb { color: red; }`,
			line: 2,
			column: 10,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `a space behind a nested multi-line block`,
			code: `@media print { a {\ncolor: pink; } b { color: red; }}`,
			fixed: `@media print { a {\ncolor: pink; }\n b { color: red; }}`,
			line: 2,
			column: 15,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `a space between two at-rules, each holding a multi-line block`,
			code: `
				@media print { a {
				color: pink; }} @media screen { b {
				color: red; }}
			`,
			fixed: `
				@media print { a {
				color: pink; }}
				 @media screen { b {
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
			description: `a multi-line block with nothing behind it`,
			code: `a { color: pink;\ntop: 0; }`,
		},
		{
			description: `a multi-line block abutting the rule behind it`,
			code: `a { color: pink;\ntop: 0; }b { color: red; }`,
		},
		{
			description: `the same pair with no space inside the braces`,
			code: `a { color: pink;\ntop: 0;}b { color: red;}`,
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `a { color: pink;\r\ntop: 0;}b { color: red;}`,
		},
		{
			description: `nested multi-line blocks abutting one another`,
			code: `@media print { a {\ncolor: pink; }b { color: red; }}`,
		},
		{
			description: `two at-rules abutting one another`,
			code: `@media print { a {\ncolor: pink; }}@media screen { b { color: red; }}`,
		},
		{
			description: `the same pair spelled with a carriage return`,
			code: `@media print { a {\r\ncolor: pink; }}@media screen { b { color: red; }}`,
		},
		{
			description: `a single-line block, which this option passes over`,
			code: `a { color: pink; }\nb { color: red; }`,
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a { color: pink; }\r\nb { color: red; }`,
		},
		{
			description: `a space behind a single-line block`,
			code: `a { color: pink;} b { color: red;}`,
		},
	],

	reject: [
		{
			description: `a break behind a multi-line block`,
			code: `
				a { color: pink;
				top: 0; }
				b { color: red; }
			`,
			fixed: `
				a { color: pink;
				top: 0; }b { color: red; }
			`,
			line: 2,
			column: 10,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `the same break spelled with carriage returns`,
			code: `a { color: pink;\r\ntop: 0; }\r\nb { color: red; }`,
			fixed: `a { color: pink;\r\ntop: 0; }b { color: red; }`,
			line: 2,
			column: 10,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a space behind a multi-line block`,
			code: `a { color: pink;\ntop: 0; } b { color: red; }`,
			fixed: `a { color: pink;\ntop: 0; }b { color: red; }`,
			line: 2,
			column: 10,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `two spaces behind a multi-line block`,
			code: `a { color: pink;\ntop: 0; }  b { color: red; }`,
			fixed: `a { color: pink;\ntop: 0; }b { color: red; }`,
			line: 2,
			column: 10,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a tab behind a multi-line block`,
			code: `a { color: pink;\ntop: 0; }\tb { color: red; }`,
			fixed: `a { color: pink;\ntop: 0; }b { color: red; }`,
			line: 2,
			column: 10,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a break behind a nested multi-line block`,
			code: `
				@media print { a {
				color: pink; }
				b { color: red; }}
			`,
			fixed: `
				@media print { a {
				color: pink; }b { color: red; }}
			`,
			line: 2,
			column: 15,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a break between two at-rules, each holding a multi-line block`,
			code: `
				@media print { a {
				color: pink; }}
				@media screen { b {
				color: red; }}
			`,
			fixed: `
				@media print { a {
				color: pink; }}@media screen { b {
				color: red; }}
			`,
			line: 2,
			column: 16,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})
