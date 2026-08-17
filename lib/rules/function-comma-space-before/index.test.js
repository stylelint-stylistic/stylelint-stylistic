import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName, autoStripIndent: true })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a::before { content: "func(foo,bar,baz)"; }`,
		},
		{
			code: `a::before { background: url('func(foo,bar,baz)'); }`,
		},
		{
			code: `a { background-size: 0, 0, 0; }`,
		},
		{
			code: `a { transform: translate(1 , 1); }`,
		},
		{
			code: `a { transform: translate(1 ,1); }`,
		},
		{
			code: `a { transform: color(rgb(0 , 0 ,0) lightness(50%)); }`,
		},
		{
			code: `a { background: url(data:image/svg+xml;charset=utf8,%3Csvg%20xmlns); }`,
			description: `data URI with spaceless comma`,
		},
	],

	reject: [
		{
			code: `a { transform: translate(1, 1); }`,
			fixed: `a { transform: translate(1 , 1); }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 27,
		},
		{
			code: `a { transform: translate(1  , 1); }`,
			fixed: `a { transform: translate(1 , 1); }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 29,
		},
		{
			code: `a { transform: translate(1\n, 1); }`,
			fixed: `a { transform: translate(1 , 1); }`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { transform: translate(1\r\n, 1); }`,
			fixed: `a { transform: translate(1 , 1); }`,
			description: `CRLF`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { transform: translate(1\t, 1); }`,
			fixed: `a { transform: translate(1 , 1); }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 28,
		},
		{
			code: `a { transform: color(rgb(0 , 0, 0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 , 0 , 0) lightness(50%)); }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 31,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0 , 0, 0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0 , 0 , 0)); }`,
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
			description: `eol comments`,
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
			code: `$map: (key: value,key2: value2)`,
			description: `Sass map ignored`,
		},
		{
			code: `$list: (value, value2)`,
			description: `Sass list ignored`,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `a::before { content: "func(foo ,bar ,baz)"; }`,
		},
		{
			code: `a::before { background: url('func(foo ,bar ,baz)'); }`,
		},
		{
			code: `a { background-size: 0 , 0 , 0; }`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
		},
		{
			code: `a { transform: translate(1,1); }`,
		},
		{
			code: `a { transform: color(rgb(0, 0,0) lightness(50%)); }`,
		},
	],

	reject: [
		{
			code: `a { transform: translate(1 , 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 28,
		},
		{
			code: `a { transform: translate(1  , 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 29,
		},
		{
			code: `a { transform: translate(1\n, 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { transform: translate(1\r\n, 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			description: `CRLF`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { transform: translate(1\t, 1); }`,
			fixed: `a { transform: translate(1, 1); }`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 28,
		},
		{
			code: `a { transform: color(rgb(0, 0 , 0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0, 0, 0) lightness(50%)); }`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 31,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0, 0 , 0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0, 0, 0)); }`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 46,
		},
		{
			code: `a { transform: translate(1 /*comment*/ , 1); }`,
			fixed: `a { transform: translate(1 /*comment*/, 1); }`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 40,
		},
		{
			code: `a { transform: translate(1 /*c*/ /*c*/ , 1); }`,
			fixed: `a { transform: translate(1 /*c*/ /*c*/, 1); }`,
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
			description: `SCSS map`,
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			code: `a::before { content: "func(foo,bar,baz)"; }`,
		},
		{
			code: `a::before { background: url('func(foo,bar,baz)'); }`,
		},
		{
			code: `a { background-size: 0, 0, 0; }`,
		},
		{
			code: `a { transform: translate(1 , 1); }`,
		},
		{
			code: `a { transform: translate(1 ,1); }`,
		},
		{
			code: `a { transform: color(rgb(0 , 0 ,0) lightness(50%)); }`,
		},
		{
			code: `a { transform: translate(1,\n1); }`,
		},
		{
			code: `a { transform: translate(1  ,\n1); }`,
		},
		{
			code: `a { transform: translate(1\t,\r\n1); }`,
			description: `CRLF`,
		},
		{
			code: `a { transform: translate(1\n, 1); }`,
		},
		{
			code: `a { transform: translate(1\n,\n1); }`,
		},
		{
			code: `a { background: linear-gradient(45deg,\nrgba(0 , 0 , 0 ,1)\n,red); }`,
		},
	],

	reject: [
		{
			code: `a { transform: color(rgb(0 , 0, 0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 , 0 , 0) lightness(50%)); }`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 31,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0 , 0, 0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0 , 0 , 0)); }`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 46,
		},
		{
			code: `a { background: linear-gradient(45deg,\nrgba(0 , 0,0 ,1),red); }`,
			fixed: `a { background: linear-gradient(45deg,\nrgba(0 , 0 ,0 ,1),red); }`,
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
			description: `SCSS map`,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			code: `a::before { content: "func(foo ,bar ,baz)"; }`,
		},
		{
			code: `a::before { background: url('func(foo ,bar ,baz)'); }`,
		},
		{
			code: `a { background-size: 0 , 0 , 0; }`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
		},
		{
			code: `a { transform: translate(1,1); }`,
		},
		{
			code: `a { transform: color(rgb(0, 0,0) lightness(50%)); }`,
		},
		{
			code: `a { transform: translate(1 ,\n1); }`,
		},
		{
			code: `a { transform: translate(1  ,\n1); }`,
		},
		{
			code: `a { transform: translate(1\t,\r\n1); }`,
			description: `CRLF`,
		},
		{
			code: `a { transform: translate(1\n, 1); }`,
		},
		{
			code: `a { transform: translate(1\n,\n1); }`,
		},
	],

	reject: [
		{
			code: `a { transform: color(rgb(0, 0 , 0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0, 0, 0) lightness(50%)); }`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 31,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0, 0 , 0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0, 0, 0)); }`,
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
			description: `SCSS map`,
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignoreFunctions: [`translate`, `/^rgba?$/`, /^hsl$/u] }],

	accept: [
		{
			code: `a { transform: translate(1,1); }`,
			description: `ignored function given as a string`,
		},
		{
			code: `a { color: rgb(0,0,0); }`,
			description: `ignored function given as a regex string`,
		},
		{
			code: `a { color: rgba(0,0,0,1); }`,
			description: `ignored function given as a regex string`,
		},
		{
			code: `a { color: hsl(0,0%,0%); }`,
			description: `ignored function given as a regex`,
		},
		{
			code: `a { transform: translate(min(1px,2px),1); }`,
			description: `function nested inside an ignored function`,
		},
		{
			code: `a { transform: scale(1 ,1); }`,
			description: `not ignored function without problems`,
		},
	],

	reject: [
		{
			code: `a { transform: scale(1,1); }`,
			fixed: `a { transform: scale(1 ,1); }`,
			description: `not ignored function`,
			message: messages.expectedBefore(),
			line: 1,
			column: 23,
		},
		{
			code: `a { background: linear-gradient(45deg,red,blue); }`,
			fixed: `a { background: linear-gradient(45deg ,red ,blue); }`,
			description: `not ignored function with two problems`,
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
			description: `ignored function nested inside a not ignored one`,
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
			description: `ignored function`,
		},
	],

	reject: [
		{
			code: `a { transform: scale(1 , 1); }`,
			fixed: `a { transform: scale(1, 1); }`,
			description: `not ignored function`,
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
