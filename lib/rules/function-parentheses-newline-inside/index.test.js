import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a::before { content: "(a) ( a)"; }`,
			description: `parentheses spelled inside a string, which open no call`,
		},
		{
			code: `a::before { background: url(\n'asdf( Vcxvsd)ASD'\n); }`,
			description: `the same parentheses spelled inside a url()`,
		},
		{
			code: `a { transform: translate(\n1, 1\n); }`,
			description: `breaks on the inside of both parentheses`,
		},
		{
			code: `a { transform: translate(\n\n1, 1\n\n); }`,
			description: `empty lines on the inside of both parentheses`,
		},
		{
			code: `a { transform: translate(\r\n1, 1\r\n); }`,
			description: `the same breaks spelled with carriage returns`,
		},
		{
			code: `a { transform: translate(\r\n\r\n1, 1\r\n\r\n); }`,
			description: `the same empty lines spelled with carriage returns`,
		},
		{
			code: `a { color: color(\nrgb(\n0, 0, 0\n) lightness(\n50%\n)\n); }`,
			description: `nested calls, each broken on the inside of both its parentheses`,
		},
		{
			code: `$map: (key: value,key2: value2)`,
			description: `an SCSS map, whose parentheses open no call`,
		},
		{
			code: `$list: (value, value2)`,
			description: `an SCSS list, whose parentheses open no call either`,
		},
		{
			code: `a { transform: translate( /*comment*/\n1,\n  1\n); }`,
			description: `a comment behind the opening parenthesis, with the break behind the comment`,
		},
	],

	reject: [
		{
			code: `a { transform: translate(1, 1\n); }`,
			fixed: `a { transform: translate(\n1, 1\n); }`,
			description: `a first argument abutting the opening parenthesis`,
			message: messages.expectedOpening,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate(\n1, 1); }`,
			fixed: `a { transform: translate(\n1, 1\n); }`,
			description: `a last argument abutting the closing parenthesis`,
			message: messages.expectedClosing,
			line: 2,
			column: 4,
		},
		{
			code: `a { transform: translate(  1, 1\n); }`,
			fixed: `a { transform: translate(\n  1, 1\n); }`,
			description: `two spaces behind the opening parenthesis`,
			message: messages.expectedOpening,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate(\n1,\n1\t); }`,
			fixed: `a { transform: translate(\n1,\n1\n\t); }`,
			description: `a tab in front of the closing parenthesis`,
			message: messages.expectedClosing,
			line: 3,
			column: 2,
		},
		{
			code: `a { color: color(rgb(\n0, 0, 0\n) lightness(\n50%\n)\n); }`,
			fixed: `a { color: color(\nrgb(\n0, 0, 0\n) lightness(\n50%\n)\n); }`,
			description: `the opening parenthesis of the outer call abutting the inner one`,
			message: messages.expectedOpening,
			line: 1,
			column: 18,
		},
		{
			code: `a { color: color(\nrgb(\n0, 0, 0\n) lightness(50%\n)\n); }`,
			fixed: `a { color: color(\nrgb(\n0, 0, 0\n) lightness(\n50%\n)\n); }`,
			description: `an inner call abutting its own opening parenthesis`,
			message: messages.expectedOpening,
			line: 4,
			column: 13,
		},
		{
			code: `a::before { content: attr(data-foo\n); }`,
			fixed: `a::before { content: attr(\ndata-foo\n); }`,
			description: `an argument abutting both parentheses of a single-line call`,
			message: messages.expectedOpening,
			line: 1,
			column: 27,
		},
		{
			code: `a::before { content: attr(\n\tdata-foo); }`,
			fixed: `a::before { content: attr(\n\tdata-foo\n); }`,
			description: `a tab in front of an argument that abuts the closing parenthesis`,
			message: messages.expectedClosing,
			line: 2,
			column: 9,
		},
		{
			code: `a { transform: translate(  1,\n  1\n); }`,
			fixed: `a { transform: translate(\n  1,\n  1\n); }`,
			description: `two spaces behind the opening parenthesis of a call broken elsewhere`,
			message: messages.expectedOpening,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate(1,\r\n1\n); }`,
			fixed: `a { transform: translate(\r\n1,\r\n1\n); }`,
			description: `a line feed in front of the closing parenthesis and a carriage return inside`,
			message: messages.expectedOpening,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate( /*comment*/ 1,\n  1\n); }`,
			fixed: `a { transform: translate( /*comment*/\n 1,\n  1\n); }`,
			description: `a comment behind the opening parenthesis with the argument on its line`,
			message: messages.expectedOpening,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate( /*c1*/ /*c2*/ 1,1 /*c3*/ /*c4*/ ); }`,
			fixed: `a { transform: translate( /*c1*/ /*c2*/\n 1,1 /*c3*/ /*c4*/\n ); }`,
			description: `comments at both ends of a single-line call`,
			warnings: [
				{
					message: messages.expectedOpening,
					line: 1,
					column: 26,
				},
				{
					message: messages.expectedClosing,
					line: 1,
					column: 58,
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
			code: `a::before { content: "(a) ( a)"; }`,
			description: `parentheses spelled inside a string, which open no call`,
		},
		{
			code: `a::before { background: url(\n'asdf( Vcxvsd)ASD'\n); }`,
			description: `the same parentheses spelled inside a url()`,
		},
		{
			code: `a { transform: translate(\n1, 1\n); }`,
			description: `breaks on the inside of both parentheses`,
		},
		{
			code: `a { transform: translate(\r\n1, 1\r\n); }`,
			description: `the same breaks spelled with carriage returns`,
		},
		{
			code: `a { color: color(\nrgb(\n0, 0, 0\n) lightness(\n50%\n)\n); }`,
			description: `nested calls, each broken on the inside of both its parentheses`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
			description: `a single-line call, which this option passes over`,
		},
		{
			code: `a { transform: translate(  1, 1\t); }`,
			description: `spaces and a tab inside a single-line call`,
		},
		{
			code: `$map: (key: value,\nkey2: value2)`,
			description: `an SCSS map broken across lines, whose parentheses open no call`,
		},
		{
			code: `a { transform: translate(\n/*comment*/ 1,1\n); }`,
			description: `a comment behind the break that opens the arguments`,
		},
		{
			code: `a { transform: translate( /*comment*/\n1,1\n); }`,
			description: `a comment behind the opening parenthesis, with the break behind it`,
		},
		{
			code: `a { transform: translate(\n1,1\n/*comment*/ ); }`,
			description: `a comment in front of the closing parenthesis, behind the break`,
		},
		{
			code: `a { transform: translate(\n1,1 /*comment*/\n); }`,
			description: `a comment behind the last argument, with the break behind the comment`,
		},
	],

	reject: [
		{
			code: `a { transform: translate(1, 1\n); }`,
			fixed: `a { transform: translate(\n1, 1\n); }`,
			description: `a first argument abutting the opening parenthesis`,
			message: messages.expectedOpeningMultiLine,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate(\n1, 1); }`,
			fixed: `a { transform: translate(\n1, 1\n); }`,
			description: `a last argument abutting the closing parenthesis`,
			message: messages.expectedClosingMultiLine,
			line: 2,
			column: 4,
		},
		{
			code: `a { transform: translate(  1, 1\n); }`,
			fixed: `a { transform: translate(\n  1, 1\n); }`,
			description: `two spaces behind the opening parenthesis`,
			message: messages.expectedOpeningMultiLine,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate(\n1,\n1\t); }`,
			fixed: `a { transform: translate(\n1,\n1\n\t); }`,
			description: `a tab in front of the closing parenthesis`,
			message: messages.expectedClosingMultiLine,
			line: 3,
			column: 2,
		},
		{
			code: `a { color: color(rgb(\n0, 0, 0\n) lightness(\n50%\n)\n); }`,
			fixed: `a { color: color(\nrgb(\n0, 0, 0\n) lightness(\n50%\n)\n); }`,
			description: `the opening parenthesis of the outer call abutting the inner one`,
			message: messages.expectedOpeningMultiLine,
			line: 1,
			column: 18,
		},
		{
			code: `a { color: color(\nrgb(\n0, 0, 0\n) lightness(50%\n)\n); }`,
			fixed: `a { color: color(\nrgb(\n0, 0, 0\n) lightness(\n50%\n)\n); }`,
			description: `an inner call abutting its own opening parenthesis`,
			message: messages.expectedOpeningMultiLine,
			line: 4,
			column: 13,
		},
		{
			code: `a::before { content: attr(data-foo\n); }`,
			fixed: `a::before { content: attr(\ndata-foo\n); }`,
			description: `an argument abutting both parentheses of a call broken elsewhere`,
			message: messages.expectedOpeningMultiLine,
			line: 1,
			column: 27,
		},
		{
			code: `a::before { content: attr(\n\tdata-foo); }`,
			fixed: `a::before { content: attr(\n\tdata-foo\n); }`,
			description: `a tab in front of an argument that abuts the closing parenthesis`,
			message: messages.expectedClosingMultiLine,
			line: 2,
			column: 9,
		},
		{
			code: `a { transform: translate(  1,\n  1\n); }`,
			fixed: `a { transform: translate(\n  1,\n  1\n); }`,
			description: `two spaces behind the opening parenthesis of a call broken elsewhere`,
			message: messages.expectedOpeningMultiLine,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate(1,\r\n1\n); }`,
			fixed: `a { transform: translate(\r\n1,\r\n1\n); }`,
			description: `a line feed in front of the closing parenthesis and a carriage return inside`,
			message: messages.expectedOpeningMultiLine,
			line: 1,
			column: 26,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			code: `a::before { content: "(a) ( a)"; }`,
			description: `parentheses spelled inside a string, which open no call`,
		},
		{
			code: `a::before { background: url('asdf(Vcxv\nsd\n)ASD'); }`,
			description: `the same parentheses spelled inside a url(), broken across lines`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
			description: `a single-line call, whose parentheses hold no whitespace`,
		},
		{
			code: `a { transform: translate(1,\r\n1); }`,
			description: `a call broken at its comma alone`,
		},
		{
			code: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			description: `nested single-line calls`,
		},
		{
			code: `a { transform: translate(1,\n  1); }`,
			description: `a break at the comma with indentation behind it`,
		},
		{
			code: `a { transform: translate(1,\n\t\t1); }`,
			description: `the same break with tabs of indentation`,
		},
		{
			code: `$map: (\nkey: value,\nkey2: value2\n)`,
			description: `an SCSS map broken on the inside of both parentheses`,
		},
		{
			code: `a { transform: translate(/*comment*/1,\n1); }`,
			description: `a comment abutting the opening parenthesis`,
		},
		{
			code: `a { transform: translate(1,\n1/*comment*/); }`,
			description: `a comment abutting the closing parenthesis`,
		},
	],

	reject: [
		{
			code: `a { transform: translate(\n  1,\n  1); }`,
			fixed: `a { transform: translate(1,\n  1); }`,
			description: `a break behind the opening parenthesis of a multi-line call`,
			message: messages.rejectedOpeningMultiLine,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate(  \n  1,\n  1); }`,
			fixed: `a { transform: translate(1,\n  1); }`,
			description: `two spaces and a break behind the opening parenthesis`,
			message: messages.rejectedOpeningMultiLine,
			line: 1,
			column: 26,
		},
		{
			code: `a { transform: translate(1,\n  1\n); }`,
			fixed: `a { transform: translate(1,\n  1); }`,
			description: `a break in front of the closing parenthesis`,
			message: messages.rejectedClosingMultiLine,
			line: 2,
			column: 4,
		},
		{
			code: `a { transform: translate(1,\r\n1\t); }`,
			fixed: `a { transform: translate(1,\r\n1); }`,
			description: `a tab in front of the closing parenthesis of a call broken at its comma`,
			message: messages.rejectedClosingMultiLine,
			line: 2,
			column: 2,
		},
		{
			code: `a { color: color(rgb(0,\r\n  0,\r\n  0\r\n) lightness(50%)); }`,
			fixed: `a { color: color(rgb(0,\r\n  0,\r\n  0) lightness(50%)); }`,
			description: `an inner call broken on the inside of both its parentheses`,
			message: messages.rejectedClosingMultiLine,
			line: 3,
			column: 5,
		},
		{
			code: `a { color: color(rgb(0, 0, 0) lightness(\n50%)); }`,
			fixed: `a { color: color(rgb(0, 0, 0) lightness(50%)); }`,
			description: `a break behind the opening parenthesis of the inner call`,
			message: messages.rejectedOpeningMultiLine,
			line: 1,
			column: 41,
		},
		{
			code: `a { transform: translate( /*c1*/ /*c2*/ 1,\n1 /*c3*/ /*c4*/ ); }`,
			fixed: `a { transform: translate(/*c1*//*c2*/1,\n1/*c3*//*c4*/); }`,
			description: `comments at both ends, each spaced from the parenthesis`,
			warnings: [
				{
					message: messages.rejectedOpeningMultiLine,
					line: 1,
					column: 26,
				},
				{
					message: messages.rejectedClosingMultiLine,
					line: 2,
					column: 16,
				},
			],
		},
		{
			code: `a { transform: translate( /*c1*//*c2*/1,\n1/*c3*//*c4*/ ); }`,
			fixed: `a { transform: translate(/*c1*//*c2*/1,\n1/*c3*//*c4*/); }`,
			description: `the same comments abutting the arguments instead`,
			warnings: [
				{
					message: messages.rejectedOpeningMultiLine,
					line: 1,
					column: 26,
				},
				{
					message: messages.rejectedClosingMultiLine,
					line: 2,
					column: 14,
				},
			],
		},
		{
			code: `a { transform: translate(/*c1*//*c2*/ 1,\n1 /*c3*//*c4*/); }`,
			fixed: `a { transform: translate(/*c1*//*c2*/1,\n1/*c3*//*c4*/); }`,
			description: `the same comments abutting the parentheses on the outside`,
			warnings: [
				{
					message: messages.rejectedOpeningMultiLine,
					line: 1,
					column: 26,
				},
				{
					message: messages.rejectedClosingMultiLine,
					line: 2,
					column: 14,
				},
			],
		},
		{
			code: `a { transform: translate(/*c1*/ /*c2*/1,\n1/*c3*/ /*c4*/); }`,
			fixed: `a { transform: translate(/*c1*//*c2*/1,\n1/*c3*//*c4*/); }`,
			description: `the same comments abutting the parentheses on one side each`,
			warnings: [
				{
					message: messages.rejectedOpeningMultiLine,
					line: 1,
					column: 26,
				},
				{
					message: messages.rejectedClosingMultiLine,
					line: 2,
					column: 14,
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
					message: messages.rejectedOpeningMultiLine,
					line: 2,
					column: 15,
				},
				{
					message: messages.rejectedClosingMultiLine,
					line: 4,
					column: 1,
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
			message: messages.rejectedClosingMultiLine,
			line: 3,
			column: 1,
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
			message: messages.rejectedClosingMultiLine,
			line: 4,
			column: 1,
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
			message: messages.rejectedClosingMultiLine,
			line: 3,
			column: 1,
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
			message: messages.rejectedClosingMultiLine,
			line: 3,
			column: 13,
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
			message: messages.rejectedClosingMultiLine,
			line: 4,
			column: 1,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/113
			code: `a { transform: translate(1px,\n2px // keep me\f); }`,
			fixed: `a { transform: translate(1px,\n2px // keep me\f); }`,
			description: `a form feed, which Sass ends the comment on and Less does not: neither reading lets the parenthesis be pulled up`,
			message: messages.rejectedClosingMultiLine,
			line: 2,
			column: 15,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/113
			code: `a { transform: translate(1px, 2px // keep me\r); }`,
			fixed: `a { transform: translate(1px, 2px // keep me\r); }`,
			description: `a carriage return closing the comment: it is a line break of CSS like any other, so the parenthesis cannot join that line`,
			message: messages.rejectedClosingMultiLine,
			line: 1,
			column: 45,
		},
		{
			code: `a { transform: translate(1px // keep me\r2px ); }`,
			fixed: `a { transform: translate(1px // keep me\r2px); }`,
			description: `a carriage return closing the comment in front of the last argument: the parenthesis follows code, so the fix goes through`,
			message: messages.rejectedClosingMultiLine,
			line: 1,
			column: 44,
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
			message: messages.rejectedClosingMultiLine,
			line: 4,
			column: 1,
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
			message: messages.rejectedClosingMultiLine,
			line: 3,
			column: 18,
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
			message: messages.rejectedClosingMultiLine,
			line: 4,
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
					transform: translate(1px, 2px/* keep me */);
				}
			`,
			message: messages.rejectedClosingMultiLine,
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
			message: messages.rejectedClosingMultiLine,
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
			message: messages.rejectedClosingMultiLine,
			line: 3,
			column: 6,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/113
			code: `a { transform: translate(1px,\n2px // keep me\f); }`,
			fixed: `a { transform: translate(1px,\n2px // keep me\f); }`,
			description: `a form feed, which Sass ends the comment on: the parenthesis stands outside the comment and must not be pulled into it`,
			message: messages.rejectedClosingMultiLine,
			line: 2,
			column: 15,
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
			message: messages.rejectedClosingMultiLine,
			line: 3,
			column: 1,
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
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/141
			description: `inline comment after the opening parenthesis: the first argument cannot join the comment's line, so the value is left alone and the warning stands`,
			code: `a { t: translate(// c\n  1px, 2px); }`,
			fixed: `a { t: translate(// c\n  1px, 2px); }`,
			message: messages.rejectedOpeningMultiLine,
			line: 1,
			column: 18,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/129
			description: `an inline comment opened inside another function reaches the opening parenthesis of this one`,
			code: `a { t: foo(1px // c) calc(\n2px); }`,
			fixed: `a { t: foo(1px // c) calc(\n2px); }`,
			message: messages.rejectedOpeningMultiLine,
			line: 1,
			column: 27,
		},
	],
})
