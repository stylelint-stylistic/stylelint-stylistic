import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `@import url(x.css)`,
			description: `a blockless at-rule, which has no opening brace to space behind`,
		},
		{
			code: `a { color: pink; }`,
			description: `a space behind the opening brace`,
		},
		{
			code: `@media print { a { color: pink; } }`,
			description: `nested blocks, each with a space behind its brace`,
		},
	],

	reject: [
		{
			code: `a {color: pink; }`,
			fixed: `a { color: pink; }`,
			description: `a declaration abutting the brace`,
			message: messages.expectedAfter(),
			line: 1,
			column: 4,
		},
		{
			code: `a {  color: pink; }`,
			fixed: `a { color: pink; }`,
			description: `two spaces where one belongs`,
			message: messages.expectedAfter(),
			line: 1,
			column: 4,
		},
		{
			code: `a {\tcolor: pink; }`,
			fixed: `a { color: pink; }`,
			description: `a tab where the space belongs`,
			message: messages.expectedAfter(),
			line: 1,
			column: 4,
		},
		{
			code: `a {\ncolor: pink; }`,
			fixed: `a { color: pink; }`,
			description: `a break where the space belongs`,
			message: messages.expectedAfter(),
			line: 1,
			column: 4,
		},
		{
			code: `a {\r\ncolor: pink; }`,
			fixed: `a { color: pink; }`,
			description: `the same break spelled with a carriage return`,
			message: messages.expectedAfter(),
			line: 1,
			column: 4,
		},
		{
			code: `@media print {\na { color: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			description: `a break behind the at-rule's brace`,
			message: messages.expectedAfter(),
			line: 1,
			column: 15,
		},
		{
			code: `@media print { a {\ncolor: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			description: `a break behind the nested block's brace`,
			message: messages.expectedAfter(),
			line: 1,
			column: 19,
		},
		{
			code: `@media print { a {\r\ncolor: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			description: `the same break spelled with a carriage return`,
			message: messages.expectedAfter(),
			line: 1,
			column: 19,
		},
		{
			code: `a {/*comment*/ color: pink; }`,
			fixed: `a { /*comment*/ color: pink; }`,
			description: `a comment abutting the brace, with the space behind the comment`,
			message: messages.expectedAfter(),
			line: 1,
			column: 4,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `a {color: pink; }`,
			description: `a declaration abutting the brace`,
		},
		{
			code: `@media print {a {color: pink; } }`,
			description: `nested blocks, each abutting its brace`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }`,
			fixed: `a {color: pink; }`,
			description: `a space behind the brace`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 4,
		},
		{
			code: `a {  color: pink; }`,
			fixed: `a {color: pink; }`,
			description: `two spaces behind the brace`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 4,
		},
		{
			code: `a {\tcolor: pink; }`,
			fixed: `a {color: pink; }`,
			description: `a tab behind the brace`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 4,
		},
		{
			code: `a {\ncolor: pink; }`,
			fixed: `a {color: pink; }`,
			description: `a break behind the brace`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 4,
		},
		{
			code: `a {\r\ncolor: pink; }`,
			fixed: `a {color: pink; }`,
			description: `the same break spelled with a carriage return`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 4,
		},
		{
			code: `@media print {\na {color: pink; } }`,
			fixed: `@media print {a {color: pink; } }`,
			description: `a break behind the at-rule's brace`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 15,
		},
		{
			code: `@media print {a {\ncolor: pink; } }`,
			fixed: `@media print {a {color: pink; } }`,
			description: `a break behind the nested block's brace`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 18,
		},
		{
			code: `a { /*comment*/ color: pink; }`,
			fixed: `a {/*comment*/ color: pink; }`,
			description: `a comment behind a space, with the brace in front of the space`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 4,
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			code: `a { color: pink; }`,
			description: `a single-line block with the space behind its brace`,
		},
		{
			code: `@media print { a { color: pink; } }`,
			description: `nested single-line blocks, each with the space`,
		},
		{
			code: `a {\ncolor: pink; }`,
			description: `a multi-line block, which this option passes over`,
		},
		{
			code: `a {\r\ncolor: pink; }`,
			description: `the same block spelled with a carriage return`,
		},
		{
			code: `a {color:\npink; }`,
			description: `a multi-line block whose declaration abuts the brace`,
		},
		{
			code: `@media print {a {color:\npink; } }`,
			description: `a nested multi-line block, likewise passed over`,
		},
		{
			code: `@media print{a {color:\npink; } }`,
			description: `the same block with the at-rule's brace abutting its own contents`,
		},
	],

	reject: [
		{
			code: `a {color: pink; }`,
			fixed: `a { color: pink; }`,
			description: `a single-line block whose declaration abuts the brace`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 4,
		},
		{
			code: `a {  color: pink; }`,
			fixed: `a { color: pink; }`,
			description: `two spaces behind the brace of a single-line block`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 4,
		},
		{
			code: `a {\tcolor: pink; }`,
			fixed: `a { color: pink; }`,
			description: `a tab behind the brace of a single-line block`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 4,
		},
		{
			code: `@media print {\ta { color: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			description: `a tab behind the at-rule's brace`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 15,
		},
		{
			code: `@media print { a {\tcolor: pink; } }`,
			fixed: `@media print { a { color: pink; } }`,
			description: `a tab behind the nested block's brace`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 19,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			code: `a {color: pink; }`,
			description: `a single-line block whose declaration abuts the brace`,
		},
		{
			code: `@media print {a {color: pink; } }`,
			description: `nested single-line blocks, each abutting its brace`,
		},
		{
			code: `a { color:\npink; }`,
			description: `a multi-line block, which this option passes over`,
		},
		{
			code: `@media print { a { color:\npink; } }`,
			description: `a nested multi-line block, likewise passed over`,
		},
		{
			code: `@media print { a\n{color: pink; } }`,
			description: `a nested block broken in front of its brace, which makes the at-rule multi-line`,
		},
		{
			code: `@media print { a\r\n{color: pink; } }`,
			description: `the same pair spelled with a carriage return`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }`,
			fixed: `a {color: pink; }`,
			description: `a space behind the brace of a single-line block`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 4,
		},
		{
			code: `a {  color: pink; }`,
			fixed: `a {color: pink; }`,
			description: `two spaces behind the brace of a single-line block`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 4,
		},
		{
			code: `a {\tcolor: pink; }`,
			fixed: `a {color: pink; }`,
			description: `a tab behind the brace of a single-line block`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 4,
		},
		{
			code: `@media print { a {color: pink; } }`,
			fixed: `@media print {a {color: pink; } }`,
			description: `a space behind the at-rule's brace, the nested block abutting its own`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 15,
		},
		{
			code: `@media print {a { color: pink; } }`,
			fixed: `@media print {a {color: pink; } }`,
			description: `a space behind the nested block's brace`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 18,
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			code: `a { color: pink;\nbackground: orange; }`,
			description: `a multi-line block with the space behind its brace`,
		},
		{
			code: `@media print { a { color: pink;\nbackground: orange } }`,
			description: `a nested multi-line block with the space behind its brace`,
		},
		{
			code: `a {color: pink; }`,
			description: `a single-line block, which this option passes over`,
		},
		{
			code: `@media print {a {color: pink; } }`,
			description: `nested single-line blocks, likewise passed over`,
		},
		{
			code: `a { color: pink; }`,
			description: `a single-line block with a space behind its brace`,
		},
		{
			code: `a {  color: pink; }`,
			description: `two spaces behind the brace of a single-line block`,
		},
		{
			code: `a {\tcolor: pink; }`,
			description: `a tab behind the brace of a single-line block`,
		},
	],

	reject: [
		{
			code: `a {color: pink;\nbackground: orange; }`,
			fixed: `a { color: pink;\nbackground: orange; }`,
			description: `a multi-line block whose declaration abuts the brace`,
			message: messages.expectedAfterMultiLine(),
			line: 1,
			column: 4,
		},
		{
			code: `a {  color: pink;\nbackground: orange; }`,
			fixed: `a { color: pink;\nbackground: orange; }`,
			description: `two spaces behind the brace of a multi-line block`,
			message: messages.expectedAfterMultiLine(),
			line: 1,
			column: 4,
		},
		{
			code: `a {\tcolor: pink;\nbackground: orange; }`,
			fixed: `a { color: pink;\nbackground: orange; }`,
			description: `a tab behind the brace of a multi-line block`,
			message: messages.expectedAfterMultiLine(),
			line: 1,
			column: 4,
		},
		{
			code: `
				a {
				color: pink;
				background: orange; }
			`,
			fixed: `
				a { color: pink;
				background: orange; }
			`,
			description: `a break behind the brace of a multi-line block`,
			message: messages.expectedAfterMultiLine(),
			line: 1,
			column: 4,
		},
		{
			code: `a {\r\ncolor: pink;\r\nbackground: orange; }`,
			fixed: `a { color: pink;\r\nbackground: orange; }`,
			description: `the same break spelled with carriage returns`,
			message: messages.expectedAfterMultiLine(),
			line: 1,
			column: 4,
		},
		{
			code: `
				@media print
				{a { color: pink;
				background: orange; } }
			`,
			fixed: `
				@media print
				{ a { color: pink;
				background: orange; } }
			`,
			description: `an at-rule broken in front of its brace, holding a multi-line block that abuts its own`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 2,
		},
		{
			code: `
				@media print { a
				{color: pink;
				background: orange; } }
			`,
			fixed: `
				@media print { a
				{ color: pink;
				background: orange; } }
			`,
			description: `a nested block broken in front of its brace, whose declaration abuts it`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 2,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			code: `a {color: pink;\nbackground: orange; }`,
			description: `a multi-line block whose declaration abuts the brace`,
		},
		{
			code: `
				@media print {a
				{color: pink;
				background: orange } }
			`,
			description: `a nested block abutting its brace, broken in front of it`,
		},
		{
			code: `@media print {a\r\n{color: pink;\r\nbackground: orange } }`,
			description: `the same pair spelled with carriage returns`,
		},
		{
			code: `a { color: pink; }`,
			description: `a single-line block, which this option passes over`,
		},
		{
			code: `@media print { a { color: pink; } }`,
			description: `nested single-line blocks, likewise passed over`,
		},
		{
			code: `a {  color: pink; }`,
			description: `two spaces behind the brace of a single-line block`,
		},
		{
			code: `a {\tcolor: pink; }`,
			description: `a tab behind the brace of a single-line block`,
		},
	],

	reject: [
		{
			code: `a { color: pink;\nbackground: orange; }`,
			fixed: `a {color: pink;\nbackground: orange; }`,
			description: `a space behind the brace of a multi-line block`,
			message: messages.rejectedAfterMultiLine(),
			line: 1,
			column: 4,
		},
		{
			code: `a {  color: pink;\nbackground: orange; }`,
			fixed: `a {color: pink;\nbackground: orange; }`,
			description: `two spaces behind the brace of a multi-line block`,
			message: messages.rejectedAfterMultiLine(),
			line: 1,
			column: 4,
		},
		{
			code: `a {\tcolor: pink;\nbackground: orange; }`,
			fixed: `a {color: pink;\nbackground: orange; }`,
			description: `a tab behind the brace of a multi-line block`,
			message: messages.rejectedAfterMultiLine(),
			line: 1,
			column: 4,
		},
		{
			code: `a {\tcolor: pink;\r\nbackground: orange; }`,
			fixed: `a {color: pink;\r\nbackground: orange; }`,
			description: `the same block spelled with a carriage return`,
			message: messages.rejectedAfterMultiLine(),
			line: 1,
			column: 4,
		},
		{
			code: `
				a {
				color: pink;
				background: orange; }
			`,
			fixed: `
				a {color: pink;
				background: orange; }
			`,
			description: `a break behind the brace of a multi-line block`,
			message: messages.rejectedAfterMultiLine(),
			line: 1,
			column: 4,
		},
		{
			code: `
				@media print
				{ a {color: pink;
				background: orange; } }
			`,
			fixed: `
				@media print
				{a {color: pink;
				background: orange; } }
			`,
			description: `an at-rule broken in front of its brace, with a space behind it`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 2,
		},
		{
			code: `
				@media print{a
				{ color: pink;
				background: orange; } }
			`,
			fixed: `
				@media print{a
				{color: pink;
				background: orange; } }
			`,
			description: `a nested block broken in front of its brace, with a space behind it`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 2,
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignore: [`at-rules`] }],

	accept: [
		{
			code: `a { color: pink; }`,
			description: `a single-line rule with the space behind its brace`,
		},
		{
			code: `@media print { a { color: pink; } }`,
			description: `an at-rule and a rule, both with the space, neither in question`,
		},
		{
			code: `@media print {\na { color: pink; } }`,
			description: `a break behind the at-rule's brace, which the option leaves to itself`,
		},
	],
	reject: [
		{
			code: `@media print {\n  a {color: pink; } }`,
			fixed: `@media print {\n  a { color: pink; } }`,
			description: `a nested rule abutting its brace, which the option still checks`,
			message: messages.expectedAfter(),
			line: 2,
			column: 6,
		},
	],
})
