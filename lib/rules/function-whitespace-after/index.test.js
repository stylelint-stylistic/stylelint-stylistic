import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `calls spelled inside a string, whose parentheses close no call`,
			code: `a::before { content: "var(--hoot)color(blue)"; }`,
		},
		{
			description: `the same calls spelled inside a url()`,
			code: `a::before { background: url('var(--hoot)color(blue)'); }`,
		},
		{
			description: `a call closing the value, with nothing behind it to space from`,
			code: `a::before { content: attr(data-foo); }`,
		},
		{
			description: `a call closing the value, with a semicolon behind it`,
			code: `a { transform: translate(1, 1); }`,
		},
		{
			description: `a call closing the value, with a space and a brace behind it`,
			code: `a { transform: translate(1, 1) }`,
		},
		{
			description: `a space between two calls`,
			code: `a { transform: translate(1, 1)}`,
		},
		{
			description: `a nested call, with the space behind the inner one`,
			code: `a { transform: translate(1, 1) scale(3); }`,
		},
		{
			description: `comma-separated calls, whose commas this rule says nothing about`,
			code: `a { color: color(rgb(0,0,0) lightness(50%)) };`,
		},
		{
			description: `a call nested inside another among space-separated values`,
			code: `a { background-image: linear-gradient(#f3c, #4ec), linear-gradient(#f3c, #4ec); }`,
		},
		{
			description: `two spaces between two calls`,
			code: `a { border-color: color(rgb(0,0,0) lightness(50%)) red pink orange; }`,
		},
		{
			description: `a break between two calls`,
			code: `a { transform: translate(1, 1)  scale(3); }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { transform: translate(1, 1)\nscale(3); }`,
		},
		{
			description: `two spaces behind a nested call`,
			code: `a { transform: translate(1, 1)\r\nscale(3); }`,
		},
		{
			description: `a break behind a nested call`,
			code: `a { color: color(rgb(0,0,0)  lightness(50%)) };`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: color(rgb(0,0,0)\nlightness(50%)) };`,
		},
		{
			description: `a call in the params of an at-rule, with the space behind it`,
			code: `a { color: color(rgb(0,0,0)\r\nlightness(50%)) };`,
		},
		{
			description: `an SCSS list, whose parentheses open no call`,
			code: `@import url(example.css) screen;`,
		},
		{
			description: `a postcss-simple-vars interpolation standing as the whole property name`,
			code: `$list: (value, value2);$thingTwo: 0px`,
		},
		{
			description: `the same interpolation standing inside a property name`,
			code: `.foo { $(x): calc(1px + 0px); }`,
		},
		{
			description: `a calc() closing in front of a slash, which is the shorthand's separator rather than whitespace this rule asks for`,
			code: `.foo { border-$(x)-left: 10px; }`,
		},
		{
			description: `a call abutting the call behind it`,
			code: `.foo { font: calc(16px + .2vw)/1 }`,
		},
	],

	reject: [
		{
			description: `a nested call abutting the one behind it`,
			code: `a { transform: translate(1, 1)scale(3); }`,
			fixed: `a { transform: translate(1, 1) scale(3); }`,
			line: 1,
			column: 31,
			message: messages.expected,
		},
		{
			description: `a call in the params of an at-rule abutting what follows`,
			code: `a { color: color(rgb(0,0,0)lightness(50%)) };`,
			fixed: `a { color: color(rgb(0,0,0) lightness(50%)) };`,
			line: 1,
			column: 28,
			message: messages.expected,
		},
		{
			description: `three calls abutting one another`,
			code: `@import url(example.css)screen;`,
			fixed: `@import url(example.css) screen;`,
			line: 1,
			column: 25,
			message: messages.expected,
		},
		{
			description: `a comment standing inside the word behind the call`,
			code: `a { transform: translateX(1)translateY(1)scale(3); }`,
			fixed: `a { transform: translateX(1) translateY(1) scale(3); }`,
			warnings: [
				{
					line: 1,
					column: 29,
					message: messages.expected,
				},
				{
					line: 1,
					column: 42,
					message: messages.expected,
				},
			],
		},
		{
			description: `a comment inside the arguments, with the call abutting what follows`,
			code: `@import url(example.css)scree/**/n;`,
			fixed: `@import url(example.css) scree/**/n;`,
			line: 1,
			column: 25,
			message: messages.expected,
		},
		{
			description: `a comment inside the arguments, with the call abutting the one behind it`,
			code: `a { transform: translate(1/**/, 1)scale(3); }`,
			fixed: `a { transform: translate(1/**/, 1) scale(3); }`,
			line: 1,
			column: 35,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			description: `a bare address inside a call the plugin knows nothing of: plain CSS spells no comment with a double slash, so the parenthesis closing that call is read`,
			code: `a { b: myurl(//a)red; }`,
			fixed: `a { b: myurl(//a) red; }`,
			line: 1,
			column: 18,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			description: `the parameters of an import are read the same way as a value`,
			code: `@import myurl(//a)red;`,
			fixed: `@import myurl(//a) red;`,
			line: 1,
			column: 19,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			description: `calls spelled inside a string, whose parentheses close no call`,
			code: `a { b: url(http://x/y.png)red; }`,
			fixed: `a { b: url(http://x/y.png) red; }`,
			line: 1,
			column: 27,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `the same calls spelled inside a url()`,
			code: `a::before { content: "var(--hoot) color(blue)"; }`,
		},
		{
			description: `a call closing the value, with nothing behind it to space from`,
			code: `a::before { background: url('var(--hoot) color(blue)'); }`,
		},
		{
			description: `a call closing the value, with a semicolon behind it`,
			code: `a::before { content: attr(data-foo); }`,
		},
		{
			description: `a call closing the value, with a space and a brace behind it`,
			code: `a { transform: translate(1, 1); }`,
		},
		{
			description: `a call abutting the call behind it`,
			code: `a { transform: translate(1, 1) }`,
		},
		{
			description: `a nested call abutting the one behind it`,
			code: `a { transform: translate(1, 1)}`,
		},
		{
			description: `a nested call abutting the one behind it`,
			code: `a { transform: translate(1, 1)scale(3); }`,
		},
		{
			description: `a calc() closing in front of a slash, which is the shorthand's separator`,
			code: `a { color: color(rgb(0,0,0)lightness(50%)) };`,
		},
		{
			description: `a space between two calls`,
			code: `.foo { font: calc(16px + .2vw)/1 }`,
		},
	],

	reject: [
		{
			description: `two spaces between two calls`,
			code: `a { transform: translate(1, 1) scale(3); }`,
			fixed: `a { transform: translate(1, 1)scale(3); }`,
			line: 1,
			column: 31,
			message: messages.rejected,
		},
		{
			description: `a break between two calls`,
			code: `a { transform: translate(1, 1)  scale(3); }`,
			fixed: `a { transform: translate(1, 1)scale(3); }`,
			line: 1,
			column: 31,
			message: messages.rejected,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { transform: translate(1, 1)\nscale(3); }`,
			fixed: `a { transform: translate(1, 1)scale(3); }`,
			line: 1,
			column: 31,
			message: messages.rejected,
		},
		{
			description: `a space behind a nested call`,
			code: `a { transform: translate(1, 1)\r\nscale(3); }`,
			fixed: `a { transform: translate(1, 1)scale(3); }`,
			line: 1,
			column: 31,
			message: messages.rejected,
		},
		{
			description: `two spaces behind a nested call`,
			code: `a { color: color(rgb(0,0,0) lightness(50%)) };`,
			fixed: `a { color: color(rgb(0,0,0)lightness(50%)) };`,
			line: 1,
			column: 28,
			message: messages.rejected,
		},
		{
			description: `a break behind a nested call`,
			code: `a { color: color(rgb(0,0,0)  lightness(50%)) };`,
			fixed: `a { color: color(rgb(0,0,0)lightness(50%)) };`,
			line: 1,
			column: 28,
			message: messages.rejected,
		},
		{
			description: `three calls, each spaced from the next`,
			code: `a { color: color(rgb(0,0,0)\nlightness(50%)) };`,
			fixed: `a { color: color(rgb(0,0,0)lightness(50%)) };`,
			line: 1,
			column: 28,
			message: messages.rejected,
		},
		{
			description: `comments and spaces standing between three calls`,
			code: `a { transform: translateX(1) translateY(1) scale(3); }`,
			fixed: `a { transform: translateX(1)translateY(1)scale(3); }`,
			warnings: [
				{
					line: 1,
					column: 29,
					message: messages.rejected,
				},
				{
					line: 1,
					column: 43,
					message: messages.rejected,
				},
			],
		},
		{
			description: `a call in the params of an at-rule with a space behind it`,
			code: `a { transform: /**/ translateX(1) /**/ translateY(1) /**/ scale(3); }`,
			fixed: `a { transform: /**/ translateX(1)/**/ translateY(1)/**/ scale(3); }`,
			warnings: [
				{
					line: 1,
					column: 34,
					message: messages.rejected,
				},
				{
					line: 1,
					column: 53,
					message: messages.rejected,
				},
			],
		},
		{
			description: `a comment behind that call, with spaces on both sides`,
			code: `@import url(example.css) screen;`,
			fixed: `@import url(example.css)screen;`,
			line: 1,
			column: 25,
			message: messages.rejected,
		},
		{
			description: `a comment behind the call of an at-rule, with spaces on both sides`,
			code: `@import url(example.css) /**/ screen;`,
			fixed: `@import url(example.css)/**/ screen;`,
			line: 1,
			column: 25,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			description: `a bare address inside a call the plugin knows nothing of: plain CSS spells no comment with a double slash, so the parenthesis closing that call is read`,
			code: `a { b: myurl(//a) red; }`,
			fixed: `a { b: myurl(//a)red; }`,
			line: 1,
			column: 18,
			message: messages.rejected,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a Sass interpolation closing in front of a unit, whose braces open no call`,
			code: `h1 { max-height: #{($line-height) * ($lines-to-show)}em; }`,
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
			description: `comments standing between the values, with a call behind them`,
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
			line: 5,
			column: 13,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `the fix reaches the value this syntax prints, and the comments keep their spelling`,
			code: `a { padding:\n  10px\n  // comment one\n  // comment two\n  var(--boo)orange}`,
			fixed: `a { padding:\n  10px\n  // comment one\n  // comment two\n  var(--boo) orange}`,
			line: 5,
			column: 13,
			message: messages.expected,
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
			line: 2,
			column: 24,
			message: messages.expected,
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
			description: `comments standing between the values, with a call behind them`,
			code: `a { padding:\n  10px\n  // comment one\n  // comment two\n  var(--boo)orange}`,
			fixed: `a { padding:\n  10px\n  // comment one\n  // comment two\n  var(--boo) orange}`,
			line: 5,
			column: 13,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			description: `an unquoted address, whose double slash \`style-search\` alone reads as a comment opening whatever the syntax spells`,
			code: `a { b: url(http://x/y.png)red; }`,
			fixed: `a { b: url(http://x/y.png) red; }`,
			line: 1,
			column: 27,
			message: messages.expected,
		},
	],
})
