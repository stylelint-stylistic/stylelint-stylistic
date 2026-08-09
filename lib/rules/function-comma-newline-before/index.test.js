import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName, autoStripIndent: true })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a::before { content: "func(foo ,bar ,baz)"; }`,
		},
		{
			code: `a::before { background: url('func(foo,bar,baz)'); }`,
		},
		{
			code: `a { background-size: 0\n, 0\n, 0; }`,
		},
		{
			code: `a { transform: translate(1\n,1); }`,
		},
		{
			code: `a { transform: translate(1\r\n, 1); }`,
			description: `CRLF`,
		},
		{
			code: `a { transform: translate(1\n\n,1); }`,
		},
		{
			code: `a { transform: translate(1\r\n\r\n, 1); }`,
			description: `CRLF`,
		},
		{
			code: `a { transform: color(rgb(0\n\t, 0\n\t,0) lightness(50%)); }`,
		},
		{
			code: `a { transform: color(rgb(0\n  , 0\n  ,0) lightness(50%)); }`,
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
			description: `eol comments`,
		},
	],

	reject: [
		{
			code: `a { transform: translate(1,1); }`,
			fixed: `a { transform: translate(1\n,1); }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 27,
		},
		{
			code: `a\r\n{ transform: translate(1,1); }`,
			fixed: `a\r\n{ transform: translate(1\r\n,1); }`,
			description: `CRLF`,
			message: messages.expectedBefore(),
			line: 2,
			column: 25,
		},
		{
			code: `a { transform: translate(1  ,1); }`,
			fixed: `a { transform: translate(1\n,1); }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 29,
		},
		{
			code: `a { transform: translate(1 ,1); }`,
			fixed: `a { transform: translate(1\n,1); }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 28,
		},
		{
			code: `a { transform: translate(1\t,1); }`,
			fixed: `a { transform: translate(1\n,1); }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 28,
		},
		{
			code: `a { transform: color(rgb(0 , 0 \n,0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0\n, 0 \n,0) lightness(50%)); }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 28,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0\n, 0,0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0\n, 0\n,0)); }`,
			message: messages.expectedBefore(),
			line: 2,
			column: 4,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `$map: (key: value, key2: value2)`,
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
	config: [`always-multi-line`],

	accept: [
		{
			code: `a::before { content: "func(foo ,bar ,baz)"; }`,
		},
		{
			code: `a::before { background: url('func(foo,bar,baz)'); }`,
		},
		{
			code: `a { background-size: 0\n, 0\n, 0; }`,
		},
		{
			code: `a { transform: translate(1\n,1); }`,
		},
		{
			code: `a { transform: translate(1\r\n, 1); }`,
			description: `CRLF`,
		},
		{
			code: `a { transform: color(rgb(0\n\t, 0\n\t,0) lightness(50%)); }`,
		},
		{
			code: `a { transform: color(rgb(0\n  , 0\n  ,0) lightness(50%)); }`,
		},
		{
			code: `a { transform: translate(1,1); }`,
		},
		{
			code: `a { transform: translate(1  ,1); }`,
		},
		{
			code: `a { transform: translate(1 , 1); }`,
		},
		{
			code: `a { transform: translate(1\t,1); }`,
		},
		{
			code: `a { background: linear-gradient(45deg\n, rgba(0, 0, 0, 1)\n, red); }`,
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
			description: `eol comments`,
		},
	],

	reject: [
		{
			code: `a { transform: color(rgb(0\n, 0, 0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0\n, 0\n, 0) lightness(50%)); }`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 4,
		},
		{
			code: `a { transform: color(rgb(0\r\n, 0, 0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0\r\n, 0\r\n, 0) lightness(50%)); }`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 4,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0,0\n,0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0\n,0\n,0)); }`,
			message: messages.expectedBeforeMultiLine(),
			line: 1,
			column: 42,
		},
		{
			code: `a { background: linear-gradient(45deg\n, rgba(0\n, 0, 0\n, 1)\n, red); }`,
			fixed: `a { background: linear-gradient(45deg\n, rgba(0\n, 0\n, 0\n, 1)\n, red); }`,
			message: messages.expectedBeforeMultiLine(),
			line: 3,
			column: 4,
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `$map: (key: value,\nkey2: value2)`,
			description: `SCSS map`,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			code: `a::before { content: "func(foo\n,bar\n,baz)"; }`,
		},
		{
			code: `a::before { background: url('func(foo\n,bar,baz)'); }`,
		},
		{
			code: `a { transform: translate(1,1); }`,
		},
		{
			code: `a { transform: translate(1  ,1); }`,
		},
		{
			code: `a { transform: translate(1 , 1); }`,
		},
		{
			code: `a { transform: translate(1\t,1); }`,
		},
	],

	reject: [
		{
			code: `a { transform: color(rgb(0,0\n,0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0,0,0) lightness(50%)); }`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 1,
		},
		{
			code: `a { transform: color(rgb(0,0\r\n,0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0,0,0) lightness(50%)); }`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 1,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0\n, 0, 0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0, 0, 0)); }`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 1,
		},
		{
			code: `a { transform: color(rgb(0\n,0,\n0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0,0,\n0) lightness(50%)); }`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 1,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0,\n 0\n,0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0,\n 0,0)); }`,
			message: messages.rejectedBeforeMultiLine(),
			line: 3,
			column: 1,
		},
		{
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
			description: `eol comments`,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `$map: (key: value\n,key2: value2)`,
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
			code: `
				a {
					transform: scale(1
					,1);
				}
			`,
			description: `not ignored function without problems`,
		},
	],

	reject: [
		{
			code: `
				a { transform: scale(1,1); }
			`,
			fixed: `
				a { transform: scale(1
				,1); }
			`,
			description: `not ignored function`,
			message: messages.expectedBefore(),
			line: 1,
			column: 23,
		},
		{
			code: `
				a { background: linear-gradient(45deg,red,blue); }
			`,
			fixed: `
				a { background: linear-gradient(45deg
				,red
				,blue); }
			`,
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
			code: `
				a { background: linear-gradient(45deg,rgba(0,0,0,1)); }
			`,
			fixed: `
				a { background: linear-gradient(45deg
				,rgba(0,0,0,1)); }
			`,
			description: `ignored function nested inside a not ignored one`,
			message: messages.expectedBefore(),
			line: 1,
			column: 38,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`, { ignoreFunctions: [`translate`] }],

	accept: [
		{
			code: `
				a {
					transform: translate(1
					, 1);
				}
			`,
			description: `ignored function`,
		},
	],

	reject: [
		{
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
			description: `not ignored function`,
			message: messages.rejectedBeforeMultiLine(),
			line: 3,
			column: 2,
		},
	],
})
