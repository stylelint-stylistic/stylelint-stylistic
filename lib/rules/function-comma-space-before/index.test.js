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
			code: `$list: (value, value2)`,
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
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map, whose parentheses open no call`,
			code: `$map: (key: value ,key2: value2)`,
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
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map written on one line`,
			code: `$map: (key: value ,key2: value2)`,
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

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/135
			description: `a comma inside the text of an inline comment is no comma of the value`,
			code: `a { t: translate(1px , // a, b\n  2px); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a comma inside the text of an inline comment behind a bare address is no comma of the value`,
			code: `
				a { t: image-set(url(//cdn/a.png) 1x , // a, b
				  url(//cdn/b.png) 2x); }
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/135
			description: `inline comment before the comma: the comma cannot join the comment's line, so the value is left alone and the warning stands`,
			code: `a { t: translate(1px // c\n  ,2px); }`,
			fixed: `a { t: translate(1px // c\n  ,2px); }`,
			line: 2,
			column: 3,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `an inline comment standing behind a bare address is a comment all the same, and the comma cannot join its line`,
			code: `
				a { t: image-set(url(//cdn/a.png) 1x // c
				  ,url(//cdn/b.png) 2x); }
			`,
			fixed: `
				a { t: image-set(url(//cdn/a.png) 1x // c
				  ,url(//cdn/b.png) 2x); }
			`,
			line: 2,
			column: 3,
			message: messages.expectedBefore(),
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
			code: `a { t: translate(1px, // a , b\n  2px); }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/135
			description: `inline comment before the comma: the comma cannot join the comment's line, so the value is left alone and the warning stands`,
			code: `a { t: translate(1px // c\n  ,2px); }`,
			fixed: `a { t: translate(1px // c\n  ,2px); }`,
			line: 2,
			column: 3,
			message: messages.rejectedBefore(),
		},
	],
})
