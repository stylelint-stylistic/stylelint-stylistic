import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `parentheses spelled inside a string, which open no call`,
			code: `a::before { content: "(a) ( a)"; }`,
		},
		{
			description: `the same parentheses spelled inside a url()`,
			code: `
				a::before { background: url(
				'asdf( Vcxvsd)ASD'
				); }
			`,
		},
		{
			description: `breaks on the inside of both parentheses`,
			code: `
				a { transform: translate(
				1, 1
				); }
			`,
		},
		{
			description: `empty lines on the inside of both parentheses`,
			code: `
				a { transform: translate(

				1, 1

				); }
			`,
		},
		{
			description: `the same breaks spelled with carriage returns`,
			code: `a { transform: translate(\r\n1, 1\r\n); }`,
		},
		{
			description: `the same empty lines spelled with carriage returns`,
			code: `a { transform: translate(\r\n\r\n1, 1\r\n\r\n); }`,
		},
		{
			description: `nested calls, each broken on the inside of both its parentheses`,
			code: `
				a { color: color(
				rgb(
				0, 0, 0
				) lightness(
				50%
				)
				); }
			`,
		},
		{
			description: `a comment behind the opening parenthesis, with the break behind the comment`,
			code: `a { transform: translate( /*comment*/\n1,\n  1\n); }`,
		},
	],

	reject: [
		{
			description: `a first argument abutting the opening parenthesis`,
			code: `a { transform: translate(1, 1\n); }`,
			fixed: `a { transform: translate(\n1, 1\n); }`,
			line: 1,
			column: 26,
			message: messages.expectedOpening,
		},
		{
			description: `a last argument abutting the closing parenthesis`,
			code: `a { transform: translate(\n1, 1); }`,
			fixed: `a { transform: translate(\n1, 1\n); }`,
			line: 2,
			column: 4,
			message: messages.expectedClosing,
		},
		{
			description: `two spaces behind the opening parenthesis`,
			code: `a { transform: translate(  1, 1\n); }`,
			fixed: `a { transform: translate(\n  1, 1\n); }`,
			line: 1,
			column: 26,
			message: messages.expectedOpening,
		},
		{
			description: `a tab in front of the closing parenthesis`,
			code: `
				a { transform: translate(
				1,
				1	); }
			`,
			fixed: `
				a { transform: translate(
				1,
				1
					); }
			`,
			line: 3,
			column: 2,
			message: messages.expectedClosing,
		},
		{
			description: `the opening parenthesis of the outer call abutting the inner one`,
			code: `
				a { color: color(rgb(
				0, 0, 0
				) lightness(
				50%
				)
				); }
			`,
			fixed: `
				a { color: color(
				rgb(
				0, 0, 0
				) lightness(
				50%
				)
				); }
			`,
			line: 1,
			column: 18,
			message: messages.expectedOpening,
		},
		{
			description: `an inner call abutting its own opening parenthesis`,
			code: `
				a { color: color(
				rgb(
				0, 0, 0
				) lightness(50%
				)
				); }
			`,
			fixed: `
				a { color: color(
				rgb(
				0, 0, 0
				) lightness(
				50%
				)
				); }
			`,
			line: 4,
			column: 13,
			message: messages.expectedOpening,
		},
		{
			description: `an argument abutting both parentheses of a single-line call`,
			code: `a::before { content: attr(data-foo\n); }`,
			fixed: `a::before { content: attr(\ndata-foo\n); }`,
			line: 1,
			column: 27,
			message: messages.expectedOpening,
		},
		{
			description: `a tab in front of an argument that abuts the closing parenthesis`,
			code: `a::before { content: attr(\n\tdata-foo); }`,
			fixed: `a::before { content: attr(\n\tdata-foo\n); }`,
			line: 2,
			column: 9,
			message: messages.expectedClosing,
		},
		{
			description: `two spaces behind the opening parenthesis of a call broken elsewhere`,
			code: `
				a { transform: translate(  1,
				  1
				); }
			`,
			fixed: `
				a { transform: translate(
				  1,
				  1
				); }
			`,
			line: 1,
			column: 26,
			message: messages.expectedOpening,
		},
		{
			description: `a line feed in front of the closing parenthesis and a carriage return inside`,
			code: `a { transform: translate(1,\r\n1\n); }`,
			fixed: `a { transform: translate(\r\n1,\r\n1\n); }`,
			line: 1,
			column: 26,
			message: messages.expectedOpening,
		},
		{
			description: `a comment behind the opening parenthesis with the argument on its line`,
			code: `
				a { transform: translate( /*comment*/ 1,
				  1
				); }
			`,
			fixed: `
				a { transform: translate( /*comment*/
				 1,
				  1
				); }
			`,
			line: 1,
			column: 26,
			message: messages.expectedOpening,
		},
		{
			description: `comments at both ends of a single-line call`,
			code: `a { transform: translate( /*c1*/ /*c2*/ 1,1 /*c3*/ /*c4*/ ); }`,
			fixed: `a { transform: translate( /*c1*/ /*c2*/\n 1,1 /*c3*/ /*c4*/\n ); }`,
			warnings: [
				{
					line: 1,
					column: 26,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 58,
					message: messages.expectedClosing,
				},
			],
		},
		{
			description: `a call holding nothing but comments, whose one run of whitespace both ends are measured from`,
			code: `a { b: f( /*c*/ /*d*/ ); }`,
			fixed: `a { b: f( /*c*/\n /*d*/\n ); }`,
			warnings: [
				{
					line: 1,
					column: 10,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 22,
					message: messages.expectedClosing,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/272
			description: `a call standing behind a comment the value parser does not give back as it read it`,
			code: `a { b: x/*/*a*/f(1,\n2)c; }`,
			fixed: `a { b: x/*/*a*/f(\n1,\n2\n)c; }`,
			warnings: [
				{
					line: 1,
					column: 18,
					message: messages.expectedOpening,
				},
				{
					line: 2,
					column: 1,
					message: messages.expectedClosing,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `parentheses spelled inside a string, which open no call`,
			code: `a::before { content: "(a) ( a)"; }`,
		},
		{
			description: `the same parentheses spelled inside a url()`,
			code: `
				a::before { background: url(
				'asdf( Vcxvsd)ASD'
				); }
			`,
		},
		{
			description: `breaks on the inside of both parentheses`,
			code: `
				a { transform: translate(
				1, 1
				); }
			`,
		},
		{
			description: `the same breaks spelled with carriage returns`,
			code: `a { transform: translate(\r\n1, 1\r\n); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/244
			description: `a form feed as the only break inside the arguments, which is whitespace and no line break, so the function is single-line`,
			code: `a { b: fn(1,\f2); }`,
		},
		{
			description: `nested calls, each broken on the inside of both its parentheses`,
			code: `
				a { color: color(
				rgb(
				0, 0, 0
				) lightness(
				50%
				)
				); }
			`,
		},
		{
			description: `a single-line call, which this option passes over`,
			code: `a { transform: translate(1, 1); }`,
		},
		{
			description: `spaces and a tab inside a single-line call`,
			code: `a { transform: translate(  1, 1\t); }`,
		},
		{
			description: `a comment behind the break that opens the arguments`,
			code: `
				a { transform: translate(
				/*comment*/ 1,1
				); }
			`,
		},
		{
			description: `a comment behind the opening parenthesis, with the break behind it`,
			code: `a { transform: translate( /*comment*/\n1,1\n); }`,
		},
		{
			description: `a comment in front of the closing parenthesis, behind the break`,
			code: `a { transform: translate(\n1,1\n/*comment*/ ); }`,
		},
		{
			description: `a comment behind the last argument, with the break behind the comment`,
			code: `
				a { transform: translate(
				1,1 /*comment*/
				); }
			`,
		},
	],

	reject: [
		{
			description: `a first argument abutting the opening parenthesis`,
			code: `a { transform: translate(1, 1\n); }`,
			fixed: `a { transform: translate(\n1, 1\n); }`,
			line: 1,
			column: 26,
			message: messages.expectedOpeningMultiLine,
		},
		{
			description: `a last argument abutting the closing parenthesis`,
			code: `a { transform: translate(\n1, 1); }`,
			fixed: `a { transform: translate(\n1, 1\n); }`,
			line: 2,
			column: 4,
			message: messages.expectedClosingMultiLine,
		},
		{
			description: `two spaces behind the opening parenthesis`,
			code: `a { transform: translate(  1, 1\n); }`,
			fixed: `a { transform: translate(\n  1, 1\n); }`,
			line: 1,
			column: 26,
			message: messages.expectedOpeningMultiLine,
		},
		{
			description: `a tab in front of the closing parenthesis`,
			code: `
				a { transform: translate(
				1,
				1	); }
			`,
			fixed: `
				a { transform: translate(
				1,
				1
					); }
			`,
			line: 3,
			column: 2,
			message: messages.expectedClosingMultiLine,
		},
		{
			description: `the opening parenthesis of the outer call abutting the inner one`,
			code: `
				a { color: color(rgb(
				0, 0, 0
				) lightness(
				50%
				)
				); }
			`,
			fixed: `
				a { color: color(
				rgb(
				0, 0, 0
				) lightness(
				50%
				)
				); }
			`,
			line: 1,
			column: 18,
			message: messages.expectedOpeningMultiLine,
		},
		{
			description: `an inner call abutting its own opening parenthesis`,
			code: `
				a { color: color(
				rgb(
				0, 0, 0
				) lightness(50%
				)
				); }
			`,
			fixed: `
				a { color: color(
				rgb(
				0, 0, 0
				) lightness(
				50%
				)
				); }
			`,
			line: 4,
			column: 13,
			message: messages.expectedOpeningMultiLine,
		},
		{
			description: `an argument abutting both parentheses of a call broken elsewhere`,
			code: `a::before { content: attr(data-foo\n); }`,
			fixed: `a::before { content: attr(\ndata-foo\n); }`,
			line: 1,
			column: 27,
			message: messages.expectedOpeningMultiLine,
		},
		{
			description: `a tab in front of an argument that abuts the closing parenthesis`,
			code: `a::before { content: attr(\n\tdata-foo); }`,
			fixed: `a::before { content: attr(\n\tdata-foo\n); }`,
			line: 2,
			column: 9,
			message: messages.expectedClosingMultiLine,
		},
		{
			description: `two spaces behind the opening parenthesis of a call broken elsewhere`,
			code: `
				a { transform: translate(  1,
				  1
				); }
			`,
			fixed: `
				a { transform: translate(
				  1,
				  1
				); }
			`,
			line: 1,
			column: 26,
			message: messages.expectedOpeningMultiLine,
		},
		{
			description: `a line feed in front of the closing parenthesis and a carriage return inside`,
			code: `a { transform: translate(1,\r\n1\n); }`,
			fixed: `a { transform: translate(\r\n1,\r\n1\n); }`,
			line: 1,
			column: 26,
			message: messages.expectedOpeningMultiLine,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			description: `parentheses spelled inside a string, which open no call`,
			code: `a::before { content: "(a) ( a)"; }`,
		},
		{
			description: `the same parentheses spelled inside a url(), broken across lines`,
			code: `a::before { background: url('asdf(Vcxv\nsd\n)ASD'); }`,
		},
		{
			description: `a single-line call, whose parentheses hold no whitespace`,
			code: `a { transform: translate(1, 1); }`,
		},
		{
			description: `a call broken at its comma alone`,
			code: `a { transform: translate(1,\r\n1); }`,
		},
		{
			description: `nested single-line calls`,
			code: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
		},
		{
			description: `a break at the comma with indentation behind it`,
			code: `a { transform: translate(1,\n  1); }`,
		},
		{
			description: `the same break with tabs of indentation`,
			code: `a { transform: translate(1,\n\t\t1); }`,
		},
		{
			description: `a comment abutting the opening parenthesis`,
			code: `a { transform: translate(/*comment*/1,\n1); }`,
		},
		{
			description: `a comment abutting the closing parenthesis`,
			code: `a { transform: translate(1,\n1/*comment*/); }`,
		},
	],

	reject: [
		{
			description: `a break behind the opening parenthesis of a multi-line call`,
			code: `
				a { transform: translate(
				  1,
				  1); }
			`,
			fixed: `
				a { transform: translate(1,
				  1); }
			`,
			line: 1,
			column: 26,
			message: messages.rejectedOpeningMultiLine,
		},
		{
			description: `two spaces and a break behind the opening parenthesis`,
			code: `a { transform: translate(  \n  1,\n  1); }`,
			fixed: `a { transform: translate(1,\n  1); }`,
			line: 1,
			column: 26,
			message: messages.rejectedOpeningMultiLine,
		},
		{
			description: `a break in front of the closing parenthesis`,
			code: `
				a { transform: translate(1,
				  1
				); }
			`,
			fixed: `
				a { transform: translate(1,
				  1); }
			`,
			line: 2,
			column: 4,
			message: messages.rejectedClosingMultiLine,
		},
		{
			description: `a tab in front of the closing parenthesis of a call broken at its comma`,
			code: `a { transform: translate(1,\r\n1\t); }`,
			fixed: `a { transform: translate(1,\r\n1); }`,
			line: 2,
			column: 2,
			message: messages.rejectedClosingMultiLine,
		},
		{
			description: `an inner call broken on the inside of both its parentheses`,
			code: `a { color: color(rgb(0,\r\n  0,\r\n  0\r\n) lightness(50%)); }`,
			fixed: `a { color: color(rgb(0,\r\n  0,\r\n  0) lightness(50%)); }`,
			line: 3,
			column: 5,
			message: messages.rejectedClosingMultiLine,
		},
		{
			description: `a break behind the opening parenthesis of the inner call`,
			code: `a { color: color(rgb(0, 0, 0) lightness(\n50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 41,
			message: messages.rejectedOpeningMultiLine,
		},
		{
			description: `comments at both ends, each spaced from the parenthesis`,
			code: `a { transform: translate( /*c1*/ /*c2*/ 1,\n1 /*c3*/ /*c4*/ ); }`,
			fixed: `a { transform: translate(/*c1*//*c2*/1,\n1/*c3*//*c4*/); }`,
			warnings: [
				{
					line: 1,
					column: 26,
					message: messages.rejectedOpeningMultiLine,
				},
				{
					line: 2,
					column: 16,
					message: messages.rejectedClosingMultiLine,
				},
			],
		},
		{
			description: `the same comments abutting the arguments instead`,
			code: `a { transform: translate( /*c1*//*c2*/1,\n1/*c3*//*c4*/ ); }`,
			fixed: `a { transform: translate(/*c1*//*c2*/1,\n1/*c3*//*c4*/); }`,
			warnings: [
				{
					line: 1,
					column: 26,
					message: messages.rejectedOpeningMultiLine,
				},
				{
					line: 2,
					column: 14,
					message: messages.rejectedClosingMultiLine,
				},
			],
		},
		{
			description: `the same comments abutting the parentheses on the outside`,
			code: `a { transform: translate(/*c1*//*c2*/ 1,\n1 /*c3*//*c4*/); }`,
			fixed: `a { transform: translate(/*c1*//*c2*/1,\n1/*c3*//*c4*/); }`,
			warnings: [
				{
					line: 1,
					column: 26,
					message: messages.rejectedOpeningMultiLine,
				},
				{
					line: 2,
					column: 14,
					message: messages.rejectedClosingMultiLine,
				},
			],
		},
		{
			description: `the same comments abutting the parentheses on one side each`,
			code: `a { transform: translate(/*c1*/ /*c2*/1,\n1/*c3*/ /*c4*/); }`,
			fixed: `a { transform: translate(/*c1*//*c2*/1,\n1/*c3*//*c4*/); }`,
			warnings: [
				{
					line: 1,
					column: 26,
					message: messages.rejectedOpeningMultiLine,
				},
				{
					line: 2,
					column: 14,
					message: messages.rejectedClosingMultiLine,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			description: `a double slash of plain CSS opens no comment, so the parenthesis has a line to join and the fix is written`,
			code: `
				a {
					b: translate(
						1px//c
					);
				}
			`,
			fixed: `
				a {
					b: translate(1px//c);
				}
			`,
			warnings: [
				{
					line: 2,
					column: 15,
					message: messages.rejectedOpeningMultiLine,
				},
				{
					line: 4,
					column: 1,
					message: messages.rejectedClosingMultiLine,
				},
			],
		},
		{
			description: `a call holding nothing but comments, whose one whitespace node both ends of the fix reach`,
			code: `a { b: f(\n/*c*/\n/*d*/\n); }`,
			fixed: `a { b: f(/*c*//*d*/); }`,
			warnings: [
				{
					line: 1,
					column: 10,
					message: messages.rejectedOpeningMultiLine,
				},
				{
					line: 3,
					column: 6,
					message: messages.rejectedClosingMultiLine,
				},
			],
		},
	],
})
