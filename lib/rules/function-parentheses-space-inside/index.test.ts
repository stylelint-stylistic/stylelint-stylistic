import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `ignore function without parameters`,
			code: `a { filter: grayscale(); }`,
		},
		{
			description: `ignore function without parameters`,
			code: `a { filter: grayscale( ); }`,
		},
		{
			description: `parentheses spelled inside a string, which open no call`,
			code: `a::before { content: "(a) ( a )"; }`,
		},
		{
			description: `the same parentheses spelled inside a url()`,
			code: `a::before { background: url( 'asdf(Vcxvsd)ASD' ); }`,
		},
		{
			description: `spaces on the inside of both parentheses`,
			code: `a { transform: translate( 1, 1 ); }`,
		},
		{
			description: `nested calls, each with the spaces inside its own parentheses`,
			code: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
		},
	],

	reject: [
		{
			description: `a first argument abutting the opening parenthesis`,
			code: `a { transform: translate(1, 1 ); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			line: 1,
			column: 26,
			message: messages.expectedOpening,
		},
		{
			description: `a last argument abutting the closing parenthesis`,
			code: `a { transform: translate( 1, 1); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			line: 1,
			column: 30,
			message: messages.expectedClosing,
		},
		{
			description: `two spaces behind the opening parenthesis`,
			code: `a { transform: translate(  1, 1 ); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			line: 1,
			column: 26,
			message: messages.expectedOpening,
		},
		{
			description: `two spaces in front of the closing parenthesis`,
			code: `a { transform: translate( 1, 1  ); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			line: 1,
			column: 32,
			message: messages.expectedClosing,
		},
		{
			description: `the outer opening parenthesis abutting the inner call`,
			code: `a { color: color(rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 18,
			message: messages.expectedOpening,
		},
		{
			description: `an inner call abutting its own opening parenthesis`,
			code: `a { color: color( rgb(0, 0, 0 ) lightness( 50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 23,
			message: messages.expectedOpening,
		},
		{
			description: `an inner call abutting its own closing parenthesis`,
			code: `a { color: color( rgb( 0, 0, 0) lightness( 50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 30,
			message: messages.expectedClosing,
		},
		{
			description: `the second inner call abutting its opening parenthesis`,
			code: `a { color: color( rgb( 0, 0, 0 ) lightness(50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 44,
			message: messages.expectedOpening,
		},
		{
			description: `the second inner call abutting its closing parenthesis`,
			code: `a { color: color( rgb( 0, 0, 0 ) lightness( 50%) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 47,
			message: messages.expectedClosing,
		},
		{
			description: `the outer closing parenthesis abutting the inner one`,
			code: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% )); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 49,
			message: messages.expectedClosing,
		},
		{
			description: `an argument abutting the opening parenthesis of a one-argument call`,
			code: `a::before { content: attr(data-foo ); }`,
			fixed: `a::before { content: attr( data-foo ); }`,
			line: 1,
			column: 27,
			message: messages.expectedOpening,
		},
		{
			description: `the same argument abutting the closing parenthesis instead`,
			code: `a::before { content: attr( data-foo); }`,
			fixed: `a::before { content: attr( data-foo ); }`,
			line: 1,
			column: 35,
			message: messages.expectedClosing,
		},
		{
			description: `a call broken across lines whose first argument abuts the parenthesis`,
			code: `
				a { transform: translate(
				  1,
				  1 ); }
			`,
			fixed: `
				a { transform: translate( 1,
				  1 ); }
			`,
			line: 1,
			column: 26,
			message: messages.expectedOpening,
		},
		{
			description: `the same call with a tab in front of the closing parenthesis`,
			code: `
				a { transform: translate( 1,
				  1
					); }
			`,
			fixed: `
				a { transform: translate( 1,
				  1 ); }
			`,
			line: 3,
			column: 1,
			message: messages.expectedClosing,
		},
		{
			description: `CRLF`,
			code: `a { transform: translate(1,\r\n1 ); }`,
			fixed: `a { transform: translate( 1,\r\n1 ); }`,
			line: 1,
			column: 26,
			message: messages.expectedOpening,
		},
		{
			description: `comments`,
			code: `a { transform: translate(/*comment*/1, 1/*comment*/); }`,
			fixed: `a { transform: translate( /*comment*/1, 1/*comment*/ ); }`,
			warnings: [
				{
					line: 1,
					column: 26,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 51,
					message: messages.expectedClosing,
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
			description: `ignore function without parameters`,
			code: `a { filter: grayscale(); }`,
		},
		{
			description: `ignore function without parameters`,
			code: `a { filter: grayscale( ); }`,
		},
		{
			description: `parentheses spelled inside a string, which open no call`,
			code: `a::before { content: "(a) ( a )"; }`,
		},
		{
			description: `the same parentheses spelled inside a url()`,
			code: `a::before { background: url( 'asdf(Vcxvsd)ASD' ); }`,
		},
		{
			description: `spaces on the inside of both parentheses`,
			code: `a { transform: translate( 1, 1 ); }`,
		},
		{
			description: `nested calls, each with the spaces inside its own parentheses`,
			code: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
		},
		{
			description: `a multi-line call, which this option passes over`,
			code: `
				a { transform: translate(
				  1,
				  1
				); }
			`,
		},
		{
			description: `the same call with spaces and a tab of its own`,
			code: `a { transform: translate(  \n  1,\n  1\n\t); }`,
		},
		{
			description: `CRLF`,
			code: `a { transform: translate(1,\r\n1); }`,
		},
		{
			description: `a multi-line inner call inside a single-line outer one`,
			code: `
				a { color: color(rgb(0,
				0,
				0 ) lightness( 50% )); }
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/244
			description: `form feeds inside the parentheses, which are whitespace and no line break, so the function is single-line and the option asks for a space on the inside`,
			code: `a { b: fn(\f1px\f); }`,
			fixed: `a { b: fn( 1px ); }`,
			warnings: [
				{
					line: 1,
					column: 11,
					message: messages.expectedOpeningSingleLine,
				},
				{
					line: 1,
					column: 15,
					message: messages.expectedClosingSingleLine,
				},
			],
		},
		{
			description: `the second inner call abutting its opening parenthesis, the first broken across lines`,
			code: `
				a { color: color(rgb(0,
				0,
				0 ) lightness(50% )); }
			`,
			fixed: `
				a { color: color(rgb(0,
				0,
				0 ) lightness( 50% )); }
			`,
			line: 3,
			column: 15,
			message: messages.expectedOpeningSingleLine,
		},
		{
			description: `a first argument abutting the opening parenthesis`,
			code: `a { transform: translate(1, 1 ); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			line: 1,
			column: 26,
			message: messages.expectedOpeningSingleLine,
		},
		{
			description: `a last argument abutting the closing parenthesis`,
			code: `a { transform: translate( 1, 1); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			line: 1,
			column: 30,
			message: messages.expectedClosingSingleLine,
		},
		{
			description: `two spaces behind the opening parenthesis`,
			code: `a { transform: translate(  1, 1 ); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			line: 1,
			column: 26,
			message: messages.expectedOpeningSingleLine,
		},
		{
			description: `two spaces in front of the closing parenthesis`,
			code: `a { transform: translate( 1, 1  ); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			line: 1,
			column: 32,
			message: messages.expectedClosingSingleLine,
		},
		{
			description: `the outer opening parenthesis abutting the inner call`,
			code: `a { color: color(rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 18,
			message: messages.expectedOpeningSingleLine,
		},
		{
			description: `an inner call abutting its own opening parenthesis`,
			code: `a { color: color( rgb(0, 0, 0 ) lightness( 50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 23,
			message: messages.expectedOpeningSingleLine,
		},
		{
			description: `an inner call abutting its own closing parenthesis`,
			code: `a { color: color( rgb( 0, 0, 0) lightness( 50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 30,
			message: messages.expectedClosingSingleLine,
		},
		{
			description: `the second inner call abutting its opening parenthesis`,
			code: `a { color: color( rgb( 0, 0, 0 ) lightness(50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 44,
			message: messages.expectedOpeningSingleLine,
		},
		{
			description: `the second inner call abutting its closing parenthesis`,
			code: `a { color: color( rgb( 0, 0, 0 ) lightness( 50%) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 47,
			message: messages.expectedClosingSingleLine,
		},
		{
			description: `the outer closing parenthesis abutting the inner one`,
			code: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% )); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			line: 1,
			column: 49,
			message: messages.expectedClosingSingleLine,
		},
		{
			description: `an argument abutting the opening parenthesis of a one-argument call`,
			code: `a::before { content: attr(data-foo ); }`,
			fixed: `a::before { content: attr( data-foo ); }`,
			line: 1,
			column: 27,
			message: messages.expectedOpeningSingleLine,
		},
		{
			description: `the same argument abutting the closing parenthesis instead`,
			code: `a::before { content: attr( data-foo); }`,
			fixed: `a::before { content: attr( data-foo ); }`,
			line: 1,
			column: 35,
			message: messages.expectedClosingSingleLine,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `ignore function without parameters`,
			code: `a { filter: grayscale(); }`,
		},
		{
			description: `ignore function without parameters`,
			code: `a { filter: grayscale( ); }`,
		},
		{
			description: `parentheses spelled inside a string, which open no call`,
			code: `a::before { content: "(a) ( a )"; }`,
		},
		{
			description: `the same parentheses spelled inside a url()`,
			code: `a::before { background: url('asdf( Vcxvsd )ASD'); }`,
		},
		{
			description: `a call whose arguments abut both parentheses`,
			code: `a { transform: translate(1, 1); }`,
		},
		{
			description: `nested calls, all of them abutting their parentheses`,
			code: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
		},
	],

	reject: [
		{
			description: `a space behind the opening parenthesis`,
			code: `a { transform: translate( 1, 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 26,
			message: messages.rejectedOpening,
		},
		{
			description: `two spaces behind the opening parenthesis`,
			code: `a { transform: translate(  1, 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 26,
			message: messages.rejectedOpening,
		},
		{
			description: `a space in front of the closing parenthesis`,
			code: `a { transform: translate(1, 1 ); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 30,
			message: messages.rejectedClosing,
		},
		{
			description: `two spaces in front of the closing parenthesis`,
			code: `a { transform: translate(1, 1  ); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 31,
			message: messages.rejectedClosing,
		},
		{
			description: `a space behind the outer opening parenthesis`,
			code: `a { color: color( rgb(0, 0, 0) lightness(50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 18,
			message: messages.rejectedOpening,
		},
		{
			description: `a space behind an inner opening parenthesis`,
			code: `a { color: color(rgb( 0, 0, 0) lightness(50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 22,
			message: messages.rejectedOpening,
		},
		{
			description: `a space in front of an inner closing parenthesis`,
			code: `a { color: color(rgb(0, 0, 0 ) lightness(50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 29,
			message: messages.rejectedClosing,
		},
		{
			description: `a space behind the second inner opening parenthesis`,
			code: `a { color: color(rgb(0, 0, 0) lightness( 50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 41,
			message: messages.rejectedOpening,
		},
		{
			description: `a space in front of the second inner closing parenthesis`,
			code: `a { color: color(rgb(0, 0, 0) lightness(50% )); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 44,
			message: messages.rejectedClosing,
		},
		{
			description: `a space in front of the outer closing parenthesis`,
			code: `a { color: color(rgb(0, 0, 0) lightness(50%) ); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 45,
			message: messages.rejectedClosing,
		},
		{
			description: `a space in front of the closing parenthesis of a one-argument call`,
			code: `a::before { content: attr(data-foo ); }`,
			fixed: `a::before { content: attr(data-foo); }`,
			line: 1,
			column: 35,
			message: messages.rejectedClosing,
		},
		{
			description: `a space behind its opening parenthesis instead`,
			code: `a::before { content: attr( data-foo); }`,
			fixed: `a::before { content: attr(data-foo); }`,
			line: 1,
			column: 27,
			message: messages.rejectedOpening,
		},
		{
			description: `a space behind the opening parenthesis of a call broken at its comma`,
			code: `a { transform: translate( 1,\n1); }`,
			fixed: `a { transform: translate(1,\n1); }`,
			line: 1,
			column: 26,
			message: messages.rejectedOpening,
		},
		{
			description: `CRLF`,
			code: `a { transform: translate(1,\r\n  1\r\n); }`,
			fixed: `a { transform: translate(1,\r\n  1); }`,
			line: 2,
			column: 5,
			message: messages.rejectedClosing,
		},
		{
			description: `a space in front of the closing parenthesis of a multi-line inner call`,
			code: `
				a { color: color(rgb(0,
				0,
				0 ) lightness(50%)); }
			`,
			fixed: `
				a { color: color(rgb(0,
				0,
				0) lightness(50%)); }
			`,
			line: 3,
			column: 2,
			message: messages.rejectedClosing,
		},
		{
			description: `comments`,
			code: `a { transform: translate( /*comment*/ 1, 1 /*comment*/ ); }`,
			fixed: `a { transform: translate(/*comment*/ 1, 1 /*comment*/); }`,
			warnings: [
				{
					line: 1,
					column: 26,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 55,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			description: `a double slash of plain CSS opens no comment, so the parenthesis has a line to join and the fix is written`,
			code: `
				a {
					b: translate(1px//c
					);
				}
			`,
			fixed: `
				a {
					b: translate(1px//c);
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/280
			description: `a line break in front of the first argument behind a double slash of plain CSS, which spells no comment there: the guard holds nothing back and the whitespace goes`,
			code: `
				a {
					t: foo(1px // c) calc(
					2px);
				}
			`,
			fixed: `
				a {
					t: foo(1px // c) calc(2px);
				}
			`,
			line: 2,
			column: 24,
			message: messages.rejectedOpening,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/272
			description: `a call standing behind a comment the value parser does not give back as it read it`,
			code: `a { b: x/*/*a*/f( 1 )c; }`,
			fixed: `a { b: x/*/*a*/f(1)c; }`,
			warnings: [
				{
					line: 1,
					column: 18,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 20,
					message: messages.rejectedClosing,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `ignore function without parameters`,
			code: `a { filter: grayscale(); }`,
		},
		{
			description: `ignore function without parameters`,
			code: `a { filter: grayscale( ); }`,
		},
		{
			description: `parentheses spelled inside a string, which open no call`,
			code: `a::before { content: "(a) ( a )"; }`,
		},
		{
			description: `the same parentheses spelled inside a url()`,
			code: `a::before { background: url('asdf( Vcxvsd )ASD'); }`,
		},
		{
			description: `a call whose arguments abut both parentheses`,
			code: `a { transform: translate(1, 1); }`,
		},
		{
			description: `nested calls, all of them abutting their parentheses`,
			code: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
		},
		{
			description: `a multi-line call, which this option passes over`,
			code: `a { transform: translate( 1,\n1 ); }`,
		},
		{
			description: `CRLF`,
			code: `a { transform: translate(\r\n  1,\r\n  1\r\n); }`,
		},
		{
			description: `a multi-line inner call inside a single-line outer one`,
			code: `
				a { color: color(rgb(0,
				0,
				0 ) lightness(50%)); }
			`,
		},
	],

	reject: [
		{
			description: `a space behind the opening parenthesis of the single-line inner call`,
			code: `
				a { color: color(rgb(0,
				0,
				0) lightness( 50%)); }
			`,
			fixed: `
				a { color: color(rgb(0,
				0,
				0) lightness(50%)); }
			`,
			line: 3,
			column: 14,
			message: messages.rejectedOpeningSingleLine,
		},
		{
			description: `a space behind the opening parenthesis`,
			code: `a { transform: translate( 1, 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 26,
			message: messages.rejectedOpeningSingleLine,
		},
		{
			description: `two spaces behind the opening parenthesis`,
			code: `a { transform: translate(  1, 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 26,
			message: messages.rejectedOpeningSingleLine,
		},
		{
			description: `a space in front of the closing parenthesis`,
			code: `a { transform: translate(1, 1 ); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 30,
			message: messages.rejectedClosingSingleLine,
		},
		{
			description: `two spaces in front of the closing parenthesis`,
			code: `a { transform: translate(1, 1  ); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 31,
			message: messages.rejectedClosingSingleLine,
		},
		{
			description: `a space behind the outer opening parenthesis`,
			code: `a { color: color( rgb(0, 0, 0) lightness(50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 18,
			message: messages.rejectedOpeningSingleLine,
		},
		{
			description: `a space behind an inner opening parenthesis`,
			code: `a { color: color(rgb( 0, 0, 0) lightness(50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 22,
			message: messages.rejectedOpeningSingleLine,
		},
		{
			description: `a space in front of an inner closing parenthesis`,
			code: `a { color: color(rgb(0, 0, 0 ) lightness(50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 29,
			message: messages.rejectedClosingSingleLine,
		},
		{
			description: `a space behind the second inner opening parenthesis`,
			code: `a { color: color(rgb(0, 0, 0) lightness( 50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 41,
			message: messages.rejectedOpeningSingleLine,
		},
		{
			description: `a space in front of the second inner closing parenthesis`,
			code: `a { color: color(rgb(0, 0, 0) lightness(50% )); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 44,
			message: messages.rejectedClosingSingleLine,
		},
		{
			description: `a space in front of the outer closing parenthesis`,
			code: `a { color: color(rgb(0, 0, 0) lightness(50%) ); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 45,
			message: messages.rejectedClosingSingleLine,
		},
		{
			description: `a space in front of the closing parenthesis of a one-argument call`,
			code: `a::before { content: attr(data-foo ); }`,
			fixed: `a::before { content: attr(data-foo); }`,
			line: 1,
			column: 35,
			message: messages.rejectedClosingSingleLine,
		},
		{
			description: `a space behind its opening parenthesis instead`,
			code: `a::before { content: attr( data-foo); }`,
			fixed: `a::before { content: attr(data-foo); }`,
			line: 1,
			column: 27,
			message: messages.rejectedOpeningSingleLine,
		},
	],
})
