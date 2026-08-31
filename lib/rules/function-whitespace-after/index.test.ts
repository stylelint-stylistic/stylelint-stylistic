import { messages, ruleName } from "./index.ts"

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
			description: `the same call in a declaration a semicolon closes, which is none of the value`,
			code: `a { transform: translate(1, 1); }`,
		},
		{
			description: `the same call in a declaration with no semicolon, the block closing a space behind it`,
			code: `a { transform: translate(1, 1) }`,
		},
		{
			description: `the same declaration with the block closing straight behind the call`,
			code: `a { transform: translate(1, 1)}`,
		},
		{
			description: `a single space between two calls, which is what this option asks for`,
			code: `a { transform: translate(1, 1) scale(3); }`,
		},
		{
			description: `a space behind a call nested inside another`,
			code: `a { color: color(rgb(0,0,0) lightness(50%)) };`,
		},
		{
			description: `two calls separated by a comma, which this rule accepts behind a parenthesis`,
			code: `a { background-image: linear-gradient(#f3c, #4ec), linear-gradient(#f3c, #4ec); }`,
		},
		{
			description: `a call nested inside another, standing among space-separated values`,
			code: `a { border-color: color(rgb(0,0,0) lightness(50%)) red pink orange; }`,
		},
		{
			description: `two spaces between two calls`,
			code: `a { transform: translate(1, 1)  scale(3); }`,
		},
		{
			description: `a break between two calls`,
			code: `a { transform: translate(1, 1)\nscale(3); }`,
		},
		{
			description: `the same break spelled with a carriage return and a line feed`,
			code: `a { transform: translate(1, 1)\r\nscale(3); }`,
		},
		{
			description: `two spaces behind that nested call`,
			code: `a { color: color(rgb(0,0,0)  lightness(50%)) };`,
		},
		{
			description: `a break behind that nested call`,
			code: `a { color: color(rgb(0,0,0)\nlightness(50%)) };`,
		},
		{
			description: `the same break behind the nested call spelled with a carriage return and a line feed`,
			code: `a { color: color(rgb(0,0,0)\r\nlightness(50%)) };`,
		},
		{
			description: `a call in the parameters of an at-rule, with a space behind it`,
			code: `@import url(example.css) screen;`,
		},
		{
			description: `a list in parentheses that open no call`,
			code: `$list: (value, value2);$thingTwo: 0px`,
		},
		{
			description: `an interpolation standing as the whole property name, whose parentheses are no part of any value`,
			code: `.foo { $(x): calc(1px + 0px); }`,
		},
		{
			description: `the same interpolation standing inside a property name`,
			code: `.foo { border-$(x)-left: 10px; }`,
		},
		{
			description: `a call closing in front of a slash, which is the shorthand's separator rather than whitespace this rule asks for`,
			code: `.foo { font: calc(16px + .2vw)/1 }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230
			description: `a group inside a calculation, which plain CSS spells as readily as any other syntax, and whose closing parenthesis the operator behind it must be spaced from`,
			code: `a { width: calc((100% - 20px) - 1rem); }`,
		},
		{
			description: `the same group with the operator abutting it on both sides, which is the whitespace the option asks for and not the whitespace the grammar of a calculation does`,
			code: `a { width: calc((100% - 20px)-1rem); }`,
		},
		{
			description: `a group on each side of the operator, with nothing spacing any of the three`,
			code: `a { b: calc((1px)+(2px)); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/252
			description: `a percentage in front of a parenthesis, which the operator closing it names no call by`,
			code: `a { b: 50%(1)red; }`,
		},
		{
			description: `a run opening on a digit and carrying a character outside ASCII, which is a dimension in front of a parenthesis and no call either`,
			code: `a { b: 2日e(1)red; }`,
		},
		{
			description: `the same run with the character spelled as an escape`,
			code: `a { b: 2\\65 f(1)red; }`,
		},
	],

	reject: [
		{
			description: `a call abutting the call behind it`,
			code: `a { transform: translate(1, 1)scale(3); }`,
			fixed: `a { transform: translate(1, 1) scale(3); }`,
			line: 1,
			column: 31,
			message: messages.expected,
		},
		{
			description: `a call nested inside another, abutting what follows it inside the outer one`,
			code: `a { color: color(rgb(0,0,0)lightness(50%)) };`,
			fixed: `a { color: color(rgb(0,0,0) lightness(50%)) };`,
			line: 1,
			column: 28,
			message: messages.expected,
		},
		{
			description: `a call in the parameters of an at-rule abutting what follows`,
			code: `@import url(example.css)screen;`,
			fixed: `@import url(example.css) screen;`,
			line: 1,
			column: 25,
			message: messages.expected,
		},
		{
			description: `three calls abutting one another`,
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
			description: `a comment standing inside the word behind the call`,
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
			description: `a bare address inside a url(), where plain CSS spells no comment with a double slash either`,
			code: `a { b: url(http://x/y.png)red; }`,
			fixed: `a { b: url(http://x/y.png) red; }`,
			line: 1,
			column: 27,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230
			description: `two calls abutting one another, each parenthesis closing a call of its own`,
			code: `a { transform: translate(1px)rotate(2deg); }`,
			fixed: `a { transform: translate(1px) rotate(2deg); }`,
			line: 1,
			column: 30,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230
			description: `a call standing in front of a group, whose own parenthesis is read while the group's is not`,
			code: `a { b: f(1)(2); }`,
			fixed: `a { b: f(1) (2); }`,
			line: 1,
			column: 12,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230
			description: `an address holding an escaped parenthesis, which closes the call no more than a parenthesis inside a string does`,
			code: `a { b: url(a\\)b)red; }`,
			fixed: `a { b: url(a\\)b) red; }`,
			line: 1,
			column: 17,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230
			description: `a call whose name closes on a digit, standing at the head of the value`,
			code: `a { b: atan2(1,2)red; }`,
			fixed: `a { b: atan2(1,2) red; }`,
			line: 1,
			column: 18,
			message: messages.expected,
		},
		{
			description: `the same call named with an underscore`,
			code: `a { b: a_(1)red; }`,
			fixed: `a { b: a_(1) red; }`,
			line: 1,
			column: 13,
			message: messages.expected,
		},
		{
			description: `the same call named with a hyphen and a digit, standing in the parameters of an import`,
			code: `@import col-6(a)screen;`,
			fixed: `@import col-6(a) screen;`,
			line: 1,
			column: 17,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/252
			description: `a call whose name is written outside ASCII, which the grammar spells an identifier with wherever one stands`,
			code: `a { b: 日本(1)red; }`,
			fixed: `a { b: 日本(1) red; }`,
			line: 1,
			column: 13,
			message: messages.expected,
		},
		{
			description: `a call whose name closes on a hyphen, which the grammar allows of every character but the first`,
			code: `a { b: foo-(1)red; }`,
			fixed: `a { b: foo-(1) red; }`,
			line: 1,
			column: 15,
			message: messages.expected,
		},
		{
			description: `a call whose name opens on two hyphens and a digit, the hyphens opening an identifier by themselves`,
			code: `a { b: --1(2)red; }`,
			fixed: `a { b: --1(2) red; }`,
			line: 1,
			column: 14,
			message: messages.expected,
		},
		{
			description: `a call spelling one character of its name as an escape, which the run in front of the parenthesis reads as a digit and two letters`,
			code: `a { b: fo\\6f(1)red; }`,
			fixed: `a { b: fo\\6f(1) red; }`,
			line: 1,
			column: 16,
			message: messages.expected,
		},
		{
			description: `the same call standing among the arguments of another`,
			code: `a { b: e(foo-(1)red); }`,
			fixed: `a { b: e(foo-(1) red); }`,
			line: 1,
			column: 17,
			message: messages.expected,
		},
		{
			description: `the same call standing in the parameters of an import`,
			code: `@import 日本(a)screen;`,
			fixed: `@import 日本(a) screen;`,
			line: 1,
			column: 14,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `calls spelled inside a string, whose parentheses close no call`,
			code: `a::before { content: "var(--hoot) color(blue)"; }`,
		},
		{
			description: `the same calls spelled inside a url()`,
			code: `a::before { background: url('var(--hoot) color(blue)'); }`,
		},
		{
			description: `a call closing the value, with nothing behind it to close up`,
			code: `a::before { content: attr(data-foo); }`,
		},
		{
			description: `the same call in a declaration a semicolon closes, which is none of the value`,
			code: `a { transform: translate(1, 1); }`,
		},
		{
			description: `the same call in a declaration with no semicolon, the block closing a space behind it`,
			code: `a { transform: translate(1, 1) }`,
		},
		{
			description: `the same declaration with the block closing straight behind the call`,
			code: `a { transform: translate(1, 1)}`,
		},
		{
			description: `two calls abutting one another`,
			code: `a { transform: translate(1, 1)scale(3); }`,
		},
		{
			description: `a call nested inside another, abutting what follows it inside the outer one`,
			code: `a { color: color(rgb(0,0,0)lightness(50%)) };`,
		},
		{
			description: `a call closing in front of a slash, which is the shorthand's separator`,
			code: `.foo { font: calc(16px + .2vw)/1 }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/257
			description: `a sign opening a number rather than a sum, with nothing between it and the call`,
			code: `a { b: url(x)-1px; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230
			description: `a group inside a calculation, whose closing parenthesis the operator behind it must be spaced from however this option reads the whitespace of a call`,
			code: `a { width: calc((100% - 20px) - 1rem); }`,
		},
		{
			description: `the same group standing among the arguments of a clamp`,
			code: `a { b: clamp(1px, (2px + 3px) - 1px, 4px); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/257
			description: `a call standing in front of the operator of a sum, whose whitespace belongs to the calculation rather than to the call`,
			code: `a { b: calc(var(--x) + 1px); }`,
		},
		{
			description: `the same sum written with a minus`,
			code: `a { b: calc(var(--x) - 1px); }`,
		},
		{
			description: `the same sum standing among the arguments of a clamp, with a call in front of the operator`,
			code: `a { b: clamp(1px, attr(data-x) + 2px, 3px); }`,
		},
		{
			description: `the same sum with a break in place of the space in front of the operator`,
			code: `a { b: calc(var(--x)\n+ 1px); }`,
		},
		{
			description: `the same sum with a form feed in place of that space`,
			code: `a { b: calc(var(--x)\f+ 1px); }`,
		},
		{
			description: `the same sum with a comment standing between the space and the operator, the space being all that makes the operator one`,
			code: `a { b: calc(min(1px, 2px) /**/+ 1px); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/257
			description: `a sum whose operator opens a group rather than a number, which the grammar asks a space behind and several browsers do not`,
			code: `a { b: calc(min(1px, 2px) +(3px)); }`,
		},
		{
			description: `the same sum whose operator opens a call`,
			code: `a { b: calc(min(1px, 2px) +min(3px, 4px)); }`,
		},
		{
			description: `the same sum with the comment standing between the operator and the space behind it`,
			code: `a { b: calc(min(1px, 2px) -/**/ 1px); }`,
		},
		{
			description: `a sum of an environment value, whose fallback holds a call of its own`,
			code: `a { b: calc(env(safe-area-inset-top, max(1px, 2px)) + 3px); }`,
		},
		{
			description: `the arithmetic of a preprocessor, which spells a sum the same way`,
			code: `a { b: translate(1px) + 2px; }`,
		},
	],

	reject: [
		{
			description: `a single space between two calls`,
			code: `a { transform: translate(1, 1) scale(3); }`,
			fixed: `a { transform: translate(1, 1)scale(3); }`,
			line: 1,
			column: 31,
			message: messages.rejected,
		},
		{
			description: `two spaces between two calls`,
			code: `a { transform: translate(1, 1)  scale(3); }`,
			fixed: `a { transform: translate(1, 1)scale(3); }`,
			line: 1,
			column: 31,
			message: messages.rejected,
		},
		{
			description: `a break between two calls`,
			code: `a { transform: translate(1, 1)\nscale(3); }`,
			fixed: `a { transform: translate(1, 1)scale(3); }`,
			line: 1,
			column: 31,
			message: messages.rejected,
		},
		{
			description: `the same break spelled with a carriage return and a line feed`,
			code: `a { transform: translate(1, 1)\r\nscale(3); }`,
			fixed: `a { transform: translate(1, 1)scale(3); }`,
			line: 1,
			column: 31,
			message: messages.rejected,
		},
		{
			description: `a space behind a call nested inside another`,
			code: `a { color: color(rgb(0,0,0) lightness(50%)) };`,
			fixed: `a { color: color(rgb(0,0,0)lightness(50%)) };`,
			line: 1,
			column: 28,
			message: messages.rejected,
		},
		{
			description: `two spaces behind that nested call`,
			code: `a { color: color(rgb(0,0,0)  lightness(50%)) };`,
			fixed: `a { color: color(rgb(0,0,0)lightness(50%)) };`,
			line: 1,
			column: 28,
			message: messages.rejected,
		},
		{
			description: `a break behind that nested call`,
			code: `a { color: color(rgb(0,0,0)\nlightness(50%)) };`,
			fixed: `a { color: color(rgb(0,0,0)lightness(50%)) };`,
			line: 1,
			column: 28,
			message: messages.rejected,
		},
		{
			description: `three calls, each spaced from the next`,
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
			description: `comments and spaces standing between three calls`,
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
			description: `a call in the parameters of an at-rule with a space behind it`,
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230
			description: `an address holding an escaped parenthesis, which closes the call no more than a parenthesis inside a string does`,
			code: `a { b: url(a\\)b) red; }`,
			fixed: `a { b: url(a\\)b)red; }`,
			line: 1,
			column: 17,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/252
			description: `a call whose name closes on a hyphen, which the grammar allows of every character but the first`,
			code: `a { b: foo-(1) red; }`,
			fixed: `a { b: foo-(1)red; }`,
			line: 1,
			column: 15,
			message: messages.rejected,
		},
		{
			description: `the same call named outside ASCII`,
			code: `a { b: 日本(1) red; }`,
			fixed: `a { b: 日本(1)red; }`,
			line: 1,
			column: 13,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/257
			description: `a call standing in front of the operator of a product, which CSS reads whether whitespace stands beside it or not`,
			code: `a { b: calc(var(--x) * 2); }`,
			fixed: `a { b: calc(var(--x)* 2); }`,
			line: 1,
			column: 21,
			message: messages.rejected,
		},
		{
			description: `the same call in front of a sign that opens a number, which the whitespace makes no operator of`,
			code: `a { b: url(x) -1px; }`,
			fixed: `a { b: url(x)-1px; }`,
			line: 1,
			column: 14,
			message: messages.rejected,
		},
		{
			description: `the same sign with a decimal point behind it`,
			code: `a { b: url(x) -.5px; }`,
			fixed: `a { b: url(x)-.5px; }`,
			line: 1,
			column: 14,
			message: messages.rejected,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-html`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/264
			description: `a page holding a block of each syntax, each of which carries its own reading of the sign behind the call: the plain one closes up and the Sass one is left as it is written`,
			code: `
				<style>a { b: url(x) -1px; }</style>
				<style lang="scss">a { b: foo($a) -2px; }</style>
			`,
			fixed: `
				<style>a { b: url(x)-1px; }</style>
				<style lang="scss">a { b: foo($a) -2px; }</style>
			`,
			line: 1,
			column: 21,
			message: messages.rejected,
		},
	],
})
