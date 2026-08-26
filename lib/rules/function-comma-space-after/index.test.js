import { messages, ruleName } from "./index.js"

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
			code: `a { background-size: 0,0,0; }`,
		},
		{
			description: `spaces on both sides of the comma`,
			code: `a { transform: translate(1 , 1); }`,
		},
		{
			description: `a space behind the comma`,
			code: `a { transform: translate(1, 1); }`,
		},
		{
			description: `a nested call, each comma with the space behind it`,
			code: `a { transform: color(rgb(0 , 0, 0) lightness(50%)); }`,
		},
		{
			description: `a data URI, whose commas belong to the data rather than to a call`,
			code: `a { background: url(data:image/svg+xml;charset=utf8,%3Csvg%20xmlns); }`,
		},
		{
			description: `a comment abutting the comma, with the space in front of the comment`,
			code: `a { transform: translate(1, /* comment */1); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a bare address inside each argument, whose double slash opens no comment`,
			code: `a { background: image-set(url(//cdn/a.png) 1x, url(//cdn/b.png) 2x); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/214
			description: `two comments, the first of which code follows straight away: the second is no continuation of it`,
			code: `a { b: translate(1px/*k*/, /*c*/ 2px); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/275
			description: `a comma inside the text of a comment the value parser closes early, which is no comma of the value`,
			code: `a { b: f(x/*/*q,w*/y); }`,
		},
	],

	reject: [
		{
			description: `arguments abutting the comma`,
			code: `a { transform: translate(1,1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 27,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces behind the comma`,
			code: `a { transform: translate(1,  1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 27,
			message: messages.expectedAfter(),
		},
		{
			description: `a break behind the comma`,
			code: `a { transform: translate(1,\n1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 27,
			message: messages.expectedAfter(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { transform: translate(1,\r\n1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 27,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab behind the comma`,
			code: `a { transform: translate(1,\t1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			line: 1,
			column: 27,
			message: messages.expectedAfter(),
		},
		{
			description: `the last comma of a nested call abutting its argument`,
			code: `a { transform: color(rgb(0 , 0 ,0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 , 0 , 0) lightness(50%)); }`,
			line: 1,
			column: 32,
			message: messages.expectedAfter(),
		},
		{
			description: `the same call standing behind another`,
			code: `a { transform: color(lightness(50%) rgb(0 , 0 ,0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0 , 0 , 0)); }`,
			line: 1,
			column: 47,
			message: messages.expectedAfter(),
		},
		{
			description: `a comment abutting the comma`,
			code: `a { transform: translate(1,/* comment */1); }`,
			fixed: `a { transform: translate(1, /* comment */1); }`,
			message: messages.expectedAfter(),
		},
		{
			description: `a colour whose every comma abuts its argument`,
			code: `a { color: rgba(0,0,0,0); }`,
			fixed: `a { color: rgba(0, 0, 0, 0); }`,
			warnings: [
				{
					line: 1,
					column: 18,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 20,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 22,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			description: `a gradient whose every comma abuts its argument`,
			code: `a { background: linear-gradient(45deg,rgba(0,0,0,1),red); }`,
			fixed: `a { background: linear-gradient(45deg, rgba(0, 0, 0, 1), red); }`,
			warnings: [
				{
					line: 1,
					column: 38,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 52,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 45,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 47,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 49,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a comma between two bare addresses, whose double slashes open no comment`,
			code: `a { background: image-set(url(//cdn/a.png) 1x,url(//cdn/b.png) 2x); }`,
			fixed: `a { background: image-set(url(//cdn/a.png) 1x, url(//cdn/b.png) 2x); }`,
			line: 1,
			column: 46,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/214
			description: `a run inside a string that spells the delimiters of a comment lures the reading across no comma: the comma at 24 has its space and only the one at 33 has none`,
			code: `a { b: translate("a/*b", "c*/ d",1px); }`,
			fixed: `a { b: translate("a/*b", "c*/ d", 1px); }`,
			line: 1,
			column: 33,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/238
			description: `a call standing behind a comment the value parser does not give back as it read it`,
			code: `a { b: x/*/*a,b*/f(1,2)c; }`,
			fixed: `a { b: x/*/*a,b*/f(1, 2)c; }`,
			line: 1,
			column: 21,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/275
			description: `a comma of the value behind a comment the value parser closes early: the one inside the comment's text is passed over and this one is placed`,
			code: `a { b: f(x/*/*q,w*/y,2); }`,
			fixed: `a { b: f(x/*/*q,w*/y, 2); }`,
			line: 1,
			column: 21,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `a break behind a comma that closes the arguments, which is the whitespace this option replaces and not a place to write beside`,
			code: `a { b: f(a,\n); }`,
			fixed: `a { b: f(a, ); }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map, whose parentheses open no call`,
			code: `$map: (key: value,key2: value2)`,
		},
		{
			description: `an SCSS list, whose parentheses open no call either`,
			code: `$list: (value,value2)`,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a call spelled inside a string, whose commas are no commas of a value`,
			code: `a::before { content: "func(foo, bar, baz)"; }`,
		},
		{
			description: `the same call spelled inside a url()`,
			code: `a::before { background: url('func(foo, bar, baz)'); }`,
		},
		{
			description: `commas of a value list, which this rule says nothing about`,
			code: `a { background-size: 0, 0, 0; }`,
		},
		{
			description: `a space in front of the comma and none behind it`,
			code: `a { transform: translate(1 ,1); }`,
		},
		{
			description: `a comma abutting the arguments on both sides`,
			code: `a { transform: translate(1,1); }`,
		},
		{
			description: `a nested call whose commas abut their arguments`,
			code: `a { transform: color(rgb(0 ,0,0) lightness(50%)); }`,
		},
		{
			description: `a comment abutting the comma`,
			code: `a { transform: translate(1,/* comment */1); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/275
			description: `a space behind a comma inside the text of a comment the value parser closes early, neither of them the value's`,
			code: `a { b: f(x/*/*q, w*/y,2); }`,
		},
	],

	reject: [
		{
			description: `a space behind the comma`,
			code: `a { transform: translate(1, 1); }`,
			fixed: `a { transform: translate(1,1); }`,
			line: 1,
			column: 27,
			message: messages.rejectedAfter(),
		},
		{
			description: `two spaces behind the comma`,
			code: `a { transform: translate(1,  1); }`,
			fixed: `a { transform: translate(1,1); }`,
			line: 1,
			column: 27,
			message: messages.rejectedAfter(),
		},
		{
			description: `a break behind the comma`,
			code: `a { transform: translate(1,\n1); }`,
			fixed: `a { transform: translate(1,1); }`,
			line: 1,
			column: 27,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { transform: translate(1,\r\n1); }`,
			fixed: `a { transform: translate(1,1); }`,
			line: 1,
			column: 27,
			message: messages.rejectedAfter(),
		},
		{
			description: `a tab behind the comma`,
			code: `a { transform: translate(1,\t1); }`,
			fixed: `a { transform: translate(1,1); }`,
			line: 1,
			column: 27,
			message: messages.rejectedAfter(),
		},
		{
			description: `the last comma of a nested call with a space behind it`,
			code: `a { transform: color(rgb(0 , 0 ,0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 ,0 ,0) lightness(50%)); }`,
			line: 1,
			column: 28,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same call standing behind another`,
			code: `a { transform: lightness(50%) color(rgb(0 , 0 ,0) ); }`,
			fixed: `a { transform: lightness(50%) color(rgb(0 ,0 ,0) ); }`,
			line: 1,
			column: 43,
			message: messages.rejectedAfter(),
		},
		{
			description: `a comment behind a space, with the comma in front of the space`,
			code: `a { transform: translate(1, /* comment */1); }`,
			fixed: `a { transform: translate(1,/* comment */1); }`,
			message: messages.rejectedAfter(),
		},
		{
			description: `the same comment with a space behind it too`,
			code: `a { transform: translate(1, /* comment */ 1); }`,
			fixed: `a { transform: translate(1,/* comment */1); }`,
			message: messages.rejectedAfter(),
		},
		{
			description: `three comments behind the comma, the first on a line of its own`,
			code: `a { transform: translate(1, /* 1 */\n/* 2 */ /* 3 */ 1); }`,
			fixed: `a { transform: translate(1,/* 1 *//* 2 *//* 3 */1); }`,
			message: messages.rejectedAfter(),
		},
		{
			description: `a gradient whose every comma carries spaces`,
			code: `a { background: linear-gradient(45deg , rgba(0 , 0 , 0 , 1) , red); }`,
			fixed: `a { background: linear-gradient(45deg ,rgba(0 ,0 ,0 ,1) ,red); }`,
			warnings: [
				{
					line: 1,
					column: 39,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 61,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 48,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 52,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 56,
					message: messages.rejectedAfter(),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/214
			description: `a run inside a string that spells the delimiters of a comment lures the reading across no comma`,
			code: `a { b: translate("a/*b", "c*/ d",1px); }`,
			fixed: `a { b: translate("a/*b","c*/ d",1px); }`,
			line: 1,
			column: 24,
			message: messages.rejectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/275
			description: `a comma of the value carrying the whitespace this option takes away, behind a comment the value parser closes early whose text carries whitespace of its own: only the value's is taken`,
			code: `a { b: f(x/*/*q, w*/y, 2); }`,
			fixed: `a { b: f(x/*/*q, w*/y,2); }`,
			line: 1,
			column: 22,
			message: messages.rejectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `the whitespace between a comma that closes the arguments and the closing parenthesis, which the parser hands to the function`,
			code: `a { b: f(a, ); }`,
			fixed: `a { b: f(a,); }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map, whose parentheses open no call`,
			code: `$map: (key: value, key2: value2)`,
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
			code: `a { background-size: 0,0,0; }`,
		},
		{
			description: `spaces on both sides of the comma`,
			code: `a { transform: translate(1 , 1); }`,
		},
		{
			description: `a space behind the comma`,
			code: `a { transform: translate(1, 1); }`,
		},
		{
			description: `a nested call, each comma with the space behind it`,
			code: `a { transform: color(rgb(0 , 0, 0) lightness(50%)); }`,
		},
		{
			description: `a break behind the comma, which makes the call multi-line`,
			code: `a { transform: translate(1,\n1); }`,
		},
		{
			description: `a break in front of the comma, which does the same`,
			code: `a { transform: translate(1\n,1); }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { transform: translate(1,\r\n1); }`,
		},
		{
			description: `a colour broken in front of its last comma`,
			code: `a { color: rgba(0,0\n,0); }`,
		},
		{
			description: `the same colour broken in front of its first`,
			code: `a { color: rgba(0\n,0,0); }`,
		},
		{
			description: `a gradient broken in front of each of its outer commas`,
			code: `a { background: linear-gradient(45deg\n,rgba(0, 0, 0, 1)\n,red); }`,
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
			code: `a { transform: color(rgb(0 , 0 ,0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 , 0 , 0) lightness(50%)); }`,
			line: 1,
			column: 32,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same call standing behind another`,
			code: `a { transform: color(lightness(50%) rgb(0 , 0 ,0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0 , 0 , 0)); }`,
			line: 1,
			column: 47,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `a comma of a single-line call inside a value broken across lines`,
			code: `a { background: linear-gradient(45deg\n,rgba(0, 0,0, 1),red); }`,
			fixed: `a { background: linear-gradient(45deg\n,rgba(0, 0, 0, 1),red); }`,
			line: 2,
			column: 11,
			message: messages.expectedAfterSingleLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `a run of tabs between a comma that closes the arguments and the closing parenthesis, which the parser hands to the function and this option replaces with one space`,
			code: `a { b: f(a,\t\t); }`,
			fixed: `a { b: f(a, ); }`,
			line: 1,
			column: 11,
			message: messages.expectedAfterSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map written on one line`,
			code: `$map: (key: value,key2: value2)`,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `a call spelled inside a string, whose commas are no commas of a value`,
			code: `a::before { content: "func(foo, bar, baz)"; }`,
		},
		{
			description: `the same call spelled inside a url()`,
			code: `a::before { background: url('func(foo, bar, baz)'); }`,
		},
		{
			description: `commas of a value list, which this rule says nothing about`,
			code: `a { background-size: 0, 0, 0; }`,
		},
		{
			description: `a space in front of the comma and none behind it`,
			code: `a { transform: translate(1 ,1); }`,
		},
		{
			description: `a comma abutting the arguments on both sides`,
			code: `a { transform: translate(1,1); }`,
		},
		{
			description: `a nested call whose commas abut their arguments`,
			code: `a { transform: color(rgb(0 ,0,0) lightness(50%)); }`,
		},
		{
			description: `a break behind the comma, which makes the call multi-line`,
			code: `a { transform: translate(1,\n1); }`,
		},
		{
			description: `a break in front of the comma, which does the same`,
			code: `a { transform: translate(1\n, 1); }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { transform: translate(1\r\n, 1); }`,
		},
		{
			description: `a colour broken in front of its last comma`,
			code: `a { color: rgba(0, 0\n, 0); }`,
		},
		{
			description: `the same colour broken in front of its first`,
			code: `a { color: rgba(0\n, 0, 0); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/275
			description: `a space behind a comma inside the text of a comment the value parser closes early, neither of them the value's`,
			code: `a { b: f(x/*/*q, w*/y,2); }`,
		},
	],

	reject: [
		{
			description: `the last comma of a single-line nested call with a space behind it`,
			code: `a { transform: color(rgb(0 , 0 ,0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 ,0 ,0) lightness(50%)); }`,
			line: 1,
			column: 28,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `the same call standing behind another`,
			code: `a { transform: lightness(50%) color(rgb(0 , 0 ,0) ); }`,
			fixed: `a { transform: lightness(50%) color(rgb(0 ,0 ,0) ); }`,
			line: 1,
			column: 43,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `the same pair with a break between the two calls`,
			code: `a { transform: lightness(50%)\ncolor(rgb(0 , 0 ,0) ); }`,
			fixed: `a { transform: lightness(50%)\ncolor(rgb(0 ,0 ,0) ); }`,
			line: 2,
			column: 13,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349
			description: `the whitespace between a comma that closes the arguments and the closing parenthesis, which the parser hands to the function`,
			code: `a { b: f(a, ); }`,
			fixed: `a { b: f(a,); }`,
			line: 1,
			column: 11,
			message: messages.rejectedAfterSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map written on one line`,
			code: `$map: (key: value, key2: value2)`,
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
			code: `a { transform: scale(1, 1); }`,
		},
	],

	reject: [
		{
			description: `a call the option does not name`,
			code: `a { transform: scale(1,1); }`,
			fixed: `a { transform: scale(1, 1); }`,
			line: 1,
			column: 23,
			message: messages.expectedAfter(),
		},
		{
			description: `the same call carrying two commas`,
			code: `a { background: linear-gradient(45deg,red,blue); }`,
			fixed: `a { background: linear-gradient(45deg, red, blue); }`,
			warnings: [
				{
					line: 1,
					column: 38,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 42,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			description: `an ignored call nested inside one the option does not name`,
			code: `a { background: linear-gradient(45deg,rgba(0,0,0,1)); }`,
			fixed: `a { background: linear-gradient(45deg, rgba(0,0,0,1)); }`,
			line: 1,
			column: 38,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`, { ignoreFunctions: [`translate`] }],

	accept: [
		{
			description: `an ignored call whose commas carry spaces`,
			code: `a { transform: translate(1, 1); }`,
		},
	],

	reject: [
		{
			description: `a call the option does not name, whose comma carries a space`,
			code: `a { transform: scale(1, 1); }`,
			fixed: `a { transform: scale(1,1); }`,
			line: 1,
			column: 23,
			message: messages.rejectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/135
			description: `a comma inside the text of an inline comment is no comma of the value`,
			code: `a { t: translate(1px,2px // a, b\n  ); }`,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/135
			description: `a comma inside the text of an inline comment is no comma of the value`,
			code: `a { t: translate(1px, 2px // a, b\n  ); }`,
		},
	],
})
