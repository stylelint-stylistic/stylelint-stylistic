import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a call spelled inside a string, whose commas are no commas of a value`,
			code: `a::before { content: "func(foo,bar,baz)"; }`,
		},
		{
			description: `the same call spelled inside a url()`,
			code: `a::before { background: url('func(foo,bar,baz)'); }`,
		},
		{
			description: `commas of a value list, which this rule says nothing about`,
			code: `a { background-size: 0, 0, 0; }`,
		},
		{
			description: `spaces on both sides of the comma`,
			code: `a { transform: translate(1 , 1); }`,
		},
		{
			description: `a space in front of the comma and none behind it`,
			code: `a { transform: translate(1 ,1); }`,
		},
		{
			description: `a nested call, each comma with the space in front of it`,
			code: `a { transform: color(rgb(0 , 0 ,0) lightness(50%)); }`,
		},
		{
			description: `a data URI, whose commas belong to the data rather than to a call`,
			code: `a { background: url(data:image/svg+xml;charset=utf8,%3Csvg%20xmlns); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a bare address inside each argument, whose double slash opens no comment`,
			code: `a { background: image-set(url(//cdn/a.png) 1x ,url(//cdn/b.png) 2x); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/214
			description: `two comments, the first of which code follows straight away: the second is no continuation of it`,
			code: `a { b: translate(1px/*k*/ , /*c*/ 2px); }`,
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
			code: `a { transform: translate(1, 1); }`,
			fixed: `a { transform: translate(1 , 1); }`,
			line: 1,
			column: 27,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces in front of the comma`,
			code: `a { transform: translate(1  , 1); }`,
			fixed: `a { transform: translate(1 , 1); }`,
			line: 1,
			column: 29,
			message: messages.expectedBefore(),
		},
		{
			description: `a break in front of the comma`,
			code: `a { transform: translate(1\n, 1); }`,
			fixed: `a { transform: translate(1 , 1); }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { transform: translate(1\r\n, 1); }`,
			fixed: `a { transform: translate(1 , 1); }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab in front of the comma`,
			code: `a { transform: translate(1\t, 1); }`,
			fixed: `a { transform: translate(1 , 1); }`,
			line: 1,
			column: 28,
			message: messages.expectedBefore(),
		},
		{
			description: `the last comma of a nested call abutting its argument`,
			code: `a { transform: color(rgb(0 , 0, 0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 , 0 , 0) lightness(50%)); }`,
			line: 1,
			column: 31,
			message: messages.expectedBefore(),
		},
		{
			description: `the same call standing behind another`,
			code: `a { transform: color(lightness(50%) rgb(0 , 0, 0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0 , 0 , 0)); }`,
			line: 1,
			column: 46,
			message: messages.expectedBefore(),
		},
		{
			description: `a comment in front of the comma, on the argument's own line`,
			code: `
				a {
				  transform: translate(
				    1px /* comment */
				    ,1px
				  );
				}
			`,
			fixed: `
				a {
				  transform: translate(
				    1px /* comment */ ,1px
				  );
				}
			`,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a comma between two bare addresses, whose double slashes open no comment`,
			code: `a { background: image-set(url(//cdn/a.png) 1x,url(//cdn/b.png) 2x); }`,
			fixed: `a { background: image-set(url(//cdn/a.png) 1x ,url(//cdn/b.png) 2x); }`,
			line: 1,
			column: 46,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/216
			description: `a bare address inside a call the plugin knows nothing of: plain CSS spells no comment with a double slash`,
			code: `a { b: translate(myurl(//a),2px); }`,
			fixed: `a { b: translate(myurl(//a) ,2px); }`,
			line: 1,
			column: 28,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/238
			description: `a call standing behind a comment the value parser does not give back as it read it`,
			code: `a { b: x/*/*a,b*/f(1,2)c; }`,
			fixed: `a { b: x/*/*a,b*/f(1 ,2)c; }`,
			line: 1,
			column: 21,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/275
			description: `a comma of the value behind a comment the value parser closes early: the one inside the comment's text is passed over and this one is placed`,
			code: `a { b: f(x/*/*q,w*/y,2); }`,
			fixed: `a { b: f(x/*/*q,w*/y ,2); }`,
			line: 1,
			column: 21,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/275
			description: `the comma of the value abutting that comment's closing delimiter, where the space this option writes lands`,
			code: `a { b: f(x/*/*q,w*/,2); }`,
			fixed: `a { b: f(x/*/*q,w*/ ,2); }`,
			line: 1,
			column: 20,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `a break between two commas of the arguments, which is the whitespace this option replaces and not a place to write beside`,
			code: `a { b: f(a,\n,c); }`,
			fixed: `a { b: f(a , ,c); }`,
			warnings: [
				{
					line: 1,
					column: 11,
					message: messages.expectedBefore(),
				},
				{
					line: 2,
					column: 1,
					message: messages.expectedBefore(),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `a break between the opening parenthesis and a comma that opens the arguments, which is the whitespace this option replaces and not a place to write beside`,
			code: `a { b: f(\n,a); }`,
			fixed: `a { b: f( ,a); }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `a break between a divider that is no comma and the comma behind it, which is the whitespace this option replaces and not a place to write beside`,
			code: `
				a { b: f(1 /
				,2); }
			`,
			fixed: `a { b: f(1 / ,2); }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/508
			description: `a comma in front of a comment holding one quotation mark, and the same text inside a string behind that comment: the mark the comment holds opens no string, so the string the file spells is one, and the comma its text holds is no comma of the arguments`,
			code: `a { b: f(1,2) /*/ " */ "f(1,2)"; }`,
			fixed: `a { b: f(1 ,2) /*/ " */ "f(1,2)"; }`,
			line: 1,
			column: 11,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a call spelled inside a string, whose commas are no commas of a value`,
			code: `a::before { content: "func(foo ,bar ,baz)"; }`,
		},
		{
			description: `the same call spelled inside a url()`,
			code: `a::before { background: url('func(foo ,bar ,baz)'); }`,
		},
		{
			description: `commas of a value list, which this rule says nothing about`,
			code: `a { background-size: 0 , 0 , 0; }`,
		},
		{
			description: `a comma abutting the argument in front of it, with a space behind it`,
			code: `a { transform: translate(1, 1); }`,
		},
		{
			description: `a comma abutting the arguments on both sides`,
			code: `a { transform: translate(1,1); }`,
		},
		{
			description: `a nested call whose commas abut the arguments in front of them`,
			code: `a { transform: color(rgb(0, 0,0) lightness(50%)); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/275
			description: `a space in front of a comma inside the text of a comment the value parser closes early, neither of them the value's`,
			code: `a { b: f(x/*/*q ,w*/y,2); }`,
		},
	],

	reject: [
		{
			description: `a space in front of the comma`,
			code: `a { transform: translate(1 , 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 28,
			message: messages.rejectedBefore(),
		},
		{
			description: `two spaces in front of the comma`,
			code: `a { transform: translate(1  , 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 29,
			message: messages.rejectedBefore(),
		},
		{
			description: `a break in front of the comma`,
			code: `a { transform: translate(1\n, 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { transform: translate(1\r\n, 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `a tab in front of the comma`,
			code: `a { transform: translate(1\t, 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 28,
			message: messages.rejectedBefore(),
		},
		{
			description: `the second comma of a nested call with a space in front of it`,
			code: `a { transform: color(rgb(0, 0 , 0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 31,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same call standing behind another`,
			code: `a { transform: color(lightness(50%) rgb(0, 0 , 0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0, 0, 0)); }`,
			line: 1,
			column: 46,
			message: messages.rejectedBefore(),
		},
		{
			description: `a comment in front of the comma, spaced on both sides`,
			code: `a { transform: translate(1 /*comment*/ , 1); }`,
			fixed: `a { transform: translate(1 /*comment*/, 1); }`,
			line: 1,
			column: 40,
			message: messages.rejectedBefore(),
		},
		{
			description: `two comments in front of the comma`,
			code: `a { transform: translate(1 /*c*/ /*c*/ , 1); }`,
			fixed: `a { transform: translate(1 /*c*/ /*c*/, 1); }`,
			line: 1,
			column: 40,
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/275
			description: `a comma of the value carrying the whitespace this option takes away, behind a comment the value parser closes early whose text carries whitespace of its own: only the value's is taken`,
			code: `a { b: f(x/*/*q ,w*/y ,2); }`,
			fixed: `a { b: f(x/*/*q ,w*/y,2); }`,
			line: 1,
			column: 23,
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `the whitespace between two commas of the arguments, which the parser hands to the comma in front of it`,
			code: `a { b: f(a, ,c); }`,
			fixed: `a { b: f(a,,c); }`,
			line: 1,
			column: 13,
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `the same between each of three commas, so that one edit cannot stand for another`,
			code: `a { b: f(a, , ,c); }`,
			fixed: `a { b: f(a,,,c); }`,
			warnings: [
				{
					line: 1,
					column: 13,
					message: messages.rejectedBefore(),
				},
				{
					line: 1,
					column: 15,
					message: messages.rejectedBefore(),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `the whitespace between the opening parenthesis and a comma that opens the arguments, which the parser hands to the function`,
			code: `a { b: f( ,a); }`,
			fixed: `a { b: f(,a); }`,
			line: 1,
			column: 11,
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `the whitespace between a divider that is no comma and the comma behind it, which the parser hands to that divider just the same`,
			code: `a { b: f(1 / ,2); }`,
			fixed: `a { b: f(1 /,2); }`,
			line: 1,
			column: 14,
			message: messages.rejectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			description: `a call spelled inside a string, whose commas are no commas of a value`,
			code: `a::before { content: "func(foo,bar,baz)"; }`,
		},
		{
			description: `the same call spelled inside a url()`,
			code: `a::before { background: url('func(foo,bar,baz)'); }`,
		},
		{
			description: `commas of a value list, which this rule says nothing about`,
			code: `a { background-size: 0, 0, 0; }`,
		},
		{
			description: `spaces on both sides of the comma`,
			code: `a { transform: translate(1 , 1); }`,
		},
		{
			description: `a space in front of the comma and none behind it`,
			code: `a { transform: translate(1 ,1); }`,
		},
		{
			description: `a nested call, each comma with the space in front of it`,
			code: `a { transform: color(rgb(0 , 0 ,0) lightness(50%)); }`,
		},
		{
			description: `a break behind the comma, which makes the call multi-line`,
			code: `a { transform: translate(1,\n1); }`,
		},
		{
			description: `two spaces in front of a comma broken behind`,
			code: `a { transform: translate(1  ,\n1); }`,
		},
		{
			description: `a tab in front of a comma broken behind with a carriage return`,
			code: `a { transform: translate(1\t,\r\n1); }`,
		},
		{
			description: `a break in front of the comma, which makes the call multi-line too`,
			code: `a { transform: translate(1\n, 1); }`,
		},
		{
			description: `breaks on both sides of the comma`,
			code: `a { transform: translate(1\n,\n1); }`,
		},
		{
			description: `a gradient broken across lines, whose inner call keeps its spaces`,
			code: `a { background: linear-gradient(45deg,\nrgba(0 , 0 , 0 ,1)\n,red); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/275
			description: `a comma inside the text of a comment the value parser closes early, which is no comma of the value`,
			code: `a { b: f(x/*/*q,w*/y); }`,
		},
	],

	reject: [
		{
			description: `the last comma of a single-line nested call abutting its argument`,
			code: `a { transform: color(rgb(0 , 0, 0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 , 0 , 0) lightness(50%)); }`,
			line: 1,
			column: 31,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `the same call standing behind another`,
			code: `a { transform: color(lightness(50%) rgb(0 , 0, 0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0 , 0 , 0)); }`,
			line: 1,
			column: 46,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `a comma of a single-line call inside a value broken across lines`,
			code: `a { background: linear-gradient(45deg,\nrgba(0 , 0,0 ,1),red); }`,
			fixed: `a { background: linear-gradient(45deg,\nrgba(0 , 0 ,0 ,1),red); }`,
			line: 2,
			column: 11,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `a run of tabs between two commas of the arguments, which the parser hands to the comma in front of it and this option replaces with one space`,
			code: `a { b: f(a,\t\t,c); }`,
			fixed: `a { b: f(a , ,c); }`,
			warnings: [
				{
					line: 1,
					column: 11,
					message: messages.expectedBeforeSingleLine(),
				},
				{
					line: 1,
					column: 14,
					message: messages.expectedBeforeSingleLine(),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `a run of tabs between the opening parenthesis and a comma that opens the arguments, which the parser hands to the function and this option replaces with one space`,
			code: `a { b: f(\t\t,a); }`,
			fixed: `a { b: f( ,a); }`,
			line: 1,
			column: 12,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `a run of tabs between a divider that is no comma and the comma behind it, which this option replaces with one space`,
			code: `a { b: f(1 /\t\t,2); }`,
			fixed: `a { b: f(1 / ,2); }`,
			line: 1,
			column: 15,
			message: messages.expectedBeforeSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `a call spelled inside a string, whose commas are no commas of a value`,
			code: `a::before { content: "func(foo ,bar ,baz)"; }`,
		},
		{
			description: `the same call spelled inside a url()`,
			code: `a::before { background: url('func(foo ,bar ,baz)'); }`,
		},
		{
			description: `commas of a value list, which this rule says nothing about`,
			code: `a { background-size: 0 , 0 , 0; }`,
		},
		{
			description: `a comma abutting the argument in front of it, with a space behind it`,
			code: `a { transform: translate(1, 1); }`,
		},
		{
			description: `a comma abutting the arguments on both sides`,
			code: `a { transform: translate(1,1); }`,
		},
		{
			description: `a nested call whose commas abut the arguments in front of them`,
			code: `a { transform: color(rgb(0, 0,0) lightness(50%)); }`,
		},
		{
			description: `a space in front of a comma broken behind, which makes the call multi-line`,
			code: `a { transform: translate(1 ,\n1); }`,
		},
		{
			description: `two spaces in front of a comma broken behind`,
			code: `a { transform: translate(1  ,\n1); }`,
		},
		{
			description: `a tab in front of a comma broken behind with a carriage return`,
			code: `a { transform: translate(1\t,\r\n1); }`,
		},
		{
			description: `a break in front of the comma, which makes the call multi-line too`,
			code: `a { transform: translate(1\n, 1); }`,
		},
		{
			description: `breaks on both sides of the comma`,
			code: `a { transform: translate(1\n,\n1); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/275
			description: `a space in front of a comma inside the text of a comment the value parser closes early, neither of them the value's`,
			code: `a { b: f(x/*/*q ,w*/y,2); }`,
		},
	],

	reject: [
		{
			description: `the second comma of a single-line nested call with a space in front of it`,
			code: `a { transform: color(rgb(0, 0 , 0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0, 0, 0) lightness(50%)); }`,
			line: 1,
			column: 31,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same call standing behind another`,
			code: `a { transform: color(lightness(50%) rgb(0, 0 , 0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0, 0, 0)); }`,
			line: 1,
			column: 46,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `the whitespace between two commas of the arguments, which the parser hands to the comma in front of it`,
			code: `a { b: f(a, ,c); }`,
			fixed: `a { b: f(a,,c); }`,
			line: 1,
			column: 13,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `the whitespace between the opening parenthesis and a comma that opens the arguments, which the parser hands to the function`,
			code: `a { b: f( ,a); }`,
			fixed: `a { b: f(,a); }`,
			line: 1,
			column: 11,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `the whitespace between a divider that is no comma and the comma behind it, which the parser hands to that divider just the same`,
			code: `a { b: f(1 / ,2); }`,
			fixed: `a { b: f(1 /,2); }`,
			line: 1,
			column: 14,
			message: messages.rejectedBeforeSingleLine(),
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
			code: `a { transform: scale(1 ,1); }`,
		},
	],

	reject: [
		{
			description: `a call the option does not name`,
			code: `a { transform: scale(1,1); }`,
			fixed: `a { transform: scale(1 ,1); }`,
			line: 1,
			column: 23,
			message: messages.expectedBefore(),
		},
		{
			description: `the same call carrying two commas`,
			code: `a { background: linear-gradient(45deg,red,blue); }`,
			fixed: `a { background: linear-gradient(45deg ,red ,blue); }`,
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
			code: `a { background: linear-gradient(45deg,rgba(0,0,0,1)); }`,
			fixed: `a { background: linear-gradient(45deg ,rgba(0,0,0,1)); }`,
			line: 1,
			column: 38,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`, { ignoreFunctions: [`translate`] }],

	accept: [
		{
			description: `an ignored call whose commas carry spaces in front of them`,
			code: `a { transform: translate(1 , 1); }`,
		},
	],

	reject: [
		{
			description: `a call the option does not name, whose comma carries a space`,
			code: `a { transform: scale(1 , 1); }`,
			fixed: `a { transform: scale(1, 1); }`,
			line: 1,
			column: 24,
			message: messages.rejectedBefore(),
		},
	],
})
