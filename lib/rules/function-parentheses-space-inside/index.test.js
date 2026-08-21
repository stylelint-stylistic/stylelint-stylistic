import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a { filter: grayscale(); }`,
			description: `ignore function without parameters`,
		},
		{
			code: `a { filter: grayscale( ); }`,
			description: `ignore function without parameters`,
		},
		{
			code: `a::before { content: "(a) ( a )"; }`,
			description: `parentheses spelled inside a string, which open no call`,
		},
		{
			code: `a::before { background: url( 'asdf(Vcxvsd)ASD' ); }`,
			description: `the same parentheses spelled inside a url()`,
		},
		{
			code: `a { transform: translate( 1, 1 ); }`,
			description: `spaces on the inside of both parentheses`,
		},
		{
			code: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			description: `nested calls, each with the spaces inside its own parentheses`,
		},
		{
			code: `$map: (key: value, key2: value2)`,
			description: `SCSS map`,
		},
		{
			code: `$list: (value, value2)`,
			description: `Sass list ignored`,
		},
	],

	reject: [
		{
			code: `a { transform: translate(1, 1 ); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			description: `a first argument abutting the opening parenthesis`,
			message: messages.expectedOpening,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate( 1, 1); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			description: `a last argument abutting the closing parenthesis`,
			message: messages.expectedClosing,
			line: 1,
			column: 30,
		},
		{
			code: `a { transform: translate(  1, 1 ); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			description: `two spaces behind the opening parenthesis`,
			message: messages.expectedOpening,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate( 1, 1  ); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			description: `two spaces in front of the closing parenthesis`,
			message: messages.expectedClosing,
			line: 1,
			column: 32,
		},
		{
			code: `a { color: color(rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			description: `the outer opening parenthesis abutting the inner call`,
			message: messages.expectedOpening,
			line: 1,
			column: 18,
		},
		{
			code: `a { color: color( rgb(0, 0, 0 ) lightness( 50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			description: `an inner call abutting its own opening parenthesis`,
			message: messages.expectedOpening,
			line: 1,
			column: 23,
		},
		{
			code: `a { color: color( rgb( 0, 0, 0) lightness( 50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			description: `an inner call abutting its own closing parenthesis`,
			message: messages.expectedClosing,
			line: 1,
			column: 30,
		},
		{
			code: `a { color: color( rgb( 0, 0, 0 ) lightness(50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			description: `the second inner call abutting its opening parenthesis`,
			message: messages.expectedOpening,
			line: 1,
			column: 44,
		},
		{
			code: `a { color: color( rgb( 0, 0, 0 ) lightness( 50%) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			description: `the second inner call abutting its closing parenthesis`,
			message: messages.expectedClosing,
			line: 1,
			column: 47,
		},
		{
			code: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% )); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			description: `the outer closing parenthesis abutting the inner one`,
			message: messages.expectedClosing,
			line: 1,
			column: 49,
		},
		{
			code: `a::before { content: attr(data-foo ); }`,
			fixed: `a::before { content: attr( data-foo ); }`,
			description: `an argument abutting the opening parenthesis of a one-argument call`,
			message: messages.expectedOpening,
			line: 1,
			column: 27,
		},
		{
			code: `a::before { content: attr( data-foo); }`,
			fixed: `a::before { content: attr( data-foo ); }`,
			description: `the same argument abutting the closing parenthesis instead`,
			message: messages.expectedClosing,
			line: 1,
			column: 35,
		},
		{
			code: `a { transform: translate(\n  1,\n  1 ); }`,
			fixed: `a { transform: translate( 1,\n  1 ); }`,
			description: `a call broken across lines whose first argument abuts the parenthesis`,
			message: messages.expectedOpening,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate( 1,\n  1\n\t); }`,
			fixed: `a { transform: translate( 1,\n  1 ); }`,
			description: `the same call with a tab in front of the closing parenthesis`,
			message: messages.expectedClosing,
			line: 3,
			column: 1,
		},
		{
			code: `a { transform: translate(1,\r\n1 ); }`,
			fixed: `a { transform: translate( 1,\r\n1 ); }`,
			description: `CRLF`,
			message: messages.expectedOpening,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate(/*comment*/1, 1/*comment*/); }`,
			fixed: `a { transform: translate( /*comment*/1, 1/*comment*/ ); }`,
			description: `comments`,
			warnings: [
				{
					message: messages.expectedOpening,
					line: 1,
					column: 26,
				},
				{
					message: messages.expectedClosing,
					line: 1,
					column: 51,
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
			code: `a { filter: grayscale(); }`,
			description: `ignore function without parameters`,
		},
		{
			code: `a { filter: grayscale( ); }`,
			description: `ignore function without parameters`,
		},
		{
			code: `a::before { content: "(a) ( a )"; }`,
			description: `parentheses spelled inside a string, which open no call`,
		},
		{
			code: `a::before { background: url( 'asdf(Vcxvsd)ASD' ); }`,
			description: `the same parentheses spelled inside a url()`,
		},
		{
			code: `a { transform: translate( 1, 1 ); }`,
			description: `spaces on the inside of both parentheses`,
		},
		{
			code: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			description: `nested calls, each with the spaces inside its own parentheses`,
		},
		{
			code: `a { transform: translate(\n  1,\n  1\n); }`,
			description: `a multi-line call, which this option passes over`,
		},
		{
			code: `a { transform: translate(  \n  1,\n  1\n\t); }`,
			description: `the same call with spaces and a tab of its own`,
		},
		{
			code: `a { transform: translate(1,\r\n1); }`,
			description: `CRLF`,
		},
		{
			code: `a { color: color(rgb(0,\n0,\n0 ) lightness( 50% )); }`,
			description: `a multi-line inner call inside a single-line outer one`,
		},
		{
			code: `$map: (key: value, key2: value2)`,
			description: `SCSS map`,
		},
	],

	reject: [
		{
			code: `a { color: color(rgb(0,\n0,\n0 ) lightness(50% )); }`,
			fixed: `a { color: color(rgb(0,\n0,\n0 ) lightness( 50% )); }`,
			description: `the second inner call abutting its opening parenthesis, the first broken across lines`,
			message: messages.expectedOpeningSingleLine,
			line: 3,
			column: 15,
		},
		{
			code: `a { transform: translate(1, 1 ); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			description: `a first argument abutting the opening parenthesis`,
			message: messages.expectedOpeningSingleLine,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate( 1, 1); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			description: `a last argument abutting the closing parenthesis`,
			message: messages.expectedClosingSingleLine,
			line: 1,
			column: 30,
		},
		{
			code: `a { transform: translate(  1, 1 ); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			description: `two spaces behind the opening parenthesis`,
			message: messages.expectedOpeningSingleLine,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate( 1, 1  ); }`,
			fixed: `a { transform: translate( 1, 1 ); }`,
			description: `two spaces in front of the closing parenthesis`,
			message: messages.expectedClosingSingleLine,
			line: 1,
			column: 32,
		},
		{
			code: `a { color: color(rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			description: `the outer opening parenthesis abutting the inner call`,
			message: messages.expectedOpeningSingleLine,
			line: 1,
			column: 18,
		},
		{
			code: `a { color: color( rgb(0, 0, 0 ) lightness( 50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			description: `an inner call abutting its own opening parenthesis`,
			message: messages.expectedOpeningSingleLine,
			line: 1,
			column: 23,
		},
		{
			code: `a { color: color( rgb( 0, 0, 0) lightness( 50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			description: `an inner call abutting its own closing parenthesis`,
			message: messages.expectedClosingSingleLine,
			line: 1,
			column: 30,
		},
		{
			code: `a { color: color( rgb( 0, 0, 0 ) lightness(50% ) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			description: `the second inner call abutting its opening parenthesis`,
			message: messages.expectedOpeningSingleLine,
			line: 1,
			column: 44,
		},
		{
			code: `a { color: color( rgb( 0, 0, 0 ) lightness( 50%) ); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			description: `the second inner call abutting its closing parenthesis`,
			message: messages.expectedClosingSingleLine,
			line: 1,
			column: 47,
		},
		{
			code: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% )); }`,
			fixed: `a { color: color( rgb( 0, 0, 0 ) lightness( 50% ) ); }`,
			description: `the outer closing parenthesis abutting the inner one`,
			message: messages.expectedClosingSingleLine,
			line: 1,
			column: 49,
		},
		{
			code: `a::before { content: attr(data-foo ); }`,
			fixed: `a::before { content: attr( data-foo ); }`,
			description: `an argument abutting the opening parenthesis of a one-argument call`,
			message: messages.expectedOpeningSingleLine,
			line: 1,
			column: 27,
		},
		{
			code: `a::before { content: attr( data-foo); }`,
			fixed: `a::before { content: attr( data-foo ); }`,
			description: `the same argument abutting the closing parenthesis instead`,
			message: messages.expectedClosingSingleLine,
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
			code: `a { filter: grayscale(); }`,
			description: `ignore function without parameters`,
		},
		{
			code: `a { filter: grayscale( ); }`,
			description: `ignore function without parameters`,
		},
		{
			code: `a::before { content: "(a) ( a )"; }`,
			description: `parentheses spelled inside a string, which open no call`,
		},
		{
			code: `a::before { background: url('asdf( Vcxvsd )ASD'); }`,
			description: `the same parentheses spelled inside a url()`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
			description: `a call whose arguments abut both parentheses`,
		},
		{
			code: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			description: `nested calls, all of them abutting their parentheses`,
		},
		{
			code: `$map: ( key: value, key2: value2 )`,
			description: `SCSS map`,
		},
	],

	reject: [
		{
			code: `a { transform: translate( 1, 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			description: `a space behind the opening parenthesis`,
			message: messages.rejectedOpening,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate(  1, 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			description: `two spaces behind the opening parenthesis`,
			message: messages.rejectedOpening,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate(1, 1 ); }`,
			fixed: `a { transform: translate(1, 1); }`,
			description: `a space in front of the closing parenthesis`,
			message: messages.rejectedClosing,
			line: 1,
			column: 30,
		},
		{
			code: `a { transform: translate(1, 1  ); }`,
			fixed: `a { transform: translate(1, 1); }`,
			description: `two spaces in front of the closing parenthesis`,
			message: messages.rejectedClosing,
			line: 1,
			column: 31,
		},
		{
			code: `a { color: color( rgb(0, 0, 0) lightness(50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			description: `a space behind the outer opening parenthesis`,
			message: messages.rejectedOpening,
			line: 1,
			column: 18,
		},
		{
			code: `a { color: color(rgb( 0, 0, 0) lightness(50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			description: `a space behind an inner opening parenthesis`,
			message: messages.rejectedOpening,
			line: 1,
			column: 22,
		},
		{
			code: `a { color: color(rgb(0, 0, 0 ) lightness(50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			description: `a space in front of an inner closing parenthesis`,
			message: messages.rejectedClosing,
			line: 1,
			column: 29,
		},
		{
			code: `a { color: color(rgb(0, 0, 0) lightness( 50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			description: `a space behind the second inner opening parenthesis`,
			message: messages.rejectedOpening,
			line: 1,
			column: 41,
		},
		{
			code: `a { color: color(rgb(0, 0, 0) lightness(50% )); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			description: `a space in front of the second inner closing parenthesis`,
			message: messages.rejectedClosing,
			line: 1,
			column: 44,
		},
		{
			code: `a { color: color(rgb(0, 0, 0) lightness(50%) ); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			description: `a space in front of the outer closing parenthesis`,
			message: messages.rejectedClosing,
			line: 1,
			column: 45,
		},
		{
			code: `a::before { content: attr(data-foo ); }`,
			fixed: `a::before { content: attr(data-foo); }`,
			description: `a space in front of the closing parenthesis of a one-argument call`,
			message: messages.rejectedClosing,
			line: 1,
			column: 35,
		},
		{
			code: `a::before { content: attr( data-foo); }`,
			fixed: `a::before { content: attr(data-foo); }`,
			description: `a space behind its opening parenthesis instead`,
			message: messages.rejectedOpening,
			line: 1,
			column: 27,
		},
		{
			code: `a { transform: translate( 1,\n1); }`,
			fixed: `a { transform: translate(1,\n1); }`,
			description: `a space behind the opening parenthesis of a call broken at its comma`,
			message: messages.rejectedOpening,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate(1,\r\n  1\r\n); }`,
			fixed: `a { transform: translate(1,\r\n  1); }`,
			description: `CRLF`,
			message: messages.rejectedClosing,
			line: 2,
			column: 5,
		},
		{
			code: `a { color: color(rgb(0,\n0,\n0 ) lightness(50%)); }`,
			fixed: `a { color: color(rgb(0,\n0,\n0) lightness(50%)); }`,
			description: `a space in front of the closing parenthesis of a multi-line inner call`,
			message: messages.rejectedClosing,
			line: 3,
			column: 2,
		},
		{
			code: `a { transform: translate( /*comment*/ 1, 1 /*comment*/ ); }`,
			fixed: `a { transform: translate(/*comment*/ 1, 1 /*comment*/); }`,
			description: `comments`,
			warnings: [
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 26,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 55,
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
			message: messages.rejectedClosing,
			line: 3,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			code: `a { filter: grayscale(); }`,
			description: `ignore function without parameters`,
		},
		{
			code: `a { filter: grayscale( ); }`,
			description: `ignore function without parameters`,
		},
		{
			code: `a::before { content: "(a) ( a )"; }`,
			description: `parentheses spelled inside a string, which open no call`,
		},
		{
			code: `a::before { background: url('asdf( Vcxvsd )ASD'); }`,
			description: `the same parentheses spelled inside a url()`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
			description: `a call whose arguments abut both parentheses`,
		},
		{
			code: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			description: `nested calls, all of them abutting their parentheses`,
		},
		{
			code: `a { transform: translate( 1,\n1 ); }`,
			description: `a multi-line call, which this option passes over`,
		},
		{
			code: `a { transform: translate(\r\n  1,\r\n  1\r\n); }`,
			description: `CRLF`,
		},
		{
			code: `a { color: color(rgb(0,\n0,\n0 ) lightness(50%)); }`,
			description: `a multi-line inner call inside a single-line outer one`,
		},
		{
			code: `$map: ( key: value, key2: value2 )`,
			description: `SCSS map`,
		},
	],

	reject: [
		{
			code: `a { color: color(rgb(0,\n0,\n0) lightness( 50%)); }`,
			fixed: `a { color: color(rgb(0,\n0,\n0) lightness(50%)); }`,
			description: `a space behind the opening parenthesis of the single-line inner call`,
			message: messages.rejectedOpeningSingleLine,
			line: 3,
			column: 14,
		},
		{
			code: `a { transform: translate( 1, 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			description: `a space behind the opening parenthesis`,
			message: messages.rejectedOpeningSingleLine,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate(  1, 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			description: `two spaces behind the opening parenthesis`,
			message: messages.rejectedOpeningSingleLine,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate(1, 1 ); }`,
			fixed: `a { transform: translate(1, 1); }`,
			description: `a space in front of the closing parenthesis`,
			message: messages.rejectedClosingSingleLine,
			line: 1,
			column: 30,
		},
		{
			code: `a { transform: translate(1, 1  ); }`,
			fixed: `a { transform: translate(1, 1); }`,
			description: `two spaces in front of the closing parenthesis`,
			message: messages.rejectedClosingSingleLine,
			line: 1,
			column: 31,
		},
		{
			code: `a { color: color( rgb(0, 0, 0) lightness(50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			description: `a space behind the outer opening parenthesis`,
			message: messages.rejectedOpeningSingleLine,
			line: 1,
			column: 18,
		},
		{
			code: `a { color: color(rgb( 0, 0, 0) lightness(50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			description: `a space behind an inner opening parenthesis`,
			message: messages.rejectedOpeningSingleLine,
			line: 1,
			column: 22,
		},
		{
			code: `a { color: color(rgb(0, 0, 0 ) lightness(50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			description: `a space in front of an inner closing parenthesis`,
			message: messages.rejectedClosingSingleLine,
			line: 1,
			column: 29,
		},
		{
			code: `a { color: color(rgb(0, 0, 0) lightness( 50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			description: `a space behind the second inner opening parenthesis`,
			message: messages.rejectedOpeningSingleLine,
			line: 1,
			column: 41,
		},
		{
			code: `a { color: color(rgb(0, 0, 0) lightness(50% )); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			description: `a space in front of the second inner closing parenthesis`,
			message: messages.rejectedClosingSingleLine,
			line: 1,
			column: 44,
		},
		{
			code: `a { color: color(rgb(0, 0, 0) lightness(50%) ); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			description: `a space in front of the outer closing parenthesis`,
			message: messages.rejectedClosingSingleLine,
			line: 1,
			column: 45,
		},
		{
			code: `a::before { content: attr(data-foo ); }`,
			fixed: `a::before { content: attr(data-foo); }`,
			description: `a space in front of the closing parenthesis of a one-argument call`,
			message: messages.rejectedClosingSingleLine,
			line: 1,
			column: 35,
		},
		{
			code: `a::before { content: attr( data-foo); }`,
			fixed: `a::before { content: attr(data-foo); }`,
			description: `a space behind its opening parenthesis instead`,
			message: messages.rejectedOpeningSingleLine,
			line: 1,
			column: 27,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			code: `a { transform: translate(1px, 2px // keep me\f d ); }`,
			fixed: `a { transform: translate(1px, 2px // keep me\f d ); }`,
			description: `a form feed Less reads no line in: the copies are one and the same text here, and reading them as two would rewrite it into a line feed and let the fix take the parenthesis into the comment`,
			message: messages.rejectedClosing,
			line: 1,
			column: 48,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			code: `a { transform: translate(1px /*/ d */ 2px // keep me\n); }`,
			fixed: `a { transform: translate(1px /*/ d */ 2px // keep me\n); }`,
			description: `a \`/*/\` the value parser prints back one character longer than the file spells it: the parenthesis is still found where it stands`,
			message: messages.rejectedClosing,
			line: 2,
			column: 1,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			code: `a { transform: translate(1px, 2px // keep me\u2028\n); }`,
			fixed: `a { transform: translate(1px, 2px // keep me\u2028\n); }`,
			description: `a separator neither syntax ends a comment on: only the line feed behind it closes the comment, and taking that away would leave the parenthesis inside`,
			message: messages.rejectedClosing,
			line: 1,
			column: 46,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			code: `a { transform: translate(1px,\n2px // keep me\r); }`,
			fixed: `a { transform: translate(1px,\n2px // keep me\r); }`,
			description: `a carriage return closing the comment: the parenthesis stands outside it and must not be pulled in`,
			message: messages.rejectedClosing,
			line: 2,
			column: 15,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			code: `a { transform: translate(1px,\n2px // keep me\n\u2028 ); }`,
			fixed: `a { transform: translate(1px,\n2px // keep me\n\u2028); }`,
			description: `a separator the value parser counts as a word rather than as space: it survives the fix, so the line break it holds keeps the comment closed and the fix goes through`,
			message: messages.rejectedClosing,
			line: 3,
			column: 2,
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
			message: messages.rejectedClosing,
			line: 3,
			column: 1,
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
			message: messages.rejectedClosing,
			line: 4,
			column: 1,
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
			message: messages.rejectedClosing,
			line: 3,
			column: 1,
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
			message: messages.rejectedClosing,
			line: 3,
			column: 1,
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
			message: messages.rejectedClosing,
			line: 3,
			column: 16,
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
			message: messages.rejectedClosing,
			line: 3,
			column: 6,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			code: `a { t: translate( 1px, 2px // keep me\u2029); }`,
			fixed: `a { t: translate( 1px, 2px // keep me\u2029); }`,
			description: `the other separator, counted by the same question as the first`,
			message: messages.expectedClosing,
			line: 1,
			column: 38,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			code: `a { t: translate( 1px, 2px // keep me\u2028); }`,
			fixed: `a { t: translate( 1px, 2px // keep me\u2028); }`,
			description: `a separator standing where the fix writes: the question that grants the fix counts it as a break, so that a syntax reading a line in one is never answered for`,
			message: messages.expectedClosing,
			line: 1,
			column: 38,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			code: `a { transform: translate( 1px,\n2px // keep me\r); }`,
			fixed: `a { transform: translate( 1px,\n2px // keep me\r); }`,
			description: `a carriage return closing the comment: the parenthesis stands outside it and must not be pulled in`,
			message: messages.expectedClosing,
			line: 2,
			column: 15,
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
			message: messages.expectedClosing,
			line: 3,
			column: 1,
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
			message: messages.expectedClosing,
			line: 3,
			column: 15,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			code: `a { transform: translate(1px, 2px// keep me\f); }`,
			fixed: `a { transform: translate(1px, 2px// keep me\f); }`,
			description: `a form feed where the value keeps no copy of its own, so the fix would reach the file: Sass ends the comment there and the parenthesis stands outside it`,
			message: messages.rejectedClosing,
			line: 1,
			column: 44,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			code: `a { transform: translate(1px,\n2px // keep me\f); }`,
			fixed: `a { transform: translate(1px,\n2px // keep me\f); }`,
			description: `a form feed, which Sass ends the comment on: the parenthesis stands outside it and must not be pulled in`,
			message: messages.rejectedClosing,
			line: 2,
			column: 15,
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
			message: messages.rejectedClosing,
			line: 3,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
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
			message: messages.expectedClosing,
			line: 3,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			code: `a { transform: translate(1px, 2px// keep me\f); }`,
			fixed: `a { transform: translate(1px, 2px// keep me\f); }`,
			description: `a form feed is a line to Sass and no line to \`isSingleLineString\`, so this option meets a comment after all and must not take the break away`,
			message: messages.rejectedClosingSingleLine,
			line: 1,
			column: 44,
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114
			code: `a { transform: translate( 1px, 2px// keep me\f ); }`,
			fixed: `a { transform: translate( 1px, 2px// keep me\f ); }`,
			description: `the same break under the option that writes a space in its place`,
			message: messages.expectedClosingSingleLine,
			line: 1,
			column: 46,
		},
	],
})
