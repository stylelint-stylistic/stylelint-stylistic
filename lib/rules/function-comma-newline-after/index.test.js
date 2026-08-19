import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName, autoStripIndent: true })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a::before { content: "func(foo, bar, baz)"; }`,
		},
		{
			code: `a::before { background: url('func(foo,bar,baz)'); }`,
		},
		{
			code: `a { background-size: 0,\n  0,\n  0; }`,
		},
		{
			code: `a { transform: translate(1 ,\n1); }`,
		},
		{
			code: `a { transform: translate(1 ,\n\n1); }`,
		},
		{
			code: `a { transform: translate(\n  1,\n  1\n); }`,
		},
		{
			code: `a { transform: translate(1,\r\n1); }`,
			description: `CRLF`,
		},
		{
			code: `a { transform: translate(1,\r\n\r\n1); }`,
			description: `CRLF`,
		},
		{
			code: `a { transform: color(rgb(0 ,\n\t0,\n\t0) lightness(50%)); }`,
		},
		{
			code: `a { background: linear-gradient(45deg,\n rgba(0,\n 0,\n 0,\n 1),\n red); }`,
		},
		{
			code: `
      a {
        transform: translate(
          1px, /* comment */
          1px
        );
      }
    `,
			description: `eol comments`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a bare address inside each argument, whose double slash opens no comment`,
			code: `
				a { background: image-set(url(//cdn/a.png) 1x,
				url(//cdn/b.png) 2x); }
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/214
			description: `two comments, the first of which code follows straight away: the second is no continuation of it`,
			code: `
				a { b: translate(1px/*k*/,
				/*c*/ 2px); }
			`,
		},
	],

	reject: [
		{
			code: `a { transform: translate(1,1); }`,
			fixed: `a { transform: translate(1,\n1); }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 27,
		},
		{
			code: `a { transform: translate(1,  1); }`,
			fixed: `a { transform: translate(1,\n1); }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 27,
		},
		{
			code: `a { transform: translate(1, 1); }`,
			fixed: `a { transform: translate(1,\n1); }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 27,
		},
		{
			code: `a\r\n{ transform: translate(1, 1); }`,
			fixed: `a\r\n{ transform: translate(1,\r\n1); }`,
			description: `CRLF`,
			message: messages.expectedAfter(),
			line: 2,
			column: 25,
		},
		{
			code: `a { transform: translate(1,\t1); }`,
			fixed: `a { transform: translate(1,\n1); }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 27,
		},
		{
			code: `a { transform: color(rgb(0 , 0 ,\n0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 ,\n0 ,\n0) lightness(50%)); }`,
			message: messages.expectedAfter(),
			line: 1,
			column: 28,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0 ,\n 0 ,0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0 ,\n 0 ,\n0)); }`,
			message: messages.expectedAfter(),
			line: 2,
			column: 4,
		},
		{
			code: `a { background: linear-gradient(45deg,\n rgba(0,\n 0, 0,\n 1),\n red); }`,
			fixed: `a { background: linear-gradient(45deg,\n rgba(0,\n 0,\n0,\n 1),\n red); }`,
			message: messages.expectedAfter(),
			line: 3,
			column: 3,
		},
		{
			code: `a { transform: translate(\n  1,1\n); }`,
			fixed: `a { transform: translate(\n  1,\n1\n); }`,
			message: messages.expectedAfter(),
			line: 2,
			column: 4,
		},
		{
			code:
				`a {\n  transform: translate(\n    1px,  /* comment (with trailing space) */  \n    1px\n  );\n}`,
			fixed:
				`a {\n  transform: translate(\n    1px,\n/* comment (with trailing space) */  \n    1px\n  );\n}`,
			description: `eol comments`,
			message: messages.expectedAfter(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/153
			description: `a comma between two bare addresses, whose double slashes open no comment`,
			code: `a { background: image-set(url(//cdn/a.png) 1x, url(//cdn/b.png) 2x); }`,
			fixed: `
				a { background: image-set(url(//cdn/a.png) 1x,
				url(//cdn/b.png) 2x); }
			`,
			message: messages.expectedAfter(),
			line: 1,
			column: 46,
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
			description: `sass map ignored`,
		},
		{
			code: `$list: (value, value2)`,
			description: `sass list ignored`,
		},
		{
			code: `
      a {
        transform: translate(
          1px, // line comment
          1px
        );
      }
    `,
			description: `eol comments`,
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			code: `a::before { content: "func(foo, bar, baz)"; }`,
		},
		{
			code: `a::before { background: url('func(foo,bar,baz)'); }`,
		},
		{
			code: `a { background-size: 0,\n  0,\n  0; }`,
		},
		{
			code: `a { transform: translate(1 ,\n1); }`,
		},
		{
			code: `a { transform: translate(1,\r\n1); }`,
			description: `CRLF`,
		},
		{
			code: `a { transform: color(rgb(0 ,\n\t0,\n\t0) lightness(50%)); }`,
		},
		{
			code: `a { transform: translate(1,1); }`,
		},
		{
			code: `a { transform: translate(1,  1); }`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
		},
		{
			code: `a { transform: translate(1,\t1); }`,
		},
		{
			code: `a {\r\n  transform:\r\n    translate(1,1)\r\n  scale(3);\r\n}`,
			description: `CRLF`,
		},
		{
			code: `
      .foo {
        box-shadow:
          inset 0 8px 8px -8px rgba(0, 0, 0, 1)
          inset 0 -10px 12px 0 #f00;
      }
    `,
		},
		{
			code: `
      .foo {
        background-image:
          repeating-linear-gradient(
            -45deg,
            transparent,
            rgba(0, 0, 0, 1) 5px
          );
        }
    `,
		},
		{
			code: `
      a {
        transform: translate(
          1px, /* comment */
          1px
        );
      }
    `,
			description: `eol comments`,
		},
	],

	reject: [
		{
			code: `a { transform: color(rgb(0 , 0 ,\n0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 ,\n0 ,\n0) lightness(50%)); }`,
			message: messages.expectedAfterMultiLine(),
			line: 1,
			column: 28,
		},
		{
			code: `a\r\n{ transform: color(rgb(0 , 0 ,\r\n0) lightness(50%)); }`,
			fixed: `a\r\n{ transform: color(rgb(0 ,\r\n0 ,\r\n0) lightness(50%)); }`,
			description: `CRLF`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 26,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0 ,\n 0 ,0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0 ,\n 0 ,\n0)); }`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 4,
		},
		{
			code: `a { background-image: repeating-linear-gradient(\n-45deg,\ntransparent, rgba(0, 0, 0, 1) 5px\n);}`,
			fixed:
				`a { background-image: repeating-linear-gradient(\n-45deg,\ntransparent,\nrgba(0, 0, 0, 1) 5px\n);}`,
			message: messages.expectedAfterMultiLine(),
			line: 3,
			column: 12,
		},
		{
			code: `a { background: linear-gradient(45deg,rgba(0,\n0 ,\n 0 ,\n 1)); }`,
			fixed: `a { background: linear-gradient(45deg,\nrgba(0,\n0 ,\n 0 ,\n 1)); }`,
			message: messages.expectedAfterMultiLine(),
			line: 1,
			column: 38,
		},
		{
			code: `a { transform: translate(\n  1,1\n); }`,
			fixed: `a { transform: translate(\n  1,\n1\n); }`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 4,
		},
		{
			code:
				`a {\n  transform: translate(\n    1px,  /* comment (with trailing space) */  \n    1px\n  );\n}`,
			fixed:
				`a {\n  transform: translate(\n    1px,\n/* comment (with trailing space) */  \n    1px\n  );\n}`,
			description: `eol comments`,
			message: messages.expectedAfterMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `$map: (key: value\n, key2: value2)`,
			description: `sass map`,
		},
		{
			code: `
      a {
        transform: translate(
          1px, // line comment
          1px
        );
      }
    `,
			description: `eol comments`,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			code: `a::before { content: "func(foo,\n bar,\n baz)"; }`,
		},
		{
			code: `a::before { background: url('func(foo,\nbar,\nbaz)'); }`,
		},
		{
			code: `a { background-size: 0\n, 0\n, 0; }`,
		},
		{
			code: `a { transform: translate(1\r\n,1); }`,
			description: `CRLF`,
		},
		{
			code: `a { transform: color(rgb(0\n\t,0\n\t,0) lightness(50%)); }`,
		},
		{
			code: `a { transform: translate(1,1); }`,
		},
		{
			code: `a { transform: translate(1,  1); }`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
		},
		{
			code: `a { transform: translate(1,\t1); }`,
		},
		{
			code: `a { background: linear-gradient(45deg\n,rgba(0, 0, 0, 1),red); }`,
		},
		{
			code: `
      a {
        transform: translate(1px, 1px); /* comment */
      }
    `,
			description: `eol comments`,
		},
	],

	reject: [
		{
			code: `a { transform: color(rgb(0 ,0 ,\n0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 ,0 ,0) lightness(50%)); }`,
			message: messages.rejectedAfterMultiLine(),
			line: 1,
			column: 31,
		},
		{
			code: `a { transform: color(rgb(0 ,0 ,\r\n0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 ,0 ,0) lightness(50%)); }`,
			description: `CRLF`,
			message: messages.rejectedAfterMultiLine(),
			line: 1,
			column: 31,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0 ,\n 0 ,0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0 ,0 ,0)); }`,
			message: messages.rejectedAfterMultiLine(),
			line: 1,
			column: 43,
		},
		{
			code: `a { transform: color(rgb(0\n,0 ,\n0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0\n,0 ,0) lightness(50%)); }`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 4,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0 ,\n 0\n,0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0 ,0\n,0)); }`,
			message: messages.rejectedAfterMultiLine(),
			line: 1,
			column: 43,
		},
		{
			code: `a { background: linear-gradient(45deg\n,rgba(0,0 , 0, 1), red); }`,
			fixed: `a { background: linear-gradient(45deg\n,rgba(0,0 , 0, 1),red); }`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 18,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `$map: (key: value,\nkey2: value2)`,
			description: `sass map`,
		},
		{
			code: `
      a {
        transform: translate(1px, 1px); // line comment
      }
    `,
			description: `eol comments`,
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
					transform: scale(1,
					1);
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
				a { transform: scale(1,
				1); }
			`,
			description: `not ignored function`,
			message: messages.expectedAfter(),
			line: 1,
			column: 23,
		},
		{
			code: `
				a { background: linear-gradient(45deg,red,blue); }
			`,
			fixed: `
				a { background: linear-gradient(45deg,
				red,
				blue); }
			`,
			description: `not ignored function with two problems`,
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
			code: `
				a { background: linear-gradient(45deg,rgba(0,0,0,1)); }
			`,
			fixed: `
				a { background: linear-gradient(45deg,
				rgba(0,0,0,1)); }
			`,
			description: `ignored function nested inside a not ignored one`,
			message: messages.expectedAfter(),
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
					transform: scale(1
					,1);
				}
			`,
			description: `not ignored function`,
			message: messages.rejectedAfterMultiLine(),
			line: 3,
			column: 2,
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
			description: `a comma inside the text of an inline comment is asked for no line break of its own`,
			code: `a { t: translate(1px,\n  2px // a, b\n  ); }`,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-less`,
	autoStripIndent: true,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/135
			description: `a comma inside the text of an inline comment is no comma of the value`,
			code: `a { t: translate(1px,2px // a, b\n  ); }`,
		},
	],
})
