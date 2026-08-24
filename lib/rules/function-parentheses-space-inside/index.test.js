import { messages, ruleName } from "./index.js"

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
		{
			description: `SCSS map`,
			code: `$map: (key: value, key2: value2)`,
		},
		{
			description: `Sass list ignored`,
			code: `$list: (value, value2)`,
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/244
			description: `a function broken by form feeds, which is no single-line function and whose breaks the fix used to write a space over`,
			code: `a { b: fn(\f1px\f); }`,
		},
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
		{
			description: `SCSS map`,
			code: `$map: (key: value, key2: value2)`,
		},
	],

	reject: [
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
		{
			description: `SCSS map`,
			code: `$map: ( key: value, key2: value2 )`,
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/244
			description: `a function broken by form feeds, which is no single-line function and whose breaks the fix used to write a space over`,
			code: `a { b: fn(\f1px\f); }`,
		},
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
		{
			description: `SCSS map`,
			code: `$map: ( key: value, key2: value2 )`,
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

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a call standing in the text of an inline comment, opening and closing inside the line that comment runs to`,
			code: `a { t: foo(1px // c) calc( d); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `the same call with its arguments a line down, whose closing parenthesis the parser reads out of the code behind the comment`,
			code: `
				a {
					t: foo(1px // c) calc(
					2px);
				}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a call a line below an inline comment, gathered by one the parser opened inside that comment's text: the gathering call is left alone and the one it gathered is spaced where it stands`,
			code: `
				a { b: f(1px // c) calc(
					g( 2 )); }
			`,
			fixed: `
				a { b: f(1px // c) calc(
					g(2)); }
			`,
			warnings: [
				{
					line: 2,
					column: 4,
					message: messages.rejectedOpening,
				},
				{
					line: 2,
					column: 6,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/132
			description: `a form feed with nothing behind it that closes the comment: the reading both syntaxes share has the parenthesis inside the comment before the fix as after it, the reading that counts a form feed has it outside both times, and neither has the fix move it`,
			code: `a { transform: translate(1px, 2px // keep me\f d ); }`,
			fixed: `a { transform: translate(1px, 2px // keep me\f d); }`,
			line: 1,
			column: 48,
			message: messages.rejectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/132
			description: `the same form feed with a line break behind it, which is the break Less does close the comment on: the reading both syntaxes share is the one and only reading that has the parenthesis outside the comment now and inside it after the fix, so the value is left alone`,
			code: `a { transform: translate(1px, 2px // keep me\f d\n); }`,
			fixed: `a { transform: translate(1px, 2px // keep me\f d\n); }`,
			line: 1,
			column: 48,
			message: messages.rejectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/132
			description: `a separator of Unicode, which no reading of a line break here counts and the fix leaves standing: the parenthesis is inside the comment under both readings before the fix as after it, so the fix goes through`,
			code: `a { t: translate(1px, 2px // c\u2028 ); }`,
			fixed: `a { t: translate(1px, 2px // c\u2028); }`,
			line: 1,
			column: 32,
			message: messages.rejectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			description: `a \`/*/\` the value parser prints back one character longer than the file spells it: the parenthesis is still found where it stands`,
			code: `a { transform: translate(1px /*/ d */ 2px // keep me\n); }`,
			fixed: `a { transform: translate(1px /*/ d */ 2px // keep me\n); }`,
			line: 2,
			column: 1,
			message: messages.rejectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			description: `a separator neither syntax ends a comment on: only the line feed behind it closes the comment, and taking that away would leave the parenthesis inside`,
			code: `a { transform: translate(1px, 2px // keep me\u2028\n); }`,
			fixed: `a { transform: translate(1px, 2px // keep me\u2028\n); }`,
			line: 1,
			column: 46,
			message: messages.rejectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			description: `a carriage return closing the comment: the parenthesis stands outside it and must not be pulled in`,
			code: `a { transform: translate(1px,\n2px // keep me\r); }`,
			fixed: `a { transform: translate(1px,\n2px // keep me\r); }`,
			line: 2,
			column: 15,
			message: messages.rejectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			description: `a separator the value parser counts as a word rather than as space: it survives the fix, so the line break it holds keeps the comment closed and the fix goes through`,
			code: `a { transform: translate(1px,\n2px // keep me\n\u2028 ); }`,
			fixed: `a { transform: translate(1px,\n2px // keep me\n\u2028); }`,
			line: 3,
			column: 2,
			message: messages.rejectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			description: `inline comment before the closing parenthesis: the parenthesis cannot join the comment's line, so the value is left alone and the warning stands`,
			code: `
				a {
					transform: translate(1px, 2px // keep me
					);
				}
			`,
			fixed: `
				a {
					transform: translate(1px, 2px // keep me
					);
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedClosing,
		},
		{
			description: `block comment behind the inline one: the parenthesis lands on its line, which the inline comment does not reach, so the fix goes through`,
			code: `
				a {
					transform: translate(1px, 2px // keep me
					/* and me */
					);
				}
			`,
			fixed: `
				a {
					transform: translate(1px, 2px // keep me
					/* and me */);
				}
			`,
			line: 4,
			column: 1,
			message: messages.rejectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			description: `block comment on the inline comment's own line, where the text of the inline one holds it`,
			code: `
				a {
					transform: translate(1px, 2px // keep me /* and me */
					);
				}
			`,
			fixed: `
				a {
					transform: translate(1px, 2px // keep me /* and me */
					);
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedClosing,
		},
		{
			description: `block comment before the closing parenthesis: nothing of it depends on a line break, so the fix goes through`,
			code: `
				a {
					transform: translate(1px, 2px /* keep me */
					);
				}
			`,
			fixed: `
				a {
					transform: translate(1px, 2px /* keep me */);
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedClosing,
		},
		{
			description: `inline comment on the parenthesis's own line: the parenthesis is inside it before the fix as after it, so the fix goes through`,
			code: `
				a {
					transform: translate(1px,
					2px // keep me );
				}
			`,
			fixed: `
				a {
					transform: translate(1px,
					2px // keep me);
				}
			`,
			line: 3,
			column: 16,
			message: messages.rejectedClosing,
		},
		{
			description: `whitespace holding no line break: the comment on the line above closes before the parenthesis, so the fix goes through`,
			code: `
				a {
					transform: translate(1px, // keep me
					2px  );
				}
			`,
			fixed: `
				a {
					transform: translate(1px, // keep me
					2px);
				}
			`,
			line: 3,
			column: 6,
			message: messages.rejectedClosing,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a call standing in the text of an inline comment, whose arguments the parser reads out of the code a line below`,
			code: `
				a {
					t: foo( 1px // c ) calc(
					2px );
				}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/132
			description: `a separator standing where the fix writes: the space the option puts there closes no comment and the separator is no break to either reading, so the parenthesis stands behind the same text before the fix and after and the space goes in`,
			code: `a { t: translate( 1px, 2px // keep me\u2028); }`,
			fixed: `a { t: translate( 1px, 2px // keep me\u2028 ); }`,
			line: 1,
			column: 38,
			message: messages.expectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/132
			description: `the other separator, read the same way as the first`,
			code: `a { t: translate( 1px, 2px // keep me\u2029); }`,
			fixed: `a { t: translate( 1px, 2px // keep me\u2029 ); }`,
			line: 1,
			column: 38,
			message: messages.expectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			description: `a carriage return closing the comment: the parenthesis stands outside it and must not be pulled in`,
			code: `a { transform: translate( 1px,\n2px // keep me\r); }`,
			fixed: `a { transform: translate( 1px,\n2px // keep me\r); }`,
			line: 2,
			column: 15,
			message: messages.expectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			description: `inline comment before the closing parenthesis: the parenthesis cannot join the comment's line, so the value is left alone and the warning stands`,
			code: `
				a {
					transform: translate( 1px, 2px // keep me
					);
				}
			`,
			fixed: `
				a {
					transform: translate( 1px, 2px // keep me
					);
				}
			`,
			line: 3,
			column: 1,
			message: messages.expectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/132
			description: `the same separator in front of the same form feed under the option that would have written a space in its place`,
			code: `a { transform: translate( 1px, 2px //c\u2028\f); }`,
			fixed: `a { transform: translate( 1px, 2px //c\u2028\f); }`,
			line: 1,
			column: 40,
			message: messages.expectedClosing,
		},
		{
			description: `inline comment on the parenthesis's own line: the parenthesis is inside it before the fix as after it, so the fix goes through`,
			code: `
				a {
					transform: translate( 1px,
					2px // keep me);
				}
			`,
			fixed: `
				a {
					transform: translate( 1px,
					2px // keep me );
				}
			`,
			line: 3,
			column: 15,
			message: messages.expectedClosing,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/132
			description: `the separator under a single-line option, which the guard is asked under as well: a function whose only break is one no reading of a line counts is single-line, and the fix goes through here for the reason it does under the plain option`,
			code: `a { t: translate(1px, 2px // c\u2028 ); }`,
			fixed: `a { t: translate(1px, 2px // c\u2028); }`,
			line: 1,
			column: 32,
			message: messages.rejectedClosingSingleLine,
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/132
			description: `the same separator under the option that writes a space in its place`,
			code: `a { t: translate( 1px, 2px // c\u2028); }`,
			fixed: `a { t: translate( 1px, 2px // c\u2028 ); }`,
			line: 1,
			column: 32,
			message: messages.expectedClosingSingleLine,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a call standing in the text of an inline comment, whose arguments the parser reads out of the code a line below`,
			code: `
				a {
					t: foo(1px // c) calc(
					2px);
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `the same call with a form feed inside it, which Sass ends the comment on: the call opens in front of that form feed and stands in the comment's text all the same`,
			code: `a { t: foo(1px // c) calc(\fd); }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a call opened in the text of an inline comment and closed a line below it, whose arguments the parser reads across the break: the call in front of the comment is spaced up as ever, and the call opened inside that text is left alone on both its lines`,
			code: `
				a { b: f( 1 ) // g( 2
					3 ); }
			`,
			fixed: `
				a { b: f(1) // g( 2
					3 ); }
			`,
			warnings: [
				{
					line: 1,
					column: 10,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 12,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			description: `a form feed where the value keeps no copy of its own, so the fix would reach the file: Sass ends the comment there and the parenthesis stands outside it`,
			code: `a { transform: translate(1px, 2px// keep me\f); }`,
			fixed: `a { transform: translate(1px, 2px// keep me\f); }`,
			line: 1,
			column: 44,
			message: messages.rejectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			description: `a form feed, which Sass ends the comment on: the parenthesis stands outside it and must not be pulled in`,
			code: `a { transform: translate(1px,\n2px // keep me\f); }`,
			fixed: `a { transform: translate(1px,\n2px // keep me\f); }`,
			line: 2,
			column: 15,
			message: messages.rejectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/132
			description: `a separator standing in front of the form feed the comment ends on: the reading that counts a form feed is the one and only reading that has the parenthesis outside the comment now and inside it after the fix, and a reading of a line break that no syntax has would answer for neither side of it`,
			code: `a { transform: translate(1px, 2px //c\u2028\f); }`,
			fixed: `a { transform: translate(1px, 2px //c\u2028\f); }`,
			line: 1,
			column: 39,
			message: messages.rejectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			description: `inline comment before the closing parenthesis: the parenthesis cannot join the comment's line, so the value is left alone and the warning stands`,
			code: `
				a {
					transform: translate(1px, 2px // keep me
					);
				}
			`,
			fixed: `
				a {
					transform: translate(1px, 2px // keep me
					);
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/280
			description: `a form feed closing the comment in front of the call, and a line break where the first argument opens: the reading that counts no form feed has that argument outside the comment as the value stands and inside it once the fix has run, so the value is left alone and the warning stands`,
			code: `a { t: 1px // c\fcalc(\n2px); }`,
			fixed: `a { t: 1px // c\fcalc(\n2px); }`,
			line: 1,
			column: 22,
			message: messages.rejectedOpening,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/280
			description: `the same comment with a space where that line break stood: the argument is inside the comment before the fix as after it under the reading that counts no form feed, and outside it both times under the reading that counts one, so the fix goes through`,
			code: `a { t: 1px // c\fcalc( d); }`,
			fixed: `a { t: 1px // c\fcalc(d); }`,
			line: 1,
			column: 22,
			message: messages.rejectedOpening,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/280
			description: `a separator of Unicode standing where the first argument opens, which the value parser counts as no whitespace and the fix leaves standing: the line break in front of it is the one the fix takes away, and the guard reads it as such rather than trimming the separator away with it`,
			code: `a { t: 1px // c\fcalc(\n\u2028x); }`,
			fixed: `a { t: 1px // c\fcalc(\n\u2028x); }`,
			line: 1,
			column: 22,
			message: messages.rejectedOpening,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/131
			description: `a function the value parser marks unclosed, its closing parenthesis swallowed by a comment the file never closes, which is left alone warning and all`,
			code: `
				a {
					transform: translate(1px, 2px // a /*
					);
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a call standing in the text of an inline comment, whose arguments the parser reads out of the code a line below`,
			code: `
				a {
					t: foo( 1px // c ) calc(
					2px );
				}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/131
			description: `a closed call standing inside such a function, which is read and fixed where it stands`,
			code: `
				a {
					transform: translate(1px, calc(1 + 2) // a /*
					);
				}
			`,
			fixed: `
				a {
					transform: translate(1px, calc( 1 + 2 ) // a /*
					);
				}
			`,
			warnings: [
				{
					line: 2,
					column: 33,
					message: messages.expectedOpening,
				},
				{
					line: 2,
					column: 37,
					message: messages.expectedClosing,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			description: `inline comment before the closing parenthesis: the parenthesis cannot join the comment's line, so the value is left alone and the warning stands`,
			code: `
				a {
					transform: translate( 1px, 2px // keep me
					);
				}
			`,
			fixed: `
				a {
					transform: translate( 1px, 2px // keep me
					);
				}
			`,
			line: 3,
			column: 1,
			message: messages.expectedClosing,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/280
			description: `a form feed closing the comment in front of the call, and a line break where the first argument opens: the reading that counts no form feed has that argument outside the comment as the value stands and inside it once the fix has run, so the value is left alone and the warning stands`,
			code: `a { t: 1px // c\fcalc(\n2px ); }`,
			fixed: `a { t: 1px // c\fcalc(\n2px ); }`,
			line: 1,
			column: 22,
			message: messages.expectedOpening,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/244
			description: `a function broken by the form feed that closes its inline comment, which is a multi-line function and so none of this option's business`,
			code: `a { transform: translate(1px, 2px// keep me\f); }`,
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/244
			description: `the same break under the option that would have written a space in its place`,
			code: `a { transform: translate( 1px, 2px// keep me\f ); }`,
		},
	],
})
