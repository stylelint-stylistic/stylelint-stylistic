import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a::before { content: "func(foo, bar, baz)"; }`,
			description: `a call spelled inside a string, whose commas are no commas of a value`,
		},
		{
			code: `a::before { background: url('func(foo,bar,baz)'); }`,
			description: `the same call spelled inside a url()`,
		},
		{
			code: `
				a { background-size: 0,
				  0,
				  0; }
			`,
			description: `commas of a value list, which this rule says nothing about`,
		},
		{
			code: `a { transform: translate(1 ,\n1); }`,
			description: `a break behind the comma, with a space in front of it`,
		},
		{
			code: `
				a { transform: translate(1 ,

				1); }
			`,
			description: `an empty line behind the comma`,
		},
		{
			code: `
				a { transform: translate(
				  1,
				  1
				); }
			`,
			description: `each argument on a line of its own`,
		},
		{
			code: `a { transform: translate(1,\r\n1); }`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `a { transform: translate(1,\r\n\r\n1); }`,
			description: `the same empty line spelled with carriage returns`,
		},
		{
			code: `
				a { transform: color(rgb(0 ,
					0,
					0) lightness(50%)); }
			`,
			description: `a call nested in another, broken behind each of its commas`,
		},
		{
			code: `
				a { background: linear-gradient(45deg,
				 rgba(0,
				 0,
				 0,
				 1),
				 red); }
			`,
			description: `nested calls, every comma broken behind`,
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
			description: `a comment behind the comma, with the break behind the comment`,
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
			description: `arguments abutting the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 27,
		},
		{
			code: `a { transform: translate(1,  1); }`,
			fixed: `a { transform: translate(1,\n1); }`,
			description: `two spaces behind the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 27,
		},
		{
			code: `a { transform: translate(1, 1); }`,
			fixed: `a { transform: translate(1,\n1); }`,
			description: `a space behind the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 27,
		},
		{
			code: `a\r\n{ transform: translate(1, 1); }`,
			fixed: `a\r\n{ transform: translate(1,\r\n1); }`,
			description: `the same declaration under a selector broken with a carriage return`,
			message: messages.expectedAfter(),
			line: 2,
			column: 25,
		},
		{
			code: `a { transform: translate(1,\t1); }`,
			fixed: `a { transform: translate(1,\n1); }`,
			description: `a tab behind the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 27,
		},
		{
			code: `a { transform: color(rgb(0 , 0 ,\n0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 ,\n0 ,\n0) lightness(50%)); }`,
			description: `the first two commas of a nested call, neither broken behind`,
			message: messages.expectedAfter(),
			line: 1,
			column: 28,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0 ,\n 0 ,0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0 ,\n 0 ,\n0)); }`,
			description: `the last comma of a nested call standing behind the outer one`,
			message: messages.expectedAfter(),
			line: 2,
			column: 4,
		},
		{
			code: `
				a { background: linear-gradient(45deg,
				 rgba(0,
				 0, 0,
				 1),
				 red); }
			`,
			fixed: `
				a { background: linear-gradient(45deg,
				 rgba(0,
				 0,
				0,
				 1),
				 red); }
			`,
			description: `one comma of many with a space behind it`,
			message: messages.expectedAfter(),
			line: 3,
			column: 3,
		},
		{
			code: `
				a { transform: translate(
				  1,1
				); }
			`,
			fixed: `
				a { transform: translate(
				  1,
				1
				); }
			`,
			description: `a comma inside a call whose arguments are each on their own line`,
			message: messages.expectedAfter(),
			line: 2,
			column: 4,
		},
		{
			code:
				`a {\n  transform: translate(\n    1px,  /* comment (with trailing space) */  \n    1px\n  );\n}`,
			fixed:
				`a {\n  transform: translate(\n    1px,\n/* comment (with trailing space) */  \n    1px\n  );\n}`,
			description: `a comment behind the comma with trailing whitespace of its own`,
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
			description: `an SCSS map, whose parentheses open no call`,
		},
		{
			code: `$list: (value, value2)`,
			description: `an SCSS list, whose parentheses open no call either`,
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
			description: `an inline comment behind the comma, with the break behind the comment`,
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			code: `a::before { content: "func(foo, bar, baz)"; }`,
			description: `a call spelled inside a string, whose commas are no commas of a value`,
		},
		{
			code: `a::before { background: url('func(foo,bar,baz)'); }`,
			description: `the same call spelled inside a url()`,
		},
		{
			code: `
				a { background-size: 0,
				  0,
				  0; }
			`,
			description: `commas of a value list, which this rule says nothing about`,
		},
		{
			code: `a { transform: translate(1 ,\n1); }`,
			description: `a break behind the comma of a multi-line call`,
		},
		{
			code: `a { transform: translate(1,\r\n1); }`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `
				a { transform: color(rgb(0 ,
					0,
					0) lightness(50%)); }
			`,
			description: `a nested call broken behind each comma`,
		},
		{
			code: `a { transform: translate(1,1); }`,
			description: `a single-line call, which this option passes over`,
		},
		{
			code: `a { transform: translate(1,  1); }`,
			description: `two spaces behind the comma of a single-line call`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
			description: `a space behind the comma of a single-line call`,
		},
		{
			code: `a { transform: translate(1,\t1); }`,
			description: `a tab behind the comma of a single-line call`,
		},
		{
			code: `a {\r\n  transform:\r\n    translate(1,1)\r\n  scale(3);\r\n}`,
			description: `a single-line call inside a value broken across lines`,
		},
		{
			code: `
				.foo {
				  box-shadow:
				    inset 0 8px 8px -8px rgba(0, 0, 0, 1)
				    inset 0 -10px 12px 0 #f00;
				}
			`,
			description: `a value broken across lines whose calls are each single-line`,
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
			description: `the same value written with a repeating gradient`,
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
			description: `a comment behind the comma of a multi-line call`,
		},
	],

	reject: [
		{
			code: `a { transform: color(rgb(0 , 0 ,\n0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 ,\n0 ,\n0) lightness(50%)); }`,
			description: `the first two commas of a nested multi-line call, neither broken behind`,
			message: messages.expectedAfterMultiLine(),
			line: 1,
			column: 28,
		},
		{
			code: `a\r\n{ transform: color(rgb(0 , 0 ,\r\n0) lightness(50%)); }`,
			fixed: `a\r\n{ transform: color(rgb(0 ,\r\n0 ,\r\n0) lightness(50%)); }`,
			description: `the same call spelled with carriage returns`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 26,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0 ,\n 0 ,0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0 ,\n 0 ,\n0)); }`,
			description: `the last comma of a nested call standing behind the outer one`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 4,
		},
		{
			code: `
				a { background-image: repeating-linear-gradient(
				-45deg,
				transparent, rgba(0, 0, 0, 1) 5px
				);}
			`,
			fixed:
				`a { background-image: repeating-linear-gradient(\n-45deg,\ntransparent,\nrgba(0, 0, 0, 1) 5px\n);}`,
			description: `a gradient broken across lines with one comma left unbroken`,
			message: messages.expectedAfterMultiLine(),
			line: 3,
			column: 12,
		},
		{
			code: `
				a { background: linear-gradient(45deg,rgba(0,
				0 ,
				 0 ,
				 1)); }
			`,
			fixed: `
				a { background: linear-gradient(45deg,
				rgba(0,
				0 ,
				 0 ,
				 1)); }
			`,
			description: `a gradient whose outer comma is unbroken`,
			message: messages.expectedAfterMultiLine(),
			line: 1,
			column: 38,
		},
		{
			code: `
				a { transform: translate(
				  1,1
				); }
			`,
			fixed: `
				a { transform: translate(
				  1,
				1
				); }
			`,
			description: `a comma inside a call whose arguments are each on their own line`,
			message: messages.expectedAfterMultiLine(),
			line: 2,
			column: 4,
		},
		{
			code:
				`a {\n  transform: translate(\n    1px,  /* comment (with trailing space) */  \n    1px\n  );\n}`,
			fixed:
				`a {\n  transform: translate(\n    1px,\n/* comment (with trailing space) */  \n    1px\n  );\n}`,
			description: `a comment behind the comma with trailing whitespace of its own`,
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
			description: `an SCSS map broken in front of its comma`,
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
			description: `an inline comment behind the comma of a multi-line call`,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			code: `
				a::before { content: "func(foo,
				 bar,
				 baz)"; }
			`,
			description: `a call spelled inside a string, broken across lines`,
		},
		{
			code: `
				a::before { background: url('func(foo,
				bar,
				baz)'); }
			`,
			description: `the same call spelled inside a url()`,
		},
		{
			code: `a { background-size: 0\n, 0\n, 0; }`,
			description: `commas of a value list broken in front of, which this rule says nothing about`,
		},
		{
			code: `a { transform: translate(1\r\n,1); }`,
			description: `a break in front of the comma, spelled with a carriage return`,
		},
		{
			code: `a { transform: color(rgb(0\n\t,0\n\t,0) lightness(50%)); }`,
			description: `a nested call broken in front of each comma`,
		},
		{
			code: `a { transform: translate(1,1); }`,
			description: `a single-line call, which this option passes over`,
		},
		{
			code: `a { transform: translate(1,  1); }`,
			description: `two spaces behind the comma of a single-line call`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
			description: `a space behind the comma of a single-line call`,
		},
		{
			code: `a { transform: translate(1,\t1); }`,
			description: `a tab behind the comma of a single-line call`,
		},
		{
			code: `a { background: linear-gradient(45deg\n,rgba(0, 0, 0, 1),red); }`,
			description: `a gradient broken in front of its outer comma, the inner call single-line`,
		},
		{
			code: `
				a {
				  transform: translate(1px, 1px); /* comment */
				}
			`,
			description: `a comment behind the whole declaration, on the same line`,
		},
	],

	reject: [
		{
			code: `a { transform: color(rgb(0 ,0 ,\n0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 ,0 ,0) lightness(50%)); }`,
			description: `a break behind the last comma of a nested call`,
			message: messages.rejectedAfterMultiLine(),
			line: 1,
			column: 31,
		},
		{
			code: `a { transform: color(rgb(0 ,0 ,\r\n0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0 ,0 ,0) lightness(50%)); }`,
			description: `the same call spelled with a carriage return`,
			message: messages.rejectedAfterMultiLine(),
			line: 1,
			column: 31,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0 ,\n 0 ,0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0 ,0 ,0)); }`,
			description: `a break behind a comma of the second nested call`,
			message: messages.rejectedAfterMultiLine(),
			line: 1,
			column: 43,
		},
		{
			code: `a { transform: color(rgb(0\n,0 ,\n0) lightness(50%)); }`,
			fixed: `a { transform: color(rgb(0\n,0 ,0) lightness(50%)); }`,
			description: `a break in front of one comma and behind another`,
			message: messages.rejectedAfterMultiLine(),
			line: 2,
			column: 4,
		},
		{
			code: `a { transform: color(lightness(50%) rgb(0 ,\n 0\n,0)); }`,
			fixed: `a { transform: color(lightness(50%) rgb(0 ,0\n,0)); }`,
			description: `a break behind the last comma of the inner call`,
			message: messages.rejectedAfterMultiLine(),
			line: 1,
			column: 43,
		},
		{
			code: `a { background: linear-gradient(45deg\n,rgba(0,0 , 0, 1), red); }`,
			fixed: `a { background: linear-gradient(45deg\n,rgba(0,0 , 0, 1),red); }`,
			description: `a break in front of the outer comma and a space behind an inner one`,
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
			description: `an SCSS map broken behind its comma`,
		},
		{
			code: `
				a {
				  transform: translate(1px, 1px); // line comment
				}
			`,
			description: `a comment behind the whole declaration, on the same line`,
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
			code: `
				a {
					transform: scale(1,
					1);
				}
			`,
			description: `a call the option does not name, with no comma in it to check`,
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
			description: `a call the option does not name`,
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
			code: `
				a { background: linear-gradient(45deg,rgba(0,0,0,1)); }
			`,
			fixed: `
				a { background: linear-gradient(45deg,
				rgba(0,0,0,1)); }
			`,
			description: `an ignored call nested inside one the option does not name`,
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
			description: `an ignored call broken across lines`,
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
			description: `a call the option does not name, broken across lines`,
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

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/135
			description: `a comma inside the text of an inline comment is asked for no line break of its own`,
			code: `
				a { t: translate(1px,
				  2px // a, b
				  ); }
			`,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/135
			description: `a comma inside the text of an inline comment is no comma of the value`,
			code: `a { t: translate(1px,2px // a, b\n  ); }`,
		},
	],
})
