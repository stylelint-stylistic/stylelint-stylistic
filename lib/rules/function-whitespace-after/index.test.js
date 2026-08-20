import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a::before { content: "var(--hoot)color(blue)"; }`,
		},
		{
			code: `a::before { background: url('var(--hoot)color(blue)'); }`,
		},
		{
			code: `a::before { content: attr(data-foo); }`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
		},
		{
			code: `a { transform: translate(1, 1) }`,
		},
		{
			code: `a { transform: translate(1, 1)}`,
		},
		{
			code: `a { transform: translate(1, 1) scale(3); }`,
		},
		{
			code: `a { color: color(rgb(0,0,0) lightness(50%)) };`,
		},
		{
			code: `a { background-image: linear-gradient(#f3c, #4ec), linear-gradient(#f3c, #4ec); }`,
			description: `multiple comma-separated functions `,
		},
		{
			code: `a { border-color: color(rgb(0,0,0) lightness(50%)) red pink orange; }`,
			description: `function within a function as one of multiple space-separated values`,
		},
		{
			code: `a { transform: translate(1, 1)  scale(3); }`,
		},
		{
			code: `a { transform: translate(1, 1)\nscale(3); }`,
		},
		{
			code: `a { transform: translate(1, 1)\r\nscale(3); }`,
		},
		{
			code: `a { color: color(rgb(0,0,0)  lightness(50%)) };`,
		},
		{
			code: `a { color: color(rgb(0,0,0)\nlightness(50%)) };`,
		},
		{
			code: `a { color: color(rgb(0,0,0)\r\nlightness(50%)) };`,
		},
		{
			code: `@import url(example.css) screen;`,
		},
		{
			code: `$list: (value, value2);$thingTwo: 0px`,
			description: `Sass list ignored`,
		},
		{
			code: `.foo { $(x): calc(1px + 0px); }`,
			description: `postcss-simple-vars interpolation as property name`,
		},
		{
			code: `.foo { border-$(x)-left: 10px; }`,
			description: `postcss-simple-vars interpolation within property name`,
		},
		{
			code: `.foo { font: calc(16px + .2vw)/1 }`,
			description: `after calc in \`font\` property (line-height shorthand value)`,
		},
	],

	reject: [
		{
			code: `a { transform: translate(1, 1)scale(3); }`,
			fixed: `a { transform: translate(1, 1) scale(3); }`,
			message: messages.expected,
			line: 1,
			column: 31,
		},
		{
			code: `a { color: color(rgb(0,0,0)lightness(50%)) };`,
			fixed: `a { color: color(rgb(0,0,0) lightness(50%)) };`,
			message: messages.expected,
			line: 1,
			column: 28,
		},
		{
			code: `@import url(example.css)screen;`,
			fixed: `@import url(example.css) screen;`,
			message: messages.expected,
			line: 1,
			column: 25,
		},
		{
			code: `a { transform: translateX(1)translateY(1)scale(3); }`,
			fixed: `a { transform: translateX(1) translateY(1) scale(3); }`,
			warnings: [
				{
					message: messages.expected,
					line: 1,
					column: 29,
				},
				{
					message: messages.expected,
					line: 1,
					column: 42,
				},
			],
		},
		{
			code: `@import url(example.css)scree/**/n;`,
			fixed: `@import url(example.css) scree/**/n;`,
			message: messages.expected,
			line: 1,
			column: 25,
		},
		{
			code: `a { transform: translate(1/**/, 1)scale(3); }`,
			fixed: `a { transform: translate(1/**/, 1) scale(3); }`,
			message: messages.expected,
			line: 1,
			column: 35,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			description: `a bare address inside a call the plugin knows nothing of: plain CSS spells no comment with a double slash, so the parenthesis closing that call is read`,
			code: `a { b: myurl(//a)red; }`,
			fixed: `a { b: myurl(//a) red; }`,
			message: messages.expected,
			line: 1,
			column: 18,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			description: `the parameters of an import are read the same way as a value`,
			code: `@import myurl(//a)red;`,
			fixed: `@import myurl(//a) red;`,
			message: messages.expected,
			line: 1,
			column: 19,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			description: `an unquoted address, whose double slash \`style-search\` alone reads as a comment opening whatever the syntax spells`,
			code: `a { b: url(http://x/y.png)red; }`,
			fixed: `a { b: url(http://x/y.png) red; }`,
			message: messages.expected,
			line: 1,
			column: 27,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `a::before { content: "var(--hoot) color(blue)"; }`,
		},
		{
			code: `a::before { background: url('var(--hoot) color(blue)'); }`,
		},
		{
			code: `a::before { content: attr(data-foo); }`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
		},
		{
			code: `a { transform: translate(1, 1) }`,
		},
		{
			code: `a { transform: translate(1, 1)}`,
		},
		{
			code: `a { transform: translate(1, 1)scale(3); }`,
		},
		{
			code: `a { color: color(rgb(0,0,0)lightness(50%)) };`,
		},
		{
			code: `.foo { font: calc(16px + .2vw)/1 }`,
			description: `after calc in \`font\` property (line-height shorthand value)`,
		},
	],

	reject: [
		{
			code: `a { transform: translate(1, 1) scale(3); }`,
			fixed: `a { transform: translate(1, 1)scale(3); }`,
			message: messages.rejected,
			line: 1,
			column: 31,
		},
		{
			code: `a { transform: translate(1, 1)  scale(3); }`,
			fixed: `a { transform: translate(1, 1)scale(3); }`,
			message: messages.rejected,
			line: 1,
			column: 31,
		},
		{
			code: `a { transform: translate(1, 1)\nscale(3); }`,
			fixed: `a { transform: translate(1, 1)scale(3); }`,
			message: messages.rejected,
			line: 1,
			column: 31,
		},
		{
			code: `a { transform: translate(1, 1)\r\nscale(3); }`,
			fixed: `a { transform: translate(1, 1)scale(3); }`,
			description: `CRLF`,
			message: messages.rejected,
			line: 1,
			column: 31,
		},
		{
			code: `a { color: color(rgb(0,0,0) lightness(50%)) };`,
			fixed: `a { color: color(rgb(0,0,0)lightness(50%)) };`,
			message: messages.rejected,
			line: 1,
			column: 28,
		},
		{
			code: `a { color: color(rgb(0,0,0)  lightness(50%)) };`,
			fixed: `a { color: color(rgb(0,0,0)lightness(50%)) };`,
			message: messages.rejected,
			line: 1,
			column: 28,
		},
		{
			code: `a { color: color(rgb(0,0,0)\nlightness(50%)) };`,
			fixed: `a { color: color(rgb(0,0,0)lightness(50%)) };`,
			message: messages.rejected,
			line: 1,
			column: 28,
		},
		{
			code: `a { transform: translateX(1) translateY(1) scale(3); }`,
			fixed: `a { transform: translateX(1)translateY(1)scale(3); }`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 29,
				},
				{
					message: messages.rejected,
					line: 1,
					column: 43,
				},
			],
		},
		{
			code: `a { transform: /**/ translateX(1) /**/ translateY(1) /**/ scale(3); }`,
			fixed: `a { transform: /**/ translateX(1)/**/ translateY(1)/**/ scale(3); }`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 34,
				},
				{
					message: messages.rejected,
					line: 1,
					column: 53,
				},
			],
		},
		{
			code: `@import url(example.css) screen;`,
			fixed: `@import url(example.css)screen;`,
			message: messages.rejected,
			line: 1,
			column: 25,
		},
		{
			code: `@import url(example.css) /**/ screen;`,
			fixed: `@import url(example.css)/**/ screen;`,
			message: messages.rejected,
			line: 1,
			column: 25,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			description: `a bare address inside a call the plugin knows nothing of: plain CSS spells no comment with a double slash, so the parenthesis closing that call is read`,
			code: `a { b: myurl(//a) red; }`,
			fixed: `a { b: myurl(//a)red; }`,
			message: messages.rejected,
			line: 1,
			column: 18,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `h1 { max-height: #{($line-height) * ($lines-to-show)}em; }`,
			description: `Sass-style interpolation with curly braces`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			autoStripIndent: true,
			description: `a parenthesis standing in the text of a comment this syntax does spell is no parenthesis of the value`,
			code: `
				a {
					b: 1px // c(1)x
					2px;
				}
			`,
		},
	],

	reject: [
		{
			code: `a { padding:\n  10px\n  /* comment one*/\n  /* comment two*/\n  var(--boo)orange}`,
			fixed: `a { padding:\n  10px\n  /* comment one*/\n  /* comment two*/\n  var(--boo) orange}`,
			message: messages.expected,
			line: 5,
			column: 13,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			code: `a { padding:\n  10px\n  // comment one\n  // comment two\n  var(--boo)orange}`,
			fixed: `a { padding:\n  10px\n  // comment one\n  // comment two\n  var(--boo) orange}`,
			description: `the fix reaches the value this syntax prints, and the comments keep their spelling`,
			message: messages.expected,
			line: 5,
			column: 13,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			autoStripIndent: true,
			description: `an unquoted address behind which the syntax's own comment still stands: the address hides the parenthesis from neither reading`,
			code: `
				a {
					b: url(http://x/y.png)red // c
					;
				}
			`,
			fixed: `
				a {
					b: url(http://x/y.png) red // c
					;
				}
			`,
			message: messages.expected,
			line: 2,
			column: 24,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			autoStripIndent: true,
			description: `a parenthesis standing in the text of a comment this syntax does spell is no parenthesis of the value`,
			code: `
				a {
					b: 1px // c(1)x
					2px;
				}
			`,
		},
	],

	reject: [
		{
			code: `a { padding:\n  10px\n  // comment one\n  // comment two\n  var(--boo)orange}`,
			fixed: `a { padding:\n  10px\n  // comment one\n  // comment two\n  var(--boo) orange}`,
			message: messages.expected,
			line: 5,
			column: 13,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			description: `an unquoted address, whose double slash \`style-search\` alone reads as a comment opening whatever the syntax spells`,
			code: `a { b: url(http://x/y.png)red; }`,
			fixed: `a { b: url(http://x/y.png) red; }`,
			message: messages.expected,
			line: 1,
			column: 27,
		},
	],
})
