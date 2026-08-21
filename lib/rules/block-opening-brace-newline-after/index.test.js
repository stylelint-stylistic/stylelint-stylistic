import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a blockless at-rule, which has no opening brace to break behind`,
			code: `@import url(x.css)`,
		},
		{
			description: `a break behind the opening brace`,
			code: `a {\ncolor: pink; }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a {\r\ncolor: pink; }`,
		},
		{
			description: `an empty line behind the brace, which is a break all the same`,
			code: `
				a {

				color: pink; }
			`,
		},
		{
			description: `the same empty line spelled with carriage returns`,
			code: `a {\r\n\r\ncolor: pink; }`,
		},
		{
			description: `a brace abutting the selector, with the break behind it`,
			code: `a{\ncolor: pink; }`,
		},
		{
			description: `a tab of indentation behind the break`,
			code: `a{\n\tcolor: pink; }`,
		},
		{
			description: `two spaces of indentation behind the break`,
			code: `a{\n  color: pink; }`,
		},
		{
			description: `the same indentation behind a carriage return`,
			code: `a{\r\n  color: pink; }`,
		},
		{
			description: `nested blocks, each broken behind its brace`,
			code: `
				@media print {
				a {
				color: pink; } }
			`,
		},
		{
			description: `the same pair with the braces abutting their selectors`,
			code: `
				@media print{
				a{
				color: pink; } }
			`,
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `@media print{\r\na{\r\ncolor: pink; } }`,
		},
		{
			description: `nested blocks with indentation of their own behind each break`,
			code: `
				@media print{
					a{
				  color: pink; } }
			`,
		},
		{
			description: `a comment on the brace's own line, with the break behind the comment`,
			code: `
				a { /* 1 */
				  color: pink;
				}
			`,
		},
		{
			description: `the same comment behind several spaces`,
			code: `
				a {    /* 1 */
				  color: pink;
				}
			`,
		},
		{
			description: `a comment on the line behind the brace`,
			code: `
				a {
				  /* 1 */
				  color: pink;
				}
			`,
		},
		{
			description: `the same comment behind a carriage return`,
			code: `a {\r\n  /* 1 */\r\n  color: pink;\r\n}`,
		},
		{
			description: `a comment abutting the selector behind it, which the parser reads as part of that selector`,
			code: `
				.a {
				/*.b*/.c {
				 color: pink; }
				 }
			`,
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `.a {\r\n/*.b*/.c {\r\n color: pink; }\r\n }`,
		},
		{
			description: `a comment abutting a selector nested in an at-rule`,
			code: `
				@media print {
				 /*.test2*/.a {
				 color: pink;
				 }
				 }
			`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `@media print {\r\n /*.test2*/.a {\r\n color: pink;\r\n }\r\n }`,
		},
		{
			description: `a comment on a line of its own inside an at-rule`,
			code: `
				@media print {
				 /*.test2*/
				 .a {
				 color: pink;
				 }
				 }
			`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `@media print {\r\n /*.test2*/\r\n .a {\r\n color: pink;\r\n }\r\n }`,
		},
		{
			description: `the same comment behind more indentation`,
			code: `@media print {\r\n      /*.test2*/\r\n .a {\r\n color: pink;\r\n }\r\n }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/204
			description: `spaces in front of a bare carriage return, which the fix trims up to the break rather than writing a line feed in front of them`,
			code: `a {  \rcolor: pink; }`,
			fixed: `a {\rcolor: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `spaces in front of a form feed, which ends a line to every syntax this plugin reads through`,
			code: `a {  \fcolor: pink; }`,
			fixed: `a {\fcolor: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `a space behind the brace`,
			code: `a { color: pink; }`,
			fixed: `a {\n color: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `a declaration abutting the brace`,
			code: `a {color: pink; }`,
			fixed: `a {\ncolor: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces behind the brace`,
			code: `a {  color: pink; }`,
			fixed: `a {\n  color: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab behind the brace`,
			code: `a {\tcolor: pink; }`,
			fixed: `a {\n\tcolor: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `a nested brace with a space behind it`,
			code: `@media print { a {\ncolor: pink; } }`,
			fixed: `@media print {\n a {\ncolor: pink; } }`,
			line: 1,
			column: 15,
			message: messages.expectedAfter(),
		},
		{
			description: `an outer brace broken behind and an inner one with a space`,
			code: `@media print {\na { color: pink; } }`,
			fixed: `@media print {\na {\n color: pink; } }`,
			line: 2,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `the same pair spelled with a carriage return`,
			code: `@media print {\r\na { color: pink; } }`,
			fixed: `@media print {\r\na {\r\n color: pink; } }`,
			line: 2,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment behind the brace with no break behind the comment`,
			code: `a { /* 1 */ color: pink; }`,
			fixed: `a { /* 1 */\n color: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment abutting the selector behind it, all on the brace's line`,
			code: `.a {/*.b*/.c { color: pink; } }`,
			fixed: `.a {/*.b*/\n.c {\n color: pink; } }`,
			warnings: [
				{
					line: 1,
					column: 5,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 15,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			description: `a comment abutting the brace, with the break behind the comment`,
			code: `.a {/*.b*/\n.c { color: pink; } }`,
			fixed: `.a {/*.b*/\n.c {\n color: pink; } }`,
			line: 2,
			column: 5,
			message: messages.expectedAfter(),
		},
		{
			description: `the same comment behind a carriage return`,
			code: `.a {/*.b*/\r\n.c { color: pink; } }`,
			fixed: `.a {/*.b*/\r\n.c {\r\n color: pink; } }`,
			line: 2,
			column: 5,
			message: messages.expectedAfter(),
		},
		{
			description: `a space in front of the break, which is what the fix trims`,
			code: `a { \ncolor: pink; }`,
			fixed: `a {\ncolor: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
		{
			description: `the same trailing space in front of a carriage return`,
			code: `a { \r\ncolor: pink; }`,
			fixed: `a {\r\ncolor: pink; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a multi-line block broken behind its brace`,
			code: `a {\ncolor: pink; }`,
		},
		{
			description: `two declarations, each on a line of its own`,
			code: `
				a {
				  color: pink;
				  background: orange; }
			`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a {\r\n  color: pink;\r\n  background: orange; }`,
		},
		{
			description: `a brace abutting the selector, with the break behind it`,
			code: `a{\ncolor: pink; }`,
		},
		{
			description: `a tab of indentation behind the break`,
			code: `a{\n\tcolor: pink; }`,
		},
		{
			description: `two spaces of indentation behind the break`,
			code: `a{\n  color: pink; }`,
		},
		{
			description: `nested multi-line blocks, each broken behind its brace`,
			code: `
				@media print {
				a {
				color: pink; } }
			`,
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `@media print {\r\na {\r\ncolor: pink; } }`,
		},
		{
			description: `the same pair with the braces abutting their selectors`,
			code: `
				@media print{
				a{
				color: pink; } }
			`,
		},
		{
			description: `nested blocks with indentation of their own behind each break`,
			code: `
				@media print{
					a{
				  color: pink; } }
			`,
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `@media print{\r\n\ta{\r\n  color: pink; } }`,
		},
		{
			description: `a single-line block, which this option passes over`,
			code: `a { color: pink; }`,
		},
		{
			description: `a tab behind the brace of a single-line block`,
			code: `a {\tcolor: pink; }`,
		},
		{
			description: `two declarations on one line`,
			code: `a {  color: pink;  background: orange; }`,
		},
		{
			description: `a comment behind the brace of a single-line block`,
			code: `a { /* 1 */ color: pink; }`,
		},
		{
			description: `a comment abutting the selector of a single-line nested block`,
			code: `.a {/*.b*/.c { color: pink; } }`,
		},
	],

	reject: [
		{
			description: `a multi-line block with a space behind its brace`,
			code: `a { color: pink;\nbackground: orange; }`,
			fixed: `a {\n color: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `a multi-line block whose declaration abuts the brace`,
			code: `a {color: pink;\nbackground: orange; }`,
			fixed: `a {\ncolor: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `two spaces behind the brace of a multi-line block`,
			code: `a {  color: pink;\nbackground: orange; }`,
			fixed: `a {\n  color: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `a tab behind the brace of a multi-line block`,
			code: `a {\tcolor: pink;\nbackground: orange; }`,
			fixed: `a {\n\tcolor: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `the same block broken with a carriage return`,
			code: `a {\tcolor: pink;\r\nbackground: orange; }`,
			fixed: `a {\r\n\tcolor: pink;\r\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `a nested multi-line block with a space behind its brace`,
			code: `
				@media print { a {
				color:
				pink; } }
			`,
			fixed: `
				@media print {
				 a {
				color:
				pink; } }
			`,
			line: 1,
			column: 15,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `an outer brace broken behind and an inner multi-line block with a space`,
			code: `
				@media print {
				a { color:
				pink; } }
			`,
			fixed: `
				@media print {
				a {
				 color:
				pink; } }
			`,
			line: 2,
			column: 4,
			message: messages.expectedAfterMultiLine(),
		},
		{
			description: `the same pair spelled with carriage returns`,
			code: `@media print {\r\na { color:\r\npink; } }`,
			fixed: `@media print {\r\na {\r\n color:\r\npink; } }`,
			line: 2,
			column: 4,
			message: messages.expectedAfterMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			description: `a multi-line block whose declaration abuts the brace`,
			code: `a {color: pink;\nbackground: orange; }`,
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a {color: pink;\r\nbackground: orange; }`,
		},
		{
			description: `the same block with the brace abutting the selector`,
			code: `a{color: pink;\nbackground: orange; }`,
		},
		{
			description: `nested blocks, the inner one multi-line and abutting its brace`,
			code: `@media print {a {color: pink;\nbackground: orange; } }`,
		},
		{
			description: `the same pair with the braces abutting their selectors`,
			code: `@media print{a{color: pink;\nbackground: orange; } }`,
		},
		{
			description: `a single-line block, which this option passes over`,
			code: `a { color: pink; }`,
		},
		{
			description: `two spaces behind the brace of a single-line block`,
			code: `a {  color: pink; }`,
		},
		{
			description: `a tab behind the brace of a single-line block`,
			code: `a {\tcolor: pink; }`,
		},
		{
			description: `nested single-line blocks`,
			code: `@media print { a { color: pink; } }`,
		},
		{
			description: `nested single-line blocks with tabs behind their braces`,
			code: `@media print {\ta {\tcolor: pink; } }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/204
			description: `a bare carriage return in front of a comment, which the fix takes away as it does a line feed`,
			code: `a {\r/* c */color: pink;\rbackground: orange; }`,
			fixed: `a {/* c */color: pink;\rbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a space behind the brace of a multi-line block`,
			code: `a { color: pink;\nbackground: orange; }`,
			fixed: `a {color: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a break behind the brace of a multi-line block`,
			code: `
				a {
				color: pink;
				background: orange; }
			`,
			fixed: `
				a {color: pink;
				background: orange; }
			`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `the same break spelled with carriage returns`,
			code: `a {\r\ncolor: pink;\r\nbackground: orange; }`,
			fixed: `a {color: pink;\r\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `two spaces behind the brace of a multi-line block`,
			code: `a {  color: pink;\nbackground: orange; }`,
			fixed: `a {color: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a tab behind the brace of a multi-line block`,
			code: `a {\tcolor: pink;\nbackground: orange; }`,
			fixed: `a {color: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `an outer brace broken behind, the inner block multi-line`,
			code: `
				@media print {
				a {color: pink;
				background: orange; } }
			`,
			fixed: `
				@media print {a {color: pink;
				background: orange; } }
			`,
			line: 1,
			column: 15,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `an inner brace broken behind, in a multi-line block`,
			code: `
				@media print {a {
				color: pink;
				background: orange; } }
			`,
			fixed: `
				@media print {a {color: pink;
				background: orange; } }
			`,
			line: 1,
			column: 18,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `a comment on the line behind the brace`,
			code: `
				a {
				/*comment*/ color: pink;
				background: orange; }
			`,
			fixed: `
				a {/*comment*/color: pink;
				background: orange; }
			`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
		{
			description: `several comments on the lines behind the brace, with an empty line among them`,
			code: `a {\n /*c1*/ /*c2*/ \n\n /*c3*/ color: pink;\nbackground: orange; }`,
			fixed: `a { /*c1*/ /*c2*/  /*c3*/color: pink;\nbackground: orange; }`,
			line: 1,
			column: 4,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignore: [`rules`] }],

	accept: [
		{
			description: `a single-line rule, which the option leaves to itself`,
			code: `a { color: pink; }`,
		},
		{
			description: `a rule broken behind its brace, which the option leaves to itself`,
			code: `a {\ncolor: pink; }`,
		},
		{
			description: `nested rules, both left to themselves`,
			code: `
				@media print {
				a {
				color: pink; } }
			`,
		},
	],
	reject: [
		{
			description: `an at-rule with a space behind its brace, which the option still checks`,
			code: `@media print { a { color: pink; } }`,
			fixed: `@media print {\n a { color: pink; } }`,
			line: 1,
			column: 15,
			message: messages.expectedAfter(),
		},
	],
})
