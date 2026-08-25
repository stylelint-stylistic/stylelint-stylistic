import { messages, ruleName } from "./index.js"

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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/246
			description: `the same breaks spelled with bare carriage returns`,
			code: `a { transform: translate(\r1, 1\r); }`,
		},
		{
			description: `the same breaks spelled with form feeds`,
			code: `a { transform: translate(\f1, 1\f); }`,
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
			description: `an SCSS map, whose parentheses open no call`,
			code: `$map: (key: value,key2: value2)`,
		},
		{
			description: `an SCSS list, whose parentheses open no call either`,
			code: `$list: (value, value2)`,
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/246
			description: `a bare carriage return behind the opening parenthesis and nothing in front of the closing one`,
			code: `a { transform: translate(\r1, 1); }`,
			fixed: `a { transform: translate(\r1, 1\n); }`,
			line: 1,
			column: 30,
			message: messages.expectedClosing,
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/246
			description: `the same breaks spelled with bare carriage returns`,
			code: `a { transform: translate(\r1, 1\r); }`,
		},
		{
			description: `the same breaks spelled with form feeds`,
			code: `a { transform: translate(\f1, 1\f); }`,
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
			description: `an SCSS map broken across lines, whose parentheses open no call`,
			code: `$map: (key: value,\nkey2: value2)`,
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/246
			description: `a form feed in front of the closing parenthesis and nothing behind the opening one`,
			code: `a { b: fn(1,\f2\f); }`,
			fixed: `a { b: fn(\n1,\f2\f); }`,
			line: 1,
			column: 11,
			message: messages.expectedOpeningMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/244
			description: `a function whose only break is a form feed, which makes it multi-line like any other break`,
			code: `a { b: fn(1,\f2); }`,
			fixed: `a { b: fn(\n1,\f2\n); }`,
			warnings: [
				{
					line: 1,
					column: 11,
					message: messages.expectedOpeningMultiLine,
				},
				{
					line: 1,
					column: 14,
					message: messages.expectedClosingMultiLine,
				},
			],
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
			description: `an SCSS map broken on the inside of both parentheses`,
			code: `
				$map: (
				key: value,
				key2: value2
				)
			`,
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

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/113
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
			message: messages.rejectedClosingMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/113
			description: `block comment behind the inline one: the fix closes the whole run up, so the parenthesis would land in the inline comment all the same`,
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
					/* and me */
					);
				}
			`,
			line: 4,
			column: 1,
			message: messages.rejectedClosingMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/113
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
			message: messages.rejectedClosingMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/113
			description: `a slash of the value standing in front of a comment's own: closing the gap up would open a comment that was never there`,
			code: `
				a {
					width: calc(100%
					/ /* cols */);
				}
			`,
			fixed: `
				a {
					width: calc(100%
					/ /* cols */);
				}
			`,
			line: 3,
			column: 13,
			message: messages.rejectedClosingMultiLine,
		},
		{
			description: `the same junction with a line break in the gap`,
			code: `
				a {
					width: calc(100%
					/ /* cols */
					);
				}
			`,
			fixed: `
				a {
					width: calc(100%
					/ /* cols */
					);
				}
			`,
			line: 4,
			column: 1,
			message: messages.rejectedClosingMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/113
			description: `a form feed, which Sass ends the comment on and Less does not: the reading that counts a form feed is the one and only reading that has the parenthesis outside the comment now and inside it after the fix, and the value is left alone on its word`,
			code: `a { transform: translate(1px,\n2px // keep me\f); }`,
			fixed: `a { transform: translate(1px,\n2px // keep me\f); }`,
			line: 2,
			column: 15,
			message: messages.rejectedClosingMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/132
			description: `the same form feed with a line break behind it, which is the break Less does close the comment on: the reading both syntaxes share declines this one and it alone`,
			code: `a { transform: translate(1px,\n2px // keep me\f d\n); }`,
			fixed: `a { transform: translate(1px,\n2px // keep me\f d\n); }`,
			line: 2,
			column: 18,
			message: messages.rejectedClosingMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/132
			description: `a separator of Unicode, which no reading of a line break here counts and the fix leaves standing: the parenthesis is inside the comment under both readings before the fix as after it, so the fix goes through`,
			code: `a { t: translate(1px,\n2px // c\u2028 ); }`,
			fixed: `a { t: translate(1px,\n2px // c\u2028); }`,
			line: 2,
			column: 10,
			message: messages.rejectedClosingMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/113
			description: `a carriage return closing the comment: it is a line break of CSS like any other, so the parenthesis cannot join that line`,
			code: `a { transform: translate(1px, 2px // keep me\r); }`,
			fixed: `a { transform: translate(1px, 2px // keep me\r); }`,
			line: 1,
			column: 45,
			message: messages.rejectedClosingMultiLine,
		},
		{
			description: `a carriage return closing the comment in front of the last argument: the parenthesis follows code, so the fix goes through`,
			code: `a { transform: translate(1px // keep me\r2px ); }`,
			fixed: `a { transform: translate(1px // keep me\r2px); }`,
			line: 1,
			column: 44,
			message: messages.rejectedClosingMultiLine,
		},
		{
			description: `comma ending the line the inline comment holds: the function keeps that line break in the comma, so the parenthesis lands on the block comment's line`,
			code: `
				a {
					transform: translate(1px, // keep me,
					/* and me */
					);
				}
			`,
			fixed: `
				a {
					transform: translate(1px, // keep me,
					/* and me */);
				}
			`,
			line: 4,
			column: 1,
			message: messages.rejectedClosingMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/113
			description: `a \`/*/\` the value parser reads as a comment of its own and prints one character longer than the file spells it`,
			code: `
				a {
					transform: translate(1px // keep me
					/*/ /* and me */);
				}
			`,
			fixed: `
				a {
					transform: translate(1px // keep me
					/*/ /* and me */);
				}
			`,
			line: 3,
			column: 18,
			message: messages.rejectedClosingMultiLine,
		},
		{
			description: `block comment standing alone: nothing of it depends on a line break, so the fix goes through`,
			code: `
				a {
					transform: translate(1px, 2px
					/* keep me */
					);
				}
			`,
			fixed: `
				a {
					transform: translate(1px, 2px/* keep me */);
				}
			`,
			line: 4,
			column: 1,
			message: messages.rejectedClosingMultiLine,
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
					transform: translate(1px, 2px/* keep me */);
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedClosingMultiLine,
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
			message: messages.rejectedClosingMultiLine,
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
			message: messages.rejectedClosingMultiLine,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/131
			description: `a function the value parser marks unclosed, where the whitespace this option counts stands inside the text of the comment rather than in front of the parenthesis`,
			code: `
				a {
					transform: translate(1px, 2px // a /*
					);
				}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/113
			description: `a form feed, which Sass ends the comment on: the parenthesis stands outside the comment and must not be pulled into it`,
			code: `a { transform: translate(1px,\n2px // keep me\f); }`,
			fixed: `a { transform: translate(1px,\n2px // keep me\f); }`,
			line: 2,
			column: 15,
			message: messages.rejectedClosingMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/132
			description: `a separator standing in front of the form feed the comment ends on: the reading that counts a form feed is the one and only reading that has the parenthesis outside the comment now and inside it after the fix, and a reading of a line break that no syntax has would answer for neither side of it`,
			code: `a { transform: translate(1px,\n2px //c\u2028\f); }`,
			fixed: `a { transform: translate(1px,\n2px //c\u2028\f); }`,
			line: 2,
			column: 9,
			message: messages.rejectedClosingMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/113
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
			message: messages.rejectedClosingMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/281
			description: `a form feed closing the comment in front of the call, and a line break where the first argument opens: the reading that counts no form feed has that argument outside the comment as the value stands and inside it once the fix has run, so the value is left alone and the warning stands`,
			code: `a { t: 1px // c\fcalc(\n2px); }`,
			fixed: `a { t: 1px // c\fcalc(\n2px); }`,
			line: 1,
			column: 22,
			message: messages.rejectedOpeningMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/311
			description: `a form feed closing the comment in front of the call, with a block comment first inside it: Sass has the argument outside the comment on either side of the fix, and the reading Less has, which this file is not written in, is what holds the fix back`,
			code: `a { t: 1px // c\fcalc(\n/*b*/ 2px); }`,
			fixed: `a { t: 1px // c\fcalc(\n/*b*/ 2px); }`,
			line: 1,
			column: 22,
			message: messages.rejectedOpeningMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/281
			description: `the same form feed with the first argument standing inside the comment, so that emptying the whitespace moves that argument nowhere it was not: the closing parenthesis is a line down and cannot be pulled up, and the warning about it stands where it is`,
			code: `a { t: 1px // c\fcalc( 2px\n ); }`,
			fixed: `a { t: 1px // c\fcalc(2px\n ); }`,
			warnings: [
				{
					line: 1,
					column: 22,
					message: messages.rejectedOpeningMultiLine,
				},
				{
					line: 2,
					column: 1,
					message: messages.rejectedClosingMultiLine,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/281
			description: `a comma carrying the line break in front of it, which the value parser hangs on the comma rather than emitting a node of its own for: that break is none of the whitespace the option asks to be gone, so the comma stands outside the comment before the fix as after it`,
			code: `a { t: 1px // c\fcalc(\n /*x*/\n , 2px); }`,
			fixed: `a { t: 1px // c\fcalc(/*x*/\n , 2px); }`,
			line: 1,
			column: 22,
			message: messages.rejectedOpeningMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/312
			description: `a call holding nothing but a block comment behind that form feed, so that both questions are about its closing parenthesis: each fix on its own is weighed against a value still holding the break the other one would take away, and the two together would take every break the call has`,
			code: `a { t: 1px // c\fcalc(\n/*b*/\n); }`,
			fixed: `a { t: 1px // c\fcalc(\n/*b*/\n); }`,
			warnings: [
				{
					line: 1,
					column: 22,
					message: messages.rejectedOpeningMultiLine,
				},
				{
					line: 2,
					column: 6,
					message: messages.rejectedClosingMultiLine,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/312
			description: `the same call holding two block comments, whose one whitespace node the walk out from the opening parenthesis and the walk back from the closing one both empty, so that the two lists of stretches folded into what the fixes are weighed by name it once each`,
			code: `a { t: 1px // c\fcalc(\n/*b*/\n/*d*/\n); }`,
			fixed: `a { t: 1px // c\fcalc(\n/*b*/\n/*d*/\n); }`,
			warnings: [
				{
					line: 1,
					column: 22,
					message: messages.rejectedOpeningMultiLine,
				},
				{
					line: 3,
					column: 6,
					message: messages.rejectedClosingMultiLine,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/312
			description: `an argument behind that form feed which the opening fix would take into the comment: that fix is never written, so the closing one is weighed as the only fix there is and goes through as before`,
			code: `a { t: 1px // c\fcalc(\n2px\n); }`,
			fixed: `a { t: 1px // c\fcalc(\n2px); }`,
			warnings: [
				{
					line: 1,
					column: 22,
					message: messages.rejectedOpeningMultiLine,
				},
				{
					line: 2,
					column: 4,
					message: messages.rejectedClosingMultiLine,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/312
			description: `a line break written inside the text of the block comment the fix closes up against, which the guard used to take out along with the whitespace and so read the comment as closed a line early: nothing of the value moves anywhere it was not, and the fix goes through`,
			code: `a { t: 1px //c\ff(/*x\ny*/\n); }`,
			fixed: `a { t: 1px //c\ff(/*x\ny*/); }`,
			line: 2,
			column: 4,
			message: messages.rejectedClosingMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/312
			description: `an argument in front of that block comment, which the reading Less has holds inside the comment the form feed does not close: closing the gap up moves the end of that comment onto the break written inside the block one, which carries three characters of the block comment's text out into the code of that reading and no character of the value into a comment under either of them, so the fix goes through`,
			code: `a { t: 1px // c\ff(2px\n/*x\ny*/); }`,
			fixed: `a { t: 1px // c\ff(2px/*x\ny*/); }`,
			line: 3,
			column: 3,
			message: messages.rejectedClosingMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/303
			description: `an inline comment whose text opens a call the parser closes a line below: the whitespace behind the opening parenthesis is the break that closes the comment and the indentation behind it, and nothing of the code the parser filed under that call, and the fix reaches no stretch of it, so nothing is written and the problem is reported`,
			code: `
				a {
					t: foo(// c(
						1px));
				}
			`,
			fixed: `
				a {
					t: foo(// c(
						1px));
				}
			`,
			line: 2,
			column: 9,
			message: messages.rejectedOpeningMultiLine,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/141
			description: `an inline comment stands between the opening parenthesis and the line break the option asks for`,
			code: `a { t: translate( // c\n  1px, 2px\n); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/246
			description: `the same comment closed by a bare carriage return, the option's break spelled with one too`,
			code: `a { t: translate( // c\r  1px, 2px\r); }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/288
			description: `a call the fix's own break takes out of the text of an inline comment, whose opening parenthesis is written in the same run rather than the next`,
			code: `
				a { t: foo(1px // c) calc(/*b*/
				 ,2px
				); }
			`,
			fixed: `
				a { t: foo(
				1px // c
				) calc(
				/*b*/
				 ,2px
				); }
			`,
			warnings: [
				{
					line: 1,
					column: 12,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 19,
					message: messages.expectedClosing,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/141
			description: `an inline comment stands between the opening parenthesis and the line break the option asks for`,
			code: `a { t: translate( // c\n  1px, 2px\n); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/246
			description: `the same comment closed by a bare carriage return, the option's break spelled with one too`,
			code: `a { t: translate( // c\r  1px, 2px\r); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/303
			description: `an inline comment whose text opens a call the parser closes a line below, the break that closes the comment being the very break the option asks for`,
			code: `
				a {
					t: foo(// c(
						1px)
					);
				}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/288
			description: `a call taken out of the text of an inline comment by the break the fix writes in front of the closing parenthesis of a multi-line call, whose own opening parenthesis is written in the same run rather than the next`,
			code: `
				a { t: foo(
				1px // c) calc(/*b*/
				 ,2px
				); }
			`,
			fixed: `
				a { t: foo(
				1px // c
				) calc(
				/*b*/
				 ,2px
				); }
			`,
			line: 2,
			column: 8,
			message: messages.expectedClosingMultiLine,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/141
			description: `an inline comment whose last character is a division sign, which the value parser hangs the closing break on`,
			code: `a { t: translate( // see MDN:\n  1px, 2px\n); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/303
			description: `an inline comment whose text opens a call the parser closes a line below, the break that closes the comment being the very break the option asks for`,
			code: `
				a {
					t: foo(// c(
						1px)
					);
				}
			`,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/129
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a call standing in the text of an inline comment, whose arguments the parser reads out of the code a line below`,
			code: `a { t: foo(1px // c) calc(\n2px); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `the same call with a space behind its opening parenthesis and a line break in front of its closing one`,
			code: `a { t: foo(1px // c) calc( 2px\n ); }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a call a line below an inline comment, gathered by one the parser opened inside that comment's text: the gathering call is left alone and the one it gathered is closed up where it stands`,
			code: `
				a { b: f(1px // c) calc(
					g(
					2px)); }
			`,
			fixed: `
				a { b: f(1px // c) calc(
					g(2px)); }
			`,
			line: 2,
			column: 4,
			message: messages.rejectedOpeningMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/141
			description: `inline comment after the opening parenthesis: the first argument cannot join the comment's line, so the value is left alone and the warning stands`,
			code: `a { t: translate(// c\n  1px, 2px); }`,
			fixed: `a { t: translate(// c\n  1px, 2px); }`,
			line: 1,
			column: 18,
			message: messages.rejectedOpeningMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/285
			description: `whitespace behind the parenthesis and whitespace behind an inline comment, of which the fix reaches only the first: the option cannot be satisfied by what it would write, so nothing is written and the problem is reported`,
			code: `a { t: translate( // c\n /*x*/\n , 1px); }`,
			fixed: `a { t: translate( // c\n /*x*/\n , 1px); }`,
			line: 1,
			column: 18,
			message: messages.rejectedOpeningMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/303
			description: `an inline comment whose text opens a call the parser closes a line below: the whitespace behind the opening parenthesis is the break that closes the comment and the indentation behind it, and nothing of the code the parser filed under that call, and the fix reaches no stretch of it, so nothing is written and the problem is reported`,
			code: `
				a {
					t: foo(// c(
						1px));
				}
			`,
			fixed: `
				a {
					t: foo(// c(
						1px));
				}
			`,
			line: 2,
			column: 9,
			message: messages.rejectedOpeningMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/303
			description: `a quotation mark in the same place, opening a string the parser closes a line below, which is another node able to reach past the break`,
			code: `
				a {
					t: foo(// c"
						1px");
				}
			`,
			fixed: `
				a {
					t: foo(// c"
						1px");
				}
			`,
			line: 2,
			column: 9,
			message: messages.rejectedOpeningMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/303
			description: `an unbalanced parenthesis in the text of a comment standing inside an address, which leaves the scan reading no address there and the parser handing the whole of what follows back as one word`,
			code: `
				a {
					t: url(// c(
						2px);
				}
			`,
			fixed: `
				a {
					t: url(// c(
						2px);
				}
			`,
			line: 2,
			column: 9,
			message: messages.rejectedOpeningMultiLine,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/246
			description: `an inline comment closed by a form feed, which Sass ends one on, with the option's break spelled the same way`,
			code: `a { t: translate( // c\f  1px, 2px\f); }`,
		},
		{
			description: `the same comment closed by a bare carriage return`,
			code: `a { t: translate( // c\r  1px, 2px\r); }`,
		},
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
					transform: translate(1px, calc(
				1 + 2
				) // a /*
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/288
			description: `a call the fix's own break takes out of the text of an inline comment, whose opening parenthesis is written in the same run rather than the next`,
			code: `
				a { t: foo(1px // c) calc(/*b*/
				 ,2px
				); }
			`,
			fixed: `
				a { t: foo(
				1px // c
				) calc(
				/*b*/
				 ,2px
				); }
			`,
			warnings: [
				{
					line: 1,
					column: 12,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 19,
					message: messages.expectedClosing,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/246
			description: `an inline comment closed by a form feed, which Sass ends one on, with the option's break spelled the same way`,
			code: `a { t: translate( // c\f  1px, 2px\f); }`,
		},
		{
			description: `the same comment closed by a bare carriage return`,
			code: `a { t: translate( // c\r  1px, 2px\r); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/131
			description: `a function the value parser marks unclosed, its closing parenthesis swallowed by a comment the file never closes, which the issue names under this option as well`,
			code: `
				a {
					transform: translate(1px, 2px // a /*
					);
				}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/288
			description: `a call taken out of the text of an inline comment by the break the fix writes in front of the closing parenthesis of a multi-line call, whose own opening parenthesis is written in the same run rather than the next`,
			code: `
				a { t: foo(
				1px // c) calc(/*b*/
				 ,2px
				); }
			`,
			fixed: `
				a { t: foo(
				1px // c
				) calc(
				/*b*/
				 ,2px
				); }
			`,
			line: 2,
			column: 8,
			message: messages.expectedClosingMultiLine,
		},
	],
})
