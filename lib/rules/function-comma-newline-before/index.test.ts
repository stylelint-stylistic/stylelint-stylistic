import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a call spelled inside a string, whose commas are no commas of a value`,
			code: `a::before { content: "func(foo ,bar ,baz)"; }`,
		},
		{
			description: `the same call spelled inside a url()`,
			code: `a::before { background: url('func(foo,bar,baz)'); }`,
		},
		{
			description: `commas of a value list, which this rule says nothing about`,
			code: `a { background-size: 0\n, 0\n, 0; }`,
		},
		{
			description: `a break in front of the comma`,
			code: `a { transform: translate(1\n,1); }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { transform: translate(1\r\n, 1); }`,
		},
		{
			description: `an empty line in front of the comma`,
			code: `a { transform: translate(1\n\n,1); }`,
		},
		{
			description: `the same empty line spelled with carriage returns`,
			code: `a { transform: translate(1\r\n\r\n, 1); }`,
		},
		{
			description: `a call nested in another, broken in front of each of its commas`,
			code: `a { transform: color(rgb(0\n\t, 0\n\t,0) lightness(50%)); }`,
		},
		{
			description: `the same call with spaces of indentation behind each break`,
			code: `a { transform: color(rgb(0\n  , 0\n  ,0) lightness(50%)); }`,
		},
		{
			description: `a comment in front of the comma, with the break in front of the comment`,
			code: `
				a {
				  transform: translate(
				    1px /* comment */
				    ,1px
				  );
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a bare address inside each argument, whose double slash opens no comment`,
			code: `
				a { background: image-set(url(//cdn/a.png) 1x
				,url(//cdn/b.png) 2x); }
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/275
			description: `a comma inside the text of a comment the value parser closes early, which is no comma of the value`,
			code: `a { b: f(x/*/*q,w*/y); }`,
		},
	],

	reject: [
		{
			description: `a comma abutting the argument in front of it`,
			code: `a { transform: translate(1,1); }`,
			fixed: `a { transform: translate(1\n,1); }`,
			line: 1,
			column: 27,
			message: messages.expectedBefore(),
		},
		{
			description: `the same declaration under a selector broken with a carriage return`,
			code: `a\r\n{ transform: translate(1,1); }`,
			fixed: `a\r\n{ transform: translate(1\r\n,1); }`,
			line: 2,
			column: 25,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces in front of the comma`,
			code: `a { transform: translate(1  ,1); }`,
			fixed: `a { transform: translate(1\n,1); }`,
			line: 1,
			column: 29,
			message: messages.expectedBefore(),
		},
		{
			description: `a space in front of the comma`,
			code: `a { transform: translate(1 ,1); }`,
			fixed: `a { transform: translate(1\n,1); }`,
			line: 1,
			column: 28,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab in front of the comma`,
			code: `a { transform: translate(1\t,1); }`,
			fixed: `a { transform: translate(1\n,1); }`,
			line: 1,
			column: 28,
			message: messages.expectedBefore(),
		},
		{
			description: `the first comma of a nested call, unbroken in front of`,
			code: `a { transform: color(rgb(0 , 0 \n,0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0\n, 0 \n,0) lightness(50%)); }`,
			line: 1,
			column: 28,
			message: messages.expectedBefore(),
		},
		{
			description: `the last comma of a nested call, unbroken in front of`,
			code: `a { transform: color(lightness(50%) rgb(0\n, 0,0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0\n, 0\n,0)); }`,
			line: 2,
			column: 4,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a comma between two bare addresses, whose double slashes open no comment`,
			code: `a { background: image-set(url(//cdn/a.png) 1x,url(//cdn/b.png) 2x); }`,
			fixed: `
				a { background: image-set(url(//cdn/a.png) 1x
				,url(//cdn/b.png) 2x); }
			`,
			line: 1,
			column: 46,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/238
			description: `a call standing behind a comment the value parser does not give back as it read it`,
			code: `a { b: x/*/*a,b*/f(1,2)c; }`,
			fixed: `
				a { b: x/*/*a,b*/f(1
				,2)c; }
			`,
			line: 1,
			column: 21,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/275
			description: `a comma of the value behind a comment the value parser closes early: the one inside the comment's text is passed over and this one is placed`,
			code: `a { b: f(x/*/*q,w*/y,2); }`,
			fixed: `
				a { b: f(x/*/*q,w*/y
				,2); }
			`,
			line: 1,
			column: 21,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/275
			description: `the comma of the value abutting that comment's closing delimiter, where the break this option writes lands`,
			code: `a { b: f(x/*/*q,w*/,2); }`,
			fixed: `
				a { b: f(x/*/*q,w*/
				,2); }
			`,
			line: 1,
			column: 20,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `the whitespace between the opening parenthesis and a comma that opens the arguments, which is what this option replaces and not a place to write beside`,
			code: `a { b: f( ,a); }`,
			fixed: `
				a { b: f(
				,a); }
			`,
			line: 1,
			column: 11,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `the whitespace between two commas of the arguments, which is what this option replaces and not a place to write beside`,
			code: `a { b: f(a, ,c); }`,
			fixed: `
				a { b: f(a
				,
				,c); }
			`,
			warnings: [
				{
					line: 1,
					column: 11,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 13,
					message: messages.expectedBefore(),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `the whitespace between a divider that is no comma and the comma behind it, which is what this option replaces and not a place to write beside`,
			code: `a { b: f(1 / ,2); }`,
			fixed: `
				a { b: f(1 /
				,2); }
			`,
			line: 1,
			column: 14,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/508
			description: `a comma in front of a comment holding one quotation mark, and the same text inside a string behind that comment: the mark the comment holds opens no string, so the string the file spells is one, and the comma its text holds is no comma of the arguments`,
			code: `a { b: f(1,2) /*/ " */ "f(1,2)"; }`,
			fixed: `a { b: f(1\n,2) /*/ " */ "f(1,2)"; }`,
			line: 1,
			column: 11,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a call spelled inside a string, whose commas are no commas of a value`,
			code: `a::before { content: "func(foo ,bar ,baz)"; }`,
		},
		{
			description: `the same call spelled inside a url()`,
			code: `a::before { background: url('func(foo,bar,baz)'); }`,
		},
		{
			description: `commas of a value list, which this rule says nothing about`,
			code: `a { background-size: 0\n, 0\n, 0; }`,
		},
		{
			description: `a break in front of the comma of a multi-line call`,
			code: `a { transform: translate(1\n,1); }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { transform: translate(1\r\n, 1); }`,
		},
		{
			description: `a nested call broken in front of each comma`,
			code: `a { transform: color(rgb(0\n\t, 0\n\t,0) lightness(50%)); }`,
		},
		{
			description: `the same call with spaces of indentation behind each break`,
			code: `a { transform: color(rgb(0\n  , 0\n  ,0) lightness(50%)); }`,
		},
		{
			description: `a single-line call, which this option passes over`,
			code: `a { transform: translate(1,1); }`,
		},
		{
			description: `two spaces in front of the comma of a single-line call`,
			code: `a { transform: translate(1  ,1); }`,
		},
		{
			description: `a space in front of the comma of a single-line call`,
			code: `a { transform: translate(1 , 1); }`,
		},
		{
			description: `a tab in front of the comma of a single-line call`,
			code: `a { transform: translate(1\t,1); }`,
		},
		{
			description: `a gradient broken in front of each of its outer commas`,
			code: `a { background: linear-gradient(45deg\n, rgba(0, 0, 0, 1)\n, red); }`,
		},
		{
			description: `a comment in front of the comma of a multi-line call`,
			code: `
				a {
				  transform: translate(
				    1px /* comment */
				    ,1px
				  );
				}
			`,
		},
	],

	reject: [
		{
			description: `a comma of a multi-line call abutting the argument in front of it`,
			code: `a { transform: color(rgb(0\n, 0, 0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0\n, 0\n, 0) lightness(50%)); }`,
			line: 2,
			column: 4,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `the same call spelled with a carriage return`,
			code: `a { transform: color(rgb(0\r\n, 0, 0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0\r\n, 0\r\n, 0) lightness(50%)); }`,
			line: 2,
			column: 4,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `the last comma of a nested multi-line call, unbroken in front of`,
			code: `a { transform: color(lightness(50%) rgb(0,0\n,0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0\n,0\n,0)); }`,
			line: 1,
			column: 42,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `a gradient whose inner commas are partly unbroken`,
			code: `a { background: linear-gradient(45deg\n, rgba(0\n, 0, 0\n, 1)\n, red); }`,
			fixed: `a { background: linear-gradient(45deg\n, rgba(0\n, 0\n, 0\n, 1)\n, red); }`,
			line: 3,
			column: 4,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/275
			description: `a comma of the value inside a function the file breaks across lines, where a comment the value parser closes early stands as well: the comma inside that comment's text is passed over and this one is placed`,
			code: `
				a { b: f(x/*/*q,w*/y,2
				); }
			`,
			fixed: `
				a { b: f(x/*/*q,w*/y
				,2
				); }
			`,
			line: 1,
			column: 21,
			message: messages.expectedBeforeMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			description: `a call spelled inside a string, broken across lines`,
			code: `a::before { content: "func(foo\n,bar\n,baz)"; }`,
		},
		{
			description: `the same call spelled inside a url()`,
			code: `a::before { background: url('func(foo\n,bar,baz)'); }`,
		},
		{
			description: `a single-line call, which this option passes over`,
			code: `a { transform: translate(1,1); }`,
		},
		{
			description: `two spaces in front of the comma of a single-line call`,
			code: `a { transform: translate(1  ,1); }`,
		},
		{
			description: `a space in front of the comma of a single-line call`,
			code: `a { transform: translate(1 , 1); }`,
		},
		{
			description: `a tab in front of the comma of a single-line call`,
			code: `a { transform: translate(1\t,1); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/275
			description: `a break in front of a comma inside the text of a comment the value parser closes early, neither of them the value's`,
			code: `
				a { b: f(x/*/*q
				,w*/y,2); }
			`,
		},
	],

	reject: [
		{
			description: `a break in front of the last comma of a nested call`,
			code: `a { transform: color(rgb(0,0\n,0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0,0,0) lightness(50%)); }`,
			line: 2,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `the same call spelled with a carriage return`,
			code: `a { transform: color(rgb(0,0\r\n,0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0,0,0) lightness(50%)); }`,
			line: 2,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a break in front of the first comma of the second nested call`,
			code: `a { transform: color(lightness(50%) rgb(0\n, 0, 0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0, 0, 0)); }`,
			line: 2,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a break in front of one comma and behind another`,
			code: `a { transform: color(rgb(0\n,0,\n0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0,0,\n0) lightness(50%)); }`,
			line: 2,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a break behind one comma and in front of another`,
			code: `a { transform: color(lightness(50%) rgb(0,\n 0\n,0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0,\n 0,0)); }`,
			line: 3,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a comment in front of the comma of a multi-line call`,
			code: `
				a {
				  transform: translate(
				    1px /* comment */
				    , 1px
				  );
				}
			`,
			fixed: `
				a {
				  transform: translate(
				    1px /* comment */, 1px
				  );
				}
			`,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `the break between two commas of the arguments, which the parser hands to the comma in front of it`,
			code: `
				a { b: f(a,
				,c); }
			`,
			fixed: `a { b: f(a,,c); }`,
			line: 2,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `the break between the opening parenthesis and a comma that opens the arguments, which the parser hands to the function`,
			code: `
				a { b: f(
				,a); }
			`,
			fixed: `a { b: f(,a); }`,
			line: 2,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `a break between a divider that is no comma and the comma behind it, which the parser hands to that divider just the same`,
			code: `
				a { b: f(1 /
				,2); }
			`,
			fixed: `a { b: f(1 /,2); }`,
			line: 2,
			column: 1,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignoreFunctions: [`translate`, `/^rgba?$/`, /^hsl$/u] }],

	accept: [
		{
			description: `a call named in the option as a plain string`,
			code: `a { transform: translate(1,1); }`,
		},
		{
			description: `a call matched by the pattern given as a string`,
			code: `a { color: rgb(0,0,0); }`,
		},
		{
			description: `the same pattern matching another name`,
			code: `a { color: rgba(0,0,0,1); }`,
		},
		{
			description: `a call matched by the pattern given as a regular expression`,
			code: `a { color: hsl(0,0%,0%); }`,
		},
		{
			description: `a call nested inside an ignored one, which is passed over with it`,
			code: `a { transform: translate(min(1px,2px),1); }`,
		},
		{
			description: `a call the option does not name, with no comma in it to check`,
			code: `
				a {
					transform: scale(1
					,1);
				}
			`,
		},
	],

	reject: [
		{
			description: `a call the option does not name`,
			code: `
				a { transform: scale(1,1); }
			`,
			fixed: `
				a { transform: scale(1
				,1); }
			`,
			line: 1,
			column: 23,
			message: messages.expectedBefore(),
		},
		{
			description: `the same call carrying two commas`,
			code: `
				a { background: linear-gradient(45deg,red,blue); }
			`,
			fixed: `
				a { background: linear-gradient(45deg
				,red
				,blue); }
			`,
			warnings: [
				{
					line: 1,
					column: 38,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 42,
					message: messages.expectedBefore(),
				},
			],
		},
		{
			description: `an ignored call nested inside one the option does not name`,
			code: `
				a { background: linear-gradient(45deg,rgba(0,0,0,1)); }
			`,
			fixed: `
				a { background: linear-gradient(45deg
				,rgba(0,0,0,1)); }
			`,
			line: 1,
			column: 38,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`, { ignoreFunctions: [`translate`] }],

	accept: [
		{
			description: `an ignored call broken across lines`,
			code: `
				a {
					transform: translate(1
					, 1);
				}
			`,
		},
	],

	reject: [
		{
			description: `a call the option does not name, broken across lines`,
			code: `
				a {
					transform: scale(1
					, 1);
				}
			`,
			fixed: `
				a {
					transform: scale(1, 1);
				}
			`,
			line: 3,
			column: 2,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})
