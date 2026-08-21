import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `@charset\n"UTF-8";`,
			description: `a line feed behind the name`,
		},
		{
			code: `@charset\r\n"UTF-8";`,
			description: `a carriage return and a line feed behind the name`,
		},
		{
			code: `@import\n"x.css";`,
			description: `a quoted URL on the line behind the name`,
		},
		{
			code: `@import\n"x.css" screen and (orientation:landscape);`,
			description: `a quoted URL with a media query behind it`,
		},
		{
			code: `@import\nurl("x.css");`,
			description: `a url() on the line behind the name`,
		},
		{
			code: `@import\nurl("x.css") screen and (orientation:landscape);`,
			description: `a url() with a media query behind it`,
		},
		{
			code: `@namespace\nurl(XML-namespace-URL);`,
			description: `a bare URL on the line behind the name`,
		},
		{
			code: `@media\n(min-width: 700px) and (orientation: landscape) { }`,
			description: `a media query list on the line behind the name`,
		},
		{
			code: `@media\n(min-width: 700px)\nand (orientation: landscape) { }`,
			description: `a break inside the query as well as behind the name`,
		},
		{
			code: `@media\r\n(min-width: 700px)\r\nand (orientation: landscape) { }`,
			description: `both breaks spelled with carriage returns`,
		},
		{
			code: `@media\n(min-width: 700px) and\n(orientation: landscape) { }`,
			description: `a break in front of the second feature of the query`,
		},
		{
			code: `@media\n(min-width: 700px) and (orientation: landscape)  { }`,
			description: `two spaces in front of the block, which are none of this rule's business`,
		},
		{
			code: `@media\n(min-width: 700px) and (orientation: landscape)\n{ }`,
			description: `a break in front of the block`,
		},
		{
			code: `@media\n(min-width: 700px) and (orientation: landscape)\r\n{ }`,
			description: `a carriage return in front of the block`,
		},
		{
			code: `@media\n(min-width: 700px)  and (orientation: landscape) { }`,
			description: `two spaces inside the query`,
		},
		{
			code: `@media\n(min-width: 700px)\r\nand (orientation: landscape) { }`,
			description: `a line feed behind the name and a carriage return inside the query`,
		},
		{
			code: `@supports\n(animation-name: test) { }`,
			description: `a supports condition on the line behind the name`,
		},
		{
			code: `@keyframes\nidentifier { }`,
			description: `an identifier on the line behind the name`,
		},
		{
			code: `@-webkit-keyframes\nidentifier { }`,
			description: `a vendor-prefixed name with its identifier on the next line`,
		},
		{
			code: `@viewport { }`,
			description: `an at-rule whose name is followed by nothing but its block`,
		},
		{
			code: `@viewport{ }`,
			description: `a block abutting the name, with no whitespace to break`,
		},
		{
			code: `@viewport\n{ }`,
			description: `a break between the name and the block, with no params in between`,
		},
		{
			code: `@viewport\r\n\r\n{ }`,
			description: `two carriage returns between the name and the block`,
		},
		{
			code: `@counter-style\nwinners-list { }`,
			description: `an identifier on the line behind a hyphenated name`,
		},
		{
			code: `@font-face { };`,
			description: `an at-rule carrying a block and a stray semicolon behind it`,
		},
		{
			code: `@unknown\n"ident";`,
			description: `an unknown at-rule with a string on the next line`,
		},
		{
			code: `@unknown\nident { };`,
			description: `an unknown at-rule with an identifier on the next line and a block behind it`,
		},
		{
			code: `a { color: pink; @crazy-custom-at-rule; }`,
			description: `a custom at-rule nested in a rule, with nothing behind its name`,
		},
		{
			code: `@charset\n\n"UTF-8";`,
			description: `an empty line behind the name, which is a break all the same`,
		},
		{
			code: `@charset\r\n\r\n"UTF-8";`,
			description: `an empty line spelled with carriage returns`,
		},
		{
			code: `@media\n\n(width <= 100px) { }`,
			description: `an empty line behind the name of a range-syntax query`,
		},
	],

	reject: [
		{
			code: `@charset "UTF-8";`,
			description: `a space where the break belongs`,
			message: messages.expectedAfter(`@charset`),
			line: 1,
			column: 8,
		},
		{
			code: `@charset"UTF-8";`,
			description: `nothing at all where the break belongs`,
			message: messages.expectedAfter(`@charset`),
			line: 1,
			column: 8,
		},
		{
			code: `@charset  "UTF-8";`,
			description: `two spaces where the break belongs`,
			message: messages.expectedAfter(`@charset`),
			line: 1,
			column: 8,
		},
		{
			code: `@media (width <= 100px) { }`,
			description: `a space in front of a range-syntax query`,
			message: messages.expectedAfter(`@media`),
			line: 1,
			column: 6,
		},
		{
			code: `@media(width <= 100px) { }`,
			description: `a range-syntax query abutting the name`,
			message: messages.expectedAfter(`@media`),
			line: 1,
			column: 6,
		},
		{
			code: `@media  (width <= 100px) { }`,
			description: `two spaces in front of a range-syntax query`,
			message: messages.expectedAfter(`@media`),
			line: 1,
			column: 6,
		},
		{
			code: `@unknown "ident";`,
			description: `a space in front of the string of an unknown at-rule`,
			message: messages.expectedAfter(`@unknown`),
			line: 1,
			column: 8,
		},
		{
			code: `@unknown"ident";`,
			description: `a string abutting the name of an unknown at-rule`,
			message: messages.expectedAfter(`@unknown`),
			line: 1,
			column: 8,
		},
		{
			code: `@unknown"ident" { };`,
			description: `a string abutting that name, with a block behind it`,
			message: messages.expectedAfter(`@unknown`),
			line: 1,
			column: 8,
		},
		{
			code: `@unknown ident { };`,
			description: `a space in front of the identifier of an unknown at-rule`,
			message: messages.expectedAfter(`@unknown`),
			line: 1,
			column: 8,
		},
		{
			code: `@unknown  ident { };`,
			description: `two spaces in front of that identifier`,
			message: messages.expectedAfter(`@unknown`),
			line: 1,
			column: 8,
		},
		{
			code: `@-webkit-keyframes identifier { }`,
			description: `a space behind a vendor-prefixed name`,
			message: messages.expectedAfter(`@-webkit-keyframes`),
			line: 1,
			column: 18,
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`always`],

	accept: [
		{
			code: `@nice-blue:#5B83AD;`,
			description: `a Less variable, which the parser gives the shape of an at-rule`,
		},
		{
			code: `@nice-blue: #5B83AD;`,
			description: `a Less variable with a space behind its colon`,
		},
		{
			code: `@nice-blue:\n#5B83AD;`,
			description: `a Less variable whose value stands on the next line`,
		},
		{
			code: `@variable: .bucket; .@{variable} { }`,
			description: `an interpolated selector, whose at-sign opens no at-rule`,
		},
		{
			code: `@detached-ruleset: { background: red; }; .top { @detached-ruleset(); }`,
			description: `a detached ruleset passed to a mixin`,
		},
		{
			code: `@my-ruleset: { .my-selector { background-color: black; } };`,
			description: `a detached ruleset holding a rule of its own`,
		},
		{
			code: `.class1 { .mixin(#ddd) }`,
			description: `a mixin call, which is no at-rule`,
		},
		{
			code: `.button { &-ok {} }`,
			description: `a parent selector, which is no at-rule either`,
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`always`],

	accept: [
		{
			code: `@mixin\nmixin() { @content; }; .colors { @include\nmixin { color: $color; }}`,
			description: `a mixin and an include, each with the break behind its name`,
		},
		{
			code: `@mixin\r\nmixin() { @content; }; .colors { @include\r\nmixin { color: $color; }}`,
			description: `the same pair spelled with carriage returns`,
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			code: `@charset "UTF-8";`,
			description: `a single-line at-rule, whose params this option passes over`,
		},
		{
			code: `@charset "UTF-8"\n;`,
			description: `a break in front of the semicolon, which stands outside the params`,
		},
		{
			code: `@charset  "UTF-8";`,
			description: `two spaces where the break would go, on params of a single line`,
		},
		{
			code: `@charset"UTF-8";`,
			description: `params abutting the name, on a single line`,
		},
		{
			code: `@charset\n"UTF-8";`,
			description: `a break behind the name, which this option asks for only of multi-line params`,
		},
		{
			code: `@charset\r\n"UTF-8";`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `@import"x.css";`,
			description: `a quoted URL abutting the name`,
		},
		{
			code: `@import "x.css";`,
			description: `a quoted URL behind a space`,
		},
		{
			code: `@import "x.css" screen and (orientation:landscape);`,
			description: `a quoted URL with a media query behind it, all on one line`,
		},
		{
			code: `@import url("x.css");`,
			description: `a url() behind a space`,
		},
		{
			code: `@import\nurl("x.css");`,
			description: `a url() on the line behind the name, which this option does not ask for`,
		},
		{
			code: `@import url("x.css") screen and (orientation:landscape);`,
			description: `a url() with a media query behind it, all on one line`,
		},
		{
			code: `@namespace url(XML-namespace-URL);`,
			description: `a bare URL behind a space`,
		},
		{
			code: `@media(min-width: 700px) and (orientation: landscape) { }`,
			description: `a media query abutting the name`,
		},
		{
			code: `@media (min-width: 700px) and (orientation: landscape) { }`,
			description: `a media query behind a space`,
		},
		{
			code: `@media (min-width: 700px) and (orientation: landscape)  { }`,
			description: `two spaces in front of the block`,
		},
		{
			code: `@media (min-width: 700px) and (orientation: landscape)\n{ }`,
			description: `a break in front of the block, which is none of the params`,
		},
		{
			code: `@media\n(min-width: 700px) and (orientation: landscape) { }`,
			description: `a break behind the name of a single-line query`,
		},
		{
			code: `@media\r\n(min-width: 700px) and (orientation: landscape) { }`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `@supports (animation-name: test) { }`,
			description: `a supports condition behind a space`,
		},
		{
			code: `@supports(animation-name: test) { }`,
			description: `a supports condition abutting the name`,
		},
		{
			code: `@keyframes identifier { }`,
			description: `an identifier behind a space`,
		},
		{
			code: `@-webkit-keyframes identifier { }`,
			description: `a vendor-prefixed name with an identifier behind it`,
		},
		{
			code: `@viewport { }`,
			description: `an at-rule whose params are empty`,
		},
		{
			code: `@viewport{ }`,
			description: `empty params with the block abutting the name`,
		},
		{
			code: `@viewport\n{ }`,
			description: `a break between the name and the block, with no params to be multi-line`,
		},
		{
			code: `@viewport\n\n{ }`,
			description: `an empty line between the name and the block`,
		},
		{
			code: `@counter-style winners-list { }`,
			description: `an identifier behind a hyphenated name`,
		},
		{
			code: `@font-face { };`,
			description: `an at-rule carrying a block and a stray semicolon`,
		},
		{
			code: `@unknown "ident";`,
			description: `a string behind the name of an unknown at-rule`,
		},
		{
			code: `@unknown"ident";`,
			description: `a string abutting that name`,
		},
		{
			code: `@unknown ident { };`,
			description: `an identifier and a block behind an unknown name`,
		},
		{
			code: `@charset\n\n"UTF-8";`,
			description: `an empty line behind the name`,
		},
		{
			code: `@charset\r\n\r\n"UTF-8";`,
			description: `an empty line spelled with carriage returns`,
		},
		{
			code: `@media\n\n(min-width: 700px) and (orientation: landscape) { }`,
			description: `an empty line behind the name of a single-line query`,
		},
	],

	reject: [
		{
			code: `@import url("x.css")\nscreen and (orientation:landscape);`,
			description: `params running over two lines with a space where the break belongs`,
			message: messages.expectedAfter(`@import`),
			line: 1,
			column: 7,
		},
		{
			code: `@import url("x.css")\r\nscreen and (orientation:landscape);`,
			description: `the same params broken with a carriage return`,
			message: messages.expectedAfter(`@import`),
			line: 1,
			column: 7,
		},
		{
			code: `@media (\nmin-width: 700px) and (orientation: landscape) { }`,
			description: `a break opening the first feature, which makes the params multi-line`,
			message: messages.expectedAfter(`@media`),
			line: 1,
			column: 6,
		},
		{
			code: `@media (\r\nmin-width: 700px) and (orientation: landscape) { }`,
			description: `the same break spelled with a carriage return`,
			message: messages.expectedAfter(`@media`),
			line: 1,
			column: 6,
		},
		{
			code: `@media (min-width: 700px\n) and (orientation: landscape) { }`,
			description: `a break in front of the closing parenthesis of the first feature`,
			message: messages.expectedAfter(`@media`),
			line: 1,
			column: 6,
		},
		{
			code: `@media (min-width\n: 700px) and (orientation: landscape) { }`,
			description: `a break in front of the colon of the first feature`,
			message: messages.expectedAfter(`@media`),
			line: 1,
			column: 6,
		},
		{
			code: `@media (min-width:\n700px) and (orientation: landscape) { }`,
			description: `a break behind that colon`,
			message: messages.expectedAfter(`@media`),
			line: 1,
			column: 6,
		},
	],
})
