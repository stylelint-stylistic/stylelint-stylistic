import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a::before { content: "var(--hoot)color(blue)"; }`,
			description: `calls spelled inside a string, whose parentheses close no call`,
		},
		{
			code: `a::before { background: url('var(--hoot)color(blue)'); }`,
			description: `the same calls spelled inside a url()`,
		},
		{
			code: `a::before { content: attr(data-foo); }`,
			description: `a call closing the value, with nothing behind it to space from`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
			description: `a call closing the value, with a semicolon behind it`,
		},
		{
			code: `a { transform: translate(1, 1) }`,
			description: `a call closing the value, with a space and a brace behind it`,
		},
		{
			code: `a { transform: translate(1, 1)}`,
			description: `a space between two calls`,
		},
		{
			code: `a { transform: translate(1, 1) scale(3); }`,
			description: `a nested call, with the space behind the inner one`,
		},
		{
			code: `a { color: color(rgb(0,0,0) lightness(50%)) };`,
			description: `comma-separated calls, whose commas this rule says nothing about`,
		},
		{
			code: `a { background-image: linear-gradient(#f3c, #4ec), linear-gradient(#f3c, #4ec); }`,
			description: `a call nested inside another among space-separated values`,
		},
		{
			code: `a { border-color: color(rgb(0,0,0) lightness(50%)) red pink orange; }`,
			description: `two spaces between two calls`,
		},
		{
			code: `a { transform: translate(1, 1)  scale(3); }`,
			description: `a break between two calls`,
		},
		{
			code: `a { transform: translate(1, 1)\nscale(3); }`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `a { transform: translate(1, 1)\r\nscale(3); }`,
			description: `two spaces behind a nested call`,
		},
		{
			code: `a { color: color(rgb(0,0,0)  lightness(50%)) };`,
			description: `a break behind a nested call`,
		},
		{
			code: `a { color: color(rgb(0,0,0)\nlightness(50%)) };`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `a { color: color(rgb(0,0,0)\r\nlightness(50%)) };`,
			description: `a call in the params of an at-rule, with the space behind it`,
		},
		{
			code: `@import url(example.css) screen;`,
			description: `an SCSS list, whose parentheses open no call`,
		},
		{
			code: `$list: (value, value2);$thingTwo: 0px`,
			description: `a postcss-simple-vars interpolation standing as the whole property name`,
		},
		{
			code: `.foo { $(x): calc(1px + 0px); }`,
			description: `the same interpolation standing inside a property name`,
		},
		{
			code: `.foo { border-$(x)-left: 10px; }`,
			description: `a calc() closing in front of a slash, which is the shorthand's separator rather than whitespace this rule asks for`,
		},
		{
			code: `.foo { font: calc(16px + .2vw)/1 }`,
			description: `a call abutting the call behind it`,
		},
	],

	reject: [
		{
			code: `a { transform: translate(1, 1)scale(3); }`,
			fixed: `a { transform: translate(1, 1) scale(3); }`,
			description: `a nested call abutting the one behind it`,
			message: messages.expected,
			line: 1,
			column: 31,
		},
		{
			code: `a { color: color(rgb(0,0,0)lightness(50%)) };`,
			fixed: `a { color: color(rgb(0,0,0) lightness(50%)) };`,
			description: `a call in the params of an at-rule abutting what follows`,
			message: messages.expected,
			line: 1,
			column: 28,
		},
		{
			code: `@import url(example.css)screen;`,
			fixed: `@import url(example.css) screen;`,
			description: `three calls abutting one another`,
			message: messages.expected,
			line: 1,
			column: 25,
		},
		{
			code: `a { transform: translateX(1)translateY(1)scale(3); }`,
			fixed: `a { transform: translateX(1) translateY(1) scale(3); }`,
			description: `a comment standing inside the word behind the call`,
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
			description: `a comment inside the arguments, with the call abutting what follows`,
			message: messages.expected,
			line: 1,
			column: 25,
		},
		{
			code: `a { transform: translate(1/**/, 1)scale(3); }`,
			fixed: `a { transform: translate(1/**/, 1) scale(3); }`,
			description: `a comment inside the arguments, with the call abutting the one behind it`,
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
			description: `calls spelled inside a string, whose parentheses close no call`,
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
			description: `the same calls spelled inside a url()`,
		},
		{
			code: `a::before { background: url('var(--hoot) color(blue)'); }`,
			description: `a call closing the value, with nothing behind it to space from`,
		},
		{
			code: `a::before { content: attr(data-foo); }`,
			description: `a call closing the value, with a semicolon behind it`,
		},
		{
			code: `a { transform: translate(1, 1); }`,
			description: `a call closing the value, with a space and a brace behind it`,
		},
		{
			code: `a { transform: translate(1, 1) }`,
			description: `a call abutting the call behind it`,
		},
		{
			code: `a { transform: translate(1, 1)}`,
			description: `a nested call abutting the one behind it`,
		},
		{
			code: `a { transform: translate(1, 1)scale(3); }`,
			description: `a nested call abutting the one behind it`,
		},
		{
			code: `a { color: color(rgb(0,0,0)lightness(50%)) };`,
			description: `a calc() closing in front of a slash, which is the shorthand's separator`,
		},
		{
			code: `.foo { font: calc(16px + .2vw)/1 }`,
			description: `a space between two calls`,
		},
	],

	reject: [
		{
			code: `a { transform: translate(1, 1) scale(3); }`,
			fixed: `a { transform: translate(1, 1)scale(3); }`,
			description: `two spaces between two calls`,
			message: messages.rejected,
			line: 1,
			column: 31,
		},
		{
			code: `a { transform: translate(1, 1)  scale(3); }`,
			fixed: `a { transform: translate(1, 1)scale(3); }`,
			description: `a break between two calls`,
			message: messages.rejected,
			line: 1,
			column: 31,
		},
		{
			code: `a { transform: translate(1, 1)\nscale(3); }`,
			fixed: `a { transform: translate(1, 1)scale(3); }`,
			description: `the same break spelled with a carriage return`,
			message: messages.rejected,
			line: 1,
			column: 31,
		},
		{
			code: `a { transform: translate(1, 1)\r\nscale(3); }`,
			fixed: `a { transform: translate(1, 1)scale(3); }`,
			description: `a space behind a nested call`,
			message: messages.rejected,
			line: 1,
			column: 31,
		},
		{
			code: `a { color: color(rgb(0,0,0) lightness(50%)) };`,
			fixed: `a { color: color(rgb(0,0,0)lightness(50%)) };`,
			description: `two spaces behind a nested call`,
			message: messages.rejected,
			line: 1,
			column: 28,
		},
		{
			code: `a { color: color(rgb(0,0,0)  lightness(50%)) };`,
			fixed: `a { color: color(rgb(0,0,0)lightness(50%)) };`,
			description: `a break behind a nested call`,
			message: messages.rejected,
			line: 1,
			column: 28,
		},
		{
			code: `a { color: color(rgb(0,0,0)\nlightness(50%)) };`,
			fixed: `a { color: color(rgb(0,0,0)lightness(50%)) };`,
			description: `three calls, each spaced from the next`,
			message: messages.rejected,
			line: 1,
			column: 28,
		},
		{
			code: `a { transform: translateX(1) translateY(1) scale(3); }`,
			fixed: `a { transform: translateX(1)translateY(1)scale(3); }`,
			description: `comments and spaces standing between three calls`,
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
			description: `a call in the params of an at-rule with a space behind it`,
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
			description: `a comment behind that call, with spaces on both sides`,
			message: messages.rejected,
			line: 1,
			column: 25,
		},
		{
			code: `@import url(example.css) /**/ screen;`,
			fixed: `@import url(example.css)/**/ screen;`,
			description: `a comment behind the call of an at-rule, with spaces on both sides`,
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
			description: `a Sass interpolation closing in front of a unit, whose braces open no call`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
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
			code: `
				a { padding:
				  10px
				  /* comment one*/
				  /* comment two*/
				  var(--boo)orange}
			`,
			fixed: `
				a { padding:
				  10px
				  /* comment one*/
				  /* comment two*/
				  var(--boo) orange}
			`,
			description: `comments standing between the values, with a call behind them`,
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
			description: `comments standing between the values, with a call behind them`,
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
