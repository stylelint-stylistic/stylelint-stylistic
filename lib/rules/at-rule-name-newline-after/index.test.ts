import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a line feed behind the name`,
			code: `@charset\n"UTF-8";`,
		},
		{
			description: `a carriage return and a line feed behind the name`,
			code: `@charset\r\n"UTF-8";`,
		},
		{
			description: `a quoted URL on the line behind the name`,
			code: `@import\n"x.css";`,
		},
		{
			description: `a quoted URL with a media query behind it`,
			code: `@import\n"x.css" screen and (orientation:landscape);`,
		},
		{
			description: `a url() on the line behind the name`,
			code: `@import\nurl("x.css");`,
		},
		{
			description: `a url() with a media query behind it`,
			code: `@import\nurl("x.css") screen and (orientation:landscape);`,
		},
		{
			description: `a bare URL on the line behind the name`,
			code: `@namespace\nurl(XML-namespace-URL);`,
		},
		{
			description: `a media query list on the line behind the name`,
			code: `@media\n(min-width: 700px) and (orientation: landscape) { }`,
		},
		{
			description: `a break inside the query as well as behind the name`,
			code: `@media\n(min-width: 700px)\nand (orientation: landscape) { }`,
		},
		{
			description: `both breaks spelled with carriage returns`,
			code: `@media\r\n(min-width: 700px)\r\nand (orientation: landscape) { }`,
		},
		{
			description: `a break in front of the second feature of the query`,
			code: `@media\n(min-width: 700px) and\n(orientation: landscape) { }`,
		},
		{
			description: `two spaces in front of the block, which are none of this rule's business`,
			code: `@media\n(min-width: 700px) and (orientation: landscape)  { }`,
		},
		{
			description: `a break in front of the block`,
			code: `@media\n(min-width: 700px) and (orientation: landscape)\n{ }`,
		},
		{
			description: `a carriage return in front of the block`,
			code: `@media\n(min-width: 700px) and (orientation: landscape)\r\n{ }`,
		},
		{
			description: `two spaces inside the query`,
			code: `@media\n(min-width: 700px)  and (orientation: landscape) { }`,
		},
		{
			description: `a line feed behind the name and a carriage return inside the query`,
			code: `@media\n(min-width: 700px)\r\nand (orientation: landscape) { }`,
		},
		{
			description: `a supports condition on the line behind the name`,
			code: `@supports\n(animation-name: test) { }`,
		},
		{
			description: `an identifier on the line behind the name`,
			code: `@keyframes\nidentifier { }`,
		},
		{
			description: `a vendor-prefixed name with its identifier on the next line`,
			code: `@-webkit-keyframes\nidentifier { }`,
		},
		{
			description: `an at-rule whose name is followed by nothing but its block`,
			code: `@viewport { }`,
		},
		{
			description: `a block abutting the name, with no whitespace to break`,
			code: `@viewport{ }`,
		},
		{
			description: `a break between the name and the block, with no params in between`,
			code: `@viewport\n{ }`,
		},
		{
			description: `two carriage returns between the name and the block`,
			code: `@viewport\r\n\r\n{ }`,
		},
		{
			description: `an identifier on the line behind a hyphenated name`,
			code: `@counter-style\nwinners-list { }`,
		},
		{
			description: `an at-rule carrying a block and a stray semicolon behind it`,
			code: `@font-face { };`,
		},
		{
			description: `an unknown at-rule with a string on the next line`,
			code: `@unknown\n"ident";`,
		},
		{
			description: `an unknown at-rule with an identifier on the next line and a block behind it`,
			code: `@unknown\nident { };`,
		},
		{
			description: `a custom at-rule nested in a rule, with nothing behind its name`,
			code: `a { color: pink; @crazy-custom-at-rule; }`,
		},
		{
			description: `an empty line behind the name, which is a break all the same`,
			code: `@charset\n\n"UTF-8";`,
		},
		{
			description: `an empty line spelled with carriage returns`,
			code: `@charset\r\n\r\n"UTF-8";`,
		},
		{
			description: `an empty line behind the name of a range-syntax query`,
			code: `@media\n\n(width <= 100px) { }`,
		},
	],

	reject: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/357
		{
			description: `an at-rule spelled without a space in front of its options, which the parser gives the shape of a call to a Less detached ruleset`,
			code: `@layer(l);`,
			line: 1,
			column: 6,
			message: messages.expectedAfter(`@layer`),
		},
		{
			description: `a space where the break belongs`,
			code: `@charset "UTF-8";`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@charset`),
		},
		{
			description: `nothing at all where the break belongs`,
			code: `@charset"UTF-8";`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@charset`),
		},
		{
			description: `two spaces where the break belongs`,
			code: `@charset  "UTF-8";`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@charset`),
		},
		{
			description: `a space in front of a range-syntax query`,
			code: `@media (width <= 100px) { }`,
			line: 1,
			column: 6,
			message: messages.expectedAfter(`@media`),
		},
		{
			description: `a range-syntax query abutting the name`,
			code: `@media(width <= 100px) { }`,
			line: 1,
			column: 6,
			message: messages.expectedAfter(`@media`),
		},
		{
			description: `two spaces in front of a range-syntax query`,
			code: `@media  (width <= 100px) { }`,
			line: 1,
			column: 6,
			message: messages.expectedAfter(`@media`),
		},
		{
			description: `a space in front of the string of an unknown at-rule`,
			code: `@unknown "ident";`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@unknown`),
		},
		{
			description: `a string abutting the name of an unknown at-rule`,
			code: `@unknown"ident";`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@unknown`),
		},
		{
			description: `a string abutting that name, with a block behind it`,
			code: `@unknown"ident" { };`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@unknown`),
		},
		{
			description: `a space in front of the identifier of an unknown at-rule`,
			code: `@unknown ident { };`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@unknown`),
		},
		{
			description: `two spaces in front of that identifier`,
			code: `@unknown  ident { };`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@unknown`),
		},
		{
			description: `a space behind a vendor-prefixed name`,
			code: `@-webkit-keyframes identifier { }`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(`@-webkit-keyframes`),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a single-line at-rule, whose params this option passes over`,
			code: `@charset "UTF-8";`,
		},
		{
			description: `a break in front of the semicolon, which stands outside the params`,
			code: `@charset "UTF-8"\n;`,
		},
		{
			description: `two spaces where the break would go, on params of a single line`,
			code: `@charset  "UTF-8";`,
		},
		{
			description: `params abutting the name, on a single line`,
			code: `@charset"UTF-8";`,
		},
		{
			description: `a break behind the name, which this option asks for only of multi-line params`,
			code: `@charset\n"UTF-8";`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `@charset\r\n"UTF-8";`,
		},
		{
			description: `a quoted URL abutting the name`,
			code: `@import"x.css";`,
		},
		{
			description: `a quoted URL behind a space`,
			code: `@import "x.css";`,
		},
		{
			description: `a quoted URL with a media query behind it, all on one line`,
			code: `@import "x.css" screen and (orientation:landscape);`,
		},
		{
			description: `a url() behind a space`,
			code: `@import url("x.css");`,
		},
		{
			description: `a url() on the line behind the name, which this option does not ask for`,
			code: `@import\nurl("x.css");`,
		},
		{
			description: `a url() with a media query behind it, all on one line`,
			code: `@import url("x.css") screen and (orientation:landscape);`,
		},
		{
			description: `a bare URL behind a space`,
			code: `@namespace url(XML-namespace-URL);`,
		},
		{
			description: `a media query abutting the name`,
			code: `@media(min-width: 700px) and (orientation: landscape) { }`,
		},
		{
			description: `a media query behind a space`,
			code: `@media (min-width: 700px) and (orientation: landscape) { }`,
		},
		{
			description: `two spaces in front of the block`,
			code: `@media (min-width: 700px) and (orientation: landscape)  { }`,
		},
		{
			description: `a break in front of the block, which is none of the params`,
			code: `@media (min-width: 700px) and (orientation: landscape)\n{ }`,
		},
		{
			description: `a break behind the name of a single-line query`,
			code: `@media\n(min-width: 700px) and (orientation: landscape) { }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `@media\r\n(min-width: 700px) and (orientation: landscape) { }`,
		},
		{
			description: `a supports condition behind a space`,
			code: `@supports (animation-name: test) { }`,
		},
		{
			description: `a supports condition abutting the name`,
			code: `@supports(animation-name: test) { }`,
		},
		{
			description: `an identifier behind a space`,
			code: `@keyframes identifier { }`,
		},
		{
			description: `a vendor-prefixed name with an identifier behind it`,
			code: `@-webkit-keyframes identifier { }`,
		},
		{
			description: `an at-rule whose params are empty`,
			code: `@viewport { }`,
		},
		{
			description: `empty params with the block abutting the name`,
			code: `@viewport{ }`,
		},
		{
			description: `a break between the name and the block, with no params to be multi-line`,
			code: `@viewport\n{ }`,
		},
		{
			description: `an empty line between the name and the block`,
			code: `
				@viewport

				{ }
			`,
		},
		{
			description: `an identifier behind a hyphenated name`,
			code: `@counter-style winners-list { }`,
		},
		{
			description: `an at-rule carrying a block and a stray semicolon`,
			code: `@font-face { };`,
		},
		{
			description: `a string behind the name of an unknown at-rule`,
			code: `@unknown "ident";`,
		},
		{
			description: `a string abutting that name`,
			code: `@unknown"ident";`,
		},
		{
			description: `an identifier and a block behind an unknown name`,
			code: `@unknown ident { };`,
		},
		{
			description: `an empty line behind the name`,
			code: `@charset\n\n"UTF-8";`,
		},
		{
			description: `an empty line spelled with carriage returns`,
			code: `@charset\r\n\r\n"UTF-8";`,
		},
		{
			description: `an empty line behind the name of a single-line query`,
			code: `@media\n\n(min-width: 700px) and (orientation: landscape) { }`,
		},
	],

	reject: [
		{
			description: `params running over two lines with a space where the break belongs`,
			code: `@import url("x.css")\nscreen and (orientation:landscape);`,
			line: 1,
			column: 7,
			message: messages.expectedAfter(`@import`),
		},
		{
			description: `the same params broken with a carriage return`,
			code: `@import url("x.css")\r\nscreen and (orientation:landscape);`,
			line: 1,
			column: 7,
			message: messages.expectedAfter(`@import`),
		},
		{
			description: `a break opening the first feature, which makes the params multi-line`,
			code: `@media (\nmin-width: 700px) and (orientation: landscape) { }`,
			line: 1,
			column: 6,
			message: messages.expectedAfter(`@media`),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `@media (\r\nmin-width: 700px) and (orientation: landscape) { }`,
			line: 1,
			column: 6,
			message: messages.expectedAfter(`@media`),
		},
		{
			description: `a break in front of the closing parenthesis of the first feature`,
			code: `@media (min-width: 700px\n) and (orientation: landscape) { }`,
			line: 1,
			column: 6,
			message: messages.expectedAfter(`@media`),
		},
		{
			description: `a break in front of the colon of the first feature`,
			code: `@media (min-width\n: 700px) and (orientation: landscape) { }`,
			line: 1,
			column: 6,
			message: messages.expectedAfter(`@media`),
		},
		{
			description: `a break behind that colon`,
			code: `@media (min-width:\n700px) and (orientation: landscape) { }`,
			line: 1,
			column: 6,
			message: messages.expectedAfter(`@media`),
		},
	],
})
