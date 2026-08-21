import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a::before { content: "func(foo,bar,baz)"; }`,
			description: `a call spelled inside a string, whose commas are no commas of a value`,
		},
		{
			code: `a::before { background: url('func(foo,bar,baz)'); }`,
			description: `the same call spelled inside a url()`,
		},
		{
			code: `a { background-size: 0,0,0; }`,
			description: `commas of a value list, which this rule says nothing about`,
		},
		{
			code: `a { transform: translate(1 , 1); }`,
			description: `spaces on both sides of the comma`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
			description: `a space behind the comma`,
		},
		{
			code: `a { transform: color(rgb(0 , 0, 0) lightness(50%)); }`,
			description: `a nested call, each comma with the space behind it`,
		},
		{
			code: `a { background: url(data:image/svg+xml;charset=utf8,%3Csvg%20xmlns); }`,
			description: `a data URI, whose commas belong to the data rather than to a call`,
		},
		{
			code: `a { transform: translate(1, /* comment */1); }`,
			description: `a comment abutting the comma, with the space in front of the comment`,
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
	],

	reject: [
		{
			code: `a { transform: translate(1,1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			description: `arguments abutting the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 27,
		},
		{
			code: `a { transform: translate(1,  1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			description: `two spaces behind the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 27,
		},
		{
			code: `a { transform: translate(1,\n1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			description: `a break behind the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 27,
		},
		{
			code: `a { transform: translate(1,\r\n1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			description: `the same break spelled with a carriage return`,
			message: messages.expectedAfter(),
			line: 1,
			column: 27,
		},
		{
			code: `a { transform: translate(1,\t1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			description: `a tab behind the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 27,
		},
		{
			code: `a { transform: color(rgb(0 , 0 ,0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 , 0 , 0) lightness(50%)); }`,
			description: `the last comma of a nested call abutting its argument`,
			message: messages.expectedAfter(),
			line: 1,
			column: 32,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0 , 0 ,0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0 , 0 , 0)); }`,
			description: `the same call standing behind another`,
			message: messages.expectedAfter(),
			line: 1,
			column: 47,
		},
		{
			code: `a { transform: translate(1,/* comment */1); }`,
			fixed: `a { transform: translate(1, /* comment */1); }`,
			description: `a comment abutting the comma`,
			message: messages.expectedAfter(),
		},
		{
			code: `a { color: rgba(0,0,0,0); }`,
			fixed: `a { color: rgba(0, 0, 0, 0); }`,
			description: `a colour whose every comma abuts its argument`,
			warnings: [
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 18,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 20,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 22,
				},
			],
		},
		{
			code: `a { background: linear-gradient(45deg,rgba(0,0,0,1),red); }`,
			fixed: `a { background: linear-gradient(45deg, rgba(0, 0, 0, 1), red); }`,
			description: `a gradient whose every comma abuts its argument`,
			warnings: [
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 38,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 52,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 45,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 47,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 49,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a comma between two bare addresses, whose double slashes open no comment`,
			code: `a { background: image-set(url(//cdn/a.png) 1x,url(//cdn/b.png) 2x); }`,
			fixed: `a { background: image-set(url(//cdn/a.png) 1x, url(//cdn/b.png) 2x); }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 46,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/214
			description: `a run inside a string that spells the delimiters of a comment lures the reading across no comma: the comma at 24 has its space and only the one at 33 has none`,
			code: `a { b: translate("a/*b", "c*/ d",1px); }`,
			fixed: `a { b: translate("a/*b", "c*/ d", 1px); }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 33,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `$map: (key: value,key2: value2)`,
			description: `an SCSS map, whose parentheses open no call`,
		},
		{
			code: `$list: (value,value2)`,
			description: `an SCSS list, whose parentheses open no call either`,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `a::before { content: "func(foo, bar, baz)"; }`,
			description: `a call spelled inside a string, whose commas are no commas of a value`,
		},
		{
			code: `a::before { background: url('func(foo, bar, baz)'); }`,
			description: `the same call spelled inside a url()`,
		},
		{
			code: `a { background-size: 0, 0, 0; }`,
			description: `commas of a value list, which this rule says nothing about`,
		},
		{
			code: `a { transform: translate(1 ,1); }`,
			description: `a space in front of the comma and none behind it`,
		},
		{
			code: `a { transform: translate(1,1); }`,
			description: `a comma abutting the arguments on both sides`,
		},
		{
			code: `a { transform: color(rgb(0 ,0,0) lightness(50%)); }`,
			description: `a nested call whose commas abut their arguments`,
		},
		{
			code: `a { transform: translate(1,/* comment */1); }`,
			description: `a comment abutting the comma`,
		},
	],

	reject: [
		{
			code: `a { transform: translate(1, 1); }`,
			fixed: `a { transform: translate(1,1); }`,
			description: `a space behind the comma`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 27,
		},
		{
			code: `a { transform: translate(1,  1); }`,
			fixed: `a { transform: translate(1,1); }`,
			description: `two spaces behind the comma`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 27,
		},
		{
			code: `a { transform: translate(1,\n1); }`,
			fixed: `a { transform: translate(1,1); }`,
			description: `a break behind the comma`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 27,
		},
		{
			code: `a { transform: translate(1,\r\n1); }`,
			fixed: `a { transform: translate(1,1); }`,
			description: `the same break spelled with a carriage return`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 27,
		},
		{
			code: `a { transform: translate(1,\t1); }`,
			fixed: `a { transform: translate(1,1); }`,
			description: `a tab behind the comma`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 27,
		},
		{
			code: `a { transform: color(rgb(0 , 0 ,0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 ,0 ,0) lightness(50%)); }`,
			description: `the last comma of a nested call with a space behind it`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 28,
		},
		{
			code: `a { transform: lightness(50%) color(rgb(0 , 0 ,0) ); }`,
			fixed: `a { transform: lightness(50%) color(rgb(0 ,0 ,0) ); }`,
			description: `the same call standing behind another`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 43,
		},
		{
			code: `a { transform: translate(1, /* comment */1); }`,
			fixed: `a { transform: translate(1,/* comment */1); }`,
			description: `a comment behind a space, with the comma in front of the space`,
			message: messages.rejectedAfter(),
		},
		{
			code: `a { transform: translate(1, /* comment */ 1); }`,
			fixed: `a { transform: translate(1,/* comment */1); }`,
			description: `the same comment with a space behind it too`,
			message: messages.rejectedAfter(),
		},
		{
			code: `a { transform: translate(1, /* 1 */\n/* 2 */ /* 3 */ 1); }`,
			fixed: `a { transform: translate(1,/* 1 *//* 2 *//* 3 */1); }`,
			description: `three comments behind the comma, the first on a line of its own`,
			message: messages.rejectedAfter(),
		},
		{
			code: `a { background: linear-gradient(45deg , rgba(0 , 0 , 0 , 1) , red); }`,
			fixed: `a { background: linear-gradient(45deg ,rgba(0 ,0 ,0 ,1) ,red); }`,
			description: `a gradient whose every comma carries spaces`,
			warnings: [
				{
					message: messages.rejectedAfter(),
					line: 1,
					column: 39,
				},
				{
					message: messages.rejectedAfter(),
					line: 1,
					column: 61,
				},
				{
					message: messages.rejectedAfter(),
					line: 1,
					column: 48,
				},
				{
					message: messages.rejectedAfter(),
					line: 1,
					column: 52,
				},
				{
					message: messages.rejectedAfter(),
					line: 1,
					column: 56,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/214
			description: `a run inside a string that spells the delimiters of a comment lures the reading across no comma`,
			code: `a { b: translate("a/*b", "c*/ d",1px); }`,
			fixed: `a { b: translate("a/*b","c*/ d",1px); }`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 24,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `$map: (key: value, key2: value2)`,
			description: `an SCSS map, whose parentheses open no call`,
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			code: `a::before { content: "func(foo,bar,baz)"; }`,
			description: `a call spelled inside a string, whose commas are no commas of a value`,
		},
		{
			code: `a::before { background: url('func(foo,bar,baz)'); }`,
			description: `the same call spelled inside a url()`,
		},
		{
			code: `a { background-size: 0,0,0; }`,
			description: `commas of a value list, which this rule says nothing about`,
		},
		{
			code: `a { transform: translate(1 , 1); }`,
			description: `spaces on both sides of the comma`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
			description: `a space behind the comma`,
		},
		{
			code: `a { transform: color(rgb(0 , 0, 0) lightness(50%)); }`,
			description: `a nested call, each comma with the space behind it`,
		},
		{
			code: `a { transform: translate(1,\n1); }`,
			description: `a break behind the comma, which makes the call multi-line`,
		},
		{
			code: `a { transform: translate(1\n,1); }`,
			description: `a break in front of the comma, which does the same`,
		},
		{
			code: `a { transform: translate(1,\r\n1); }`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `a { color: rgba(0,0\n,0); }`,
			description: `a colour broken in front of its last comma`,
		},
		{
			code: `a { color: rgba(0\n,0,0); }`,
			description: `the same colour broken in front of its first`,
		},
		{
			code: `a { background: linear-gradient(45deg\n,rgba(0, 0, 0, 1)\n,red); }`,
			description: `a gradient broken in front of each of its outer commas`,
		},
	],

	reject: [
		{
			code: `a { transform: color(rgb(0 , 0 ,0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 , 0 , 0) lightness(50%)); }`,
			description: `the last comma of a single-line nested call abutting its argument`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 32,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0 , 0 ,0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0 , 0 , 0)); }`,
			description: `the same call standing behind another`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 47,
		},
		{
			code: `a { background: linear-gradient(45deg\n,rgba(0, 0,0, 1),red); }`,
			fixed: `a { background: linear-gradient(45deg\n,rgba(0, 0, 0, 1),red); }`,
			description: `a comma of a single-line call inside a value broken across lines`,
			message: messages.expectedAfterSingleLine(),
			line: 2,
			column: 11,
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `$map: (key: value,key2: value2)`,
			description: `an SCSS map written on one line`,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			code: `a::before { content: "func(foo, bar, baz)"; }`,
			description: `a call spelled inside a string, whose commas are no commas of a value`,
		},
		{
			code: `a::before { background: url('func(foo, bar, baz)'); }`,
			description: `the same call spelled inside a url()`,
		},
		{
			code: `a { background-size: 0, 0, 0; }`,
			description: `commas of a value list, which this rule says nothing about`,
		},
		{
			code: `a { transform: translate(1 ,1); }`,
			description: `a space in front of the comma and none behind it`,
		},
		{
			code: `a { transform: translate(1,1); }`,
			description: `a comma abutting the arguments on both sides`,
		},
		{
			code: `a { transform: color(rgb(0 ,0,0) lightness(50%)); }`,
			description: `a nested call whose commas abut their arguments`,
		},
		{
			code: `a { transform: translate(1,\n1); }`,
			description: `a break behind the comma, which makes the call multi-line`,
		},
		{
			code: `a { transform: translate(1\n, 1); }`,
			description: `a break in front of the comma, which does the same`,
		},
		{
			code: `a { transform: translate(1\r\n, 1); }`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `a { color: rgba(0, 0\n, 0); }`,
			description: `a colour broken in front of its last comma`,
		},
		{
			code: `a { color: rgba(0\n, 0, 0); }`,
			description: `the same colour broken in front of its first`,
		},
	],

	reject: [
		{
			code: `a { transform: color(rgb(0 , 0 ,0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 ,0 ,0) lightness(50%)); }`,
			description: `the last comma of a single-line nested call with a space behind it`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 28,
		},
		{
			code: `a { transform: lightness(50%) color(rgb(0 , 0 ,0) ); }`,
			fixed: `a { transform: lightness(50%) color(rgb(0 ,0 ,0) ); }`,
			description: `the same call standing behind another`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 43,
		},
		{
			code: `a { transform: lightness(50%)\ncolor(rgb(0 , 0 ,0) ); }`,
			fixed: `a { transform: lightness(50%)\ncolor(rgb(0 ,0 ,0) ); }`,
			description: `the same pair with a break between the two calls`,
			message: messages.rejectedAfterSingleLine(),
			line: 2,
			column: 13,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `$map: (key: value, key2: value2)`,
			description: `an SCSS map written on one line`,
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignoreFunctions: [`translate`, `/^rgba?$/`, /^hsl$/u] }],

	accept: [
		{
			code: `a { transform: translate(1,1); }`,
			description: `a call named in the option as a plain string`,
		},
		{
			code: `a { color: rgb(0,0,0); }`,
			description: `a call matched by the pattern given as a string`,
		},
		{
			code: `a { color: rgba(0,0,0,1); }`,
			description: `the same pattern matching another name`,
		},
		{
			code: `a { color: hsl(0,0%,0%); }`,
			description: `a call matched by the pattern given as a regular expression`,
		},
		{
			code: `a { transform: translate(min(1px,2px),1); }`,
			description: `a call nested inside an ignored one, which is passed over with it`,
		},
		{
			code: `a { transform: scale(1, 1); }`,
			description: `a call the option does not name, with no comma in it to check`,
		},
	],

	reject: [
		{
			code: `a { transform: scale(1,1); }`,
			fixed: `a { transform: scale(1, 1); }`,
			description: `a call the option does not name`,
			message: messages.expectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background: linear-gradient(45deg,red,blue); }`,
			fixed: `a { background: linear-gradient(45deg, red, blue); }`,
			description: `the same call carrying two commas`,
			warnings: [
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 38,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 42,
				},
			],
		},
		{
			code: `a { background: linear-gradient(45deg,rgba(0,0,0,1)); }`,
			fixed: `a { background: linear-gradient(45deg, rgba(0,0,0,1)); }`,
			description: `an ignored call nested inside one the option does not name`,
			message: messages.expectedAfter(),
			line: 1,
			column: 38,
		},
	],
})

testRule({
	ruleName,
	config: [`never`, { ignoreFunctions: [`translate`] }],

	accept: [
		{
			code: `a { transform: translate(1, 1); }`,
			description: `an ignored call whose commas carry spaces`,
		},
	],

	reject: [
		{
			code: `a { transform: scale(1, 1); }`,
			fixed: `a { transform: scale(1,1); }`,
			description: `a call the option does not name, whose comma carries a space`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 23,
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
