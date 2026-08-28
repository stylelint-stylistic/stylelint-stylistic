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

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320
			description: `a call the parser closed on a parenthesis standing in the text of an inline comment, whose whitespace the option would take out of that text`,
			code: `
				a { b: f( 1px // c ) calc(
				2px ); }
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/132
			description: `a separator of Unicode, which no syntax reads a line in: the comment runs past it to the end of the value, and the parenthesis the parser closed the call on stands in its text`,
			code: `a { t: translate(1px,\n2px // c\u2028 ); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320
			description: `a closing parenthesis written on the line an inline comment runs to, which is the parenthesis the parser closed the call on`,
			code: `
				a {
					transform: translate(1px,
					2px // keep me );
				}
			`,
		},
	],

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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320
			description: `a call the parser closed on a parenthesis standing in the text of an inline comment, and the call that text opens behind it: the break the option would write in front of that parenthesis is the break that closes the comment, so neither call is touched`,
			code: `
				a { t: foo(1px // c) calc(/*b*/
				 ,2px
				); }
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320
			description: `the same shape without the block comment, which Less compiles to a single call of foo over two arguments: the break written in front of the parenthesis inside the comment used to close that comment and make two calls of the one`,
			code: `
				a { t: foo(1px // c) calc(
				2px); }
			`,
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320
			description: `the same two calls with the outer one already broken behind its opening parenthesis, which leaves the parenthesis inside the comment the only one the option asks a break in front of`,
			code: `
				a { t: foo(
				1px // c) calc(/*b*/
				 ,2px
				); }
			`,
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320
			description: `a call the parser closed on a parenthesis standing in the text of an inline comment, and the call that text opens behind it: the break the option would write in front of that parenthesis is the break that closes the comment, so neither call is touched`,
			code: `
				a { t: foo(1px // c) calc(/*b*/
				 ,2px
				); }
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320
			description: `the same two parentheses with ordinary code behind the comment rather than a block comment: Sass compiles the value to one call reaching over the break, and the break the option would write would close the comment and make two calls of it`,
			code: `a { b: f(1px // c) h(2px\n2px); }`,
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
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320
			description: `the same two calls with the outer one already broken behind its opening parenthesis, which leaves the parenthesis inside the comment the only one the option asks a break in front of`,
			code: `
				a { t: foo(
				1px // c) calc(/*b*/
				 ,2px
				); }
			`,
		},
	],
})
