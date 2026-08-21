import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName, autoStripIndent: true })

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
			code: `a { background-size: 0, 0, 0; }`,
			description: `commas of a value list, which this rule says nothing about`,
		},
		{
			code: `a { transform: translate(1 , 1); }`,
			description: `spaces on both sides of the comma`,
		},
		{
			code: `a { transform: translate(1 ,1); }`,
			description: `a space in front of the comma and none behind it`,
		},
		{
			code: `a { transform: color(rgb(0 , 0 ,0) lightness(50%)); }`,
			description: `a nested call, each comma with the space in front of it`,
		},
		{
			code: `a { background: url(data:image/svg+xml;charset=utf8,%3Csvg%20xmlns); }`,
			description: `a data URI, whose commas belong to the data rather than to a call`,
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
			code: `a { transform: translate(1, 1); }`,
			fixed: `a { transform: translate(1 , 1); }`,
			description: `a comma abutting the argument in front of it`,
			message: messages.expectedBefore(),
			line: 1,
			column: 27,
		},
		{
			code: `a { transform: translate(1  , 1); }`,
			fixed: `a { transform: translate(1 , 1); }`,
			description: `two spaces in front of the comma`,
			message: messages.expectedBefore(),
			line: 1,
			column: 29,
		},
		{
			code: `a { transform: translate(1\n, 1); }`,
			fixed: `a { transform: translate(1 , 1); }`,
			description: `a break in front of the comma`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { transform: translate(1\r\n, 1); }`,
			fixed: `a { transform: translate(1 , 1); }`,
			description: `the same break spelled with a carriage return`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { transform: translate(1\t, 1); }`,
			fixed: `a { transform: translate(1 , 1); }`,
			description: `a tab in front of the comma`,
			message: messages.expectedBefore(),
			line: 1,
			column: 28,
		},
		{
			code: `a { transform: color(rgb(0 , 0, 0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 , 0 , 0) lightness(50%)); }`,
			description: `the last comma of a nested call abutting its argument`,
			message: messages.expectedBefore(),
			line: 1,
			column: 31,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0 , 0, 0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0 , 0 , 0)); }`,
			description: `the same call standing behind another`,
			message: messages.expectedBefore(),
			line: 1,
			column: 46,
		},
		{
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
			description: `a comment in front of the comma, on the argument's own line`,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a comma between two bare addresses, whose double slashes open no comment`,
			code: `a { background: image-set(url(//cdn/a.png) 1x,url(//cdn/b.png) 2x); }`,
			fixed: `a { background: image-set(url(//cdn/a.png) 1x ,url(//cdn/b.png) 2x); }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 46,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/216
			autoStripIndent: true,
			description: `a bare address inside a call the plugin knows nothing of: plain CSS spells no comment with a double slash`,
			code: `a { b: translate(myurl(//a),2px); }`,
			fixed: `a { b: translate(myurl(//a) ,2px); }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 28,
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
			code: `$list: (value, value2)`,
			description: `an SCSS list, whose parentheses open no call either`,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `a::before { content: "func(foo ,bar ,baz)"; }`,
			description: `a call spelled inside a string, whose commas are no commas of a value`,
		},
		{
			code: `a::before { background: url('func(foo ,bar ,baz)'); }`,
			description: `the same call spelled inside a url()`,
		},
		{
			code: `a { background-size: 0 , 0 , 0; }`,
			description: `commas of a value list, which this rule says nothing about`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
			description: `a comma abutting the argument in front of it, with a space behind it`,
		},
		{
			code: `a { transform: translate(1,1); }`,
			description: `a comma abutting the arguments on both sides`,
		},
		{
			code: `a { transform: color(rgb(0, 0,0) lightness(50%)); }`,
			description: `a nested call whose commas abut the arguments in front of them`,
		},
	],

	reject: [
		{
			code: `a { transform: translate(1 , 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			description: `a space in front of the comma`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 28,
		},
		{
			code: `a { transform: translate(1  , 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			description: `two spaces in front of the comma`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 29,
		},
		{
			code: `a { transform: translate(1\n, 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			description: `a break in front of the comma`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { transform: translate(1\r\n, 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			description: `the same break spelled with a carriage return`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { transform: translate(1\t, 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			description: `a tab in front of the comma`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 28,
		},
		{
			code: `a { transform: color(rgb(0, 0 , 0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0, 0, 0) lightness(50%)); }`,
			description: `the second comma of a nested call with a space in front of it`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 31,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0, 0 , 0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0, 0, 0)); }`,
			description: `the same call standing behind another`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 46,
		},
		{
			code: `a { transform: translate(1 /*comment*/ , 1); }`,
			fixed: `a { transform: translate(1 /*comment*/, 1); }`,
			description: `a comment in front of the comma, spaced on both sides`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 40,
		},
		{
			code: `a { transform: translate(1 /*c*/ /*c*/ , 1); }`,
			fixed: `a { transform: translate(1 /*c*/ /*c*/, 1); }`,
			description: `two comments in front of the comma`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 40,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `$map: (key: value ,key2: value2)`,
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
			code: `a { background-size: 0, 0, 0; }`,
			description: `commas of a value list, which this rule says nothing about`,
		},
		{
			code: `a { transform: translate(1 , 1); }`,
			description: `spaces on both sides of the comma`,
		},
		{
			code: `a { transform: translate(1 ,1); }`,
			description: `a space in front of the comma and none behind it`,
		},
		{
			code: `a { transform: color(rgb(0 , 0 ,0) lightness(50%)); }`,
			description: `a nested call, each comma with the space in front of it`,
		},
		{
			code: `a { transform: translate(1,\n1); }`,
			description: `a break behind the comma, which makes the call multi-line`,
		},
		{
			code: `a { transform: translate(1  ,\n1); }`,
			description: `two spaces in front of a comma broken behind`,
		},
		{
			code: `a { transform: translate(1\t,\r\n1); }`,
			description: `a tab in front of a comma broken behind with a carriage return`,
		},
		{
			code: `a { transform: translate(1\n, 1); }`,
			description: `a break in front of the comma, which makes the call multi-line too`,
		},
		{
			code: `a { transform: translate(1\n,\n1); }`,
			description: `breaks on both sides of the comma`,
		},
		{
			code: `a { background: linear-gradient(45deg,\nrgba(0 , 0 , 0 ,1)\n,red); }`,
			description: `a gradient broken across lines, whose inner call keeps its spaces`,
		},
	],

	reject: [
		{
			code: `a { transform: color(rgb(0 , 0, 0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 , 0 , 0) lightness(50%)); }`,
			description: `the last comma of a single-line nested call abutting its argument`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 31,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0 , 0, 0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0 , 0 , 0)); }`,
			description: `the same call standing behind another`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 46,
		},
		{
			code: `a { background: linear-gradient(45deg,\nrgba(0 , 0,0 ,1),red); }`,
			fixed: `a { background: linear-gradient(45deg,\nrgba(0 , 0 ,0 ,1),red); }`,
			description: `a comma of a single-line call inside a value broken across lines`,
			message: messages.expectedBeforeSingleLine(),
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
			code: `a::before { content: "func(foo ,bar ,baz)"; }`,
			description: `a call spelled inside a string, whose commas are no commas of a value`,
		},
		{
			code: `a::before { background: url('func(foo ,bar ,baz)'); }`,
			description: `the same call spelled inside a url()`,
		},
		{
			code: `a { background-size: 0 , 0 , 0; }`,
			description: `commas of a value list, which this rule says nothing about`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
			description: `a comma abutting the argument in front of it, with a space behind it`,
		},
		{
			code: `a { transform: translate(1,1); }`,
			description: `a comma abutting the arguments on both sides`,
		},
		{
			code: `a { transform: color(rgb(0, 0,0) lightness(50%)); }`,
			description: `a nested call whose commas abut the arguments in front of them`,
		},
		{
			code: `a { transform: translate(1 ,\n1); }`,
			description: `a space in front of a comma broken behind, which makes the call multi-line`,
		},
		{
			code: `a { transform: translate(1  ,\n1); }`,
			description: `two spaces in front of a comma broken behind`,
		},
		{
			code: `a { transform: translate(1\t,\r\n1); }`,
			description: `a tab in front of a comma broken behind with a carriage return`,
		},
		{
			code: `a { transform: translate(1\n, 1); }`,
			description: `a break in front of the comma, which makes the call multi-line too`,
		},
		{
			code: `a { transform: translate(1\n,\n1); }`,
			description: `breaks on both sides of the comma`,
		},
	],

	reject: [
		{
			code: `a { transform: color(rgb(0, 0 , 0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0, 0, 0) lightness(50%)); }`,
			description: `the second comma of a single-line nested call with a space in front of it`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 31,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0, 0 , 0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0, 0, 0)); }`,
			description: `the same call standing behind another`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 46,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `$map: (key: value ,key2: value2)`,
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
			code: `a { transform: scale(1 ,1); }`,
			description: `a call the option does not name, with no comma in it to check`,
		},
	],

	reject: [
		{
			code: `a { transform: scale(1,1); }`,
			fixed: `a { transform: scale(1 ,1); }`,
			description: `a call the option does not name`,
			message: messages.expectedBefore(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background: linear-gradient(45deg,red,blue); }`,
			fixed: `a { background: linear-gradient(45deg ,red ,blue); }`,
			description: `the same call carrying two commas`,
			warnings: [
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 38,
				},
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 42,
				},
			],
		},
		{
			code: `a { background: linear-gradient(45deg,rgba(0,0,0,1)); }`,
			fixed: `a { background: linear-gradient(45deg ,rgba(0,0,0,1)); }`,
			description: `an ignored call nested inside one the option does not name`,
			message: messages.expectedBefore(),
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
			code: `a { transform: translate(1 , 1); }`,
			description: `an ignored call whose commas carry spaces in front of them`,
		},
	],

	reject: [
		{
			code: `a { transform: scale(1 , 1); }`,
			fixed: `a { transform: scale(1, 1); }`,
			description: `a call the option does not name, whose comma carries a space`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 24,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,
	autoStripIndent: true,

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
			message: messages.expectedBefore(),
			line: 2,
			column: 3,
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
			message: messages.expectedBefore(),
			line: 2,
			column: 3,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,
	autoStripIndent: true,

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
			message: messages.rejectedBefore(),
			line: 2,
			column: 3,
		},
	],
})
