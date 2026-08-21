import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `@charset "UTF-8";`,
			description: `a space behind the name`,
		},
		{
			code: `@import "x.css";`,
			description: `a quoted URL behind the space`,
		},
		{
			code: `@import "x.css" screen and (orientation:landscape);`,
			description: `a quoted URL with a media query behind it`,
		},
		{
			code: `@import url("x.css");`,
			description: `a url() behind the space`,
		},
		{
			code: `@import url("x.css") screen and (orientation:landscape);`,
			description: `a url() with a media query behind it`,
		},
		{
			code: `@namespace url(XML-namespace-URL);`,
			description: `a bare URL behind the space`,
		},
		{
			code: `@media (min-width: 700px) and (orientation: landscape) { }`,
			description: `a media query list behind the space`,
		},
		{
			code: `@media (min-width: 700px) and (orientation: landscape)  { }`,
			description: `two spaces in front of the block, which are none of this rule's business`,
		},
		{
			code: `@media (min-width: 700px) and (orientation: landscape)\n{ }`,
			description: `a break in front of the block`,
		},
		{
			code: `@media (min-width: 700px) and (orientation: landscape)\r\n{ }`,
			description: `a carriage return in front of the block`,
		},
		{
			code: `@media (min-width: 700px)  and (orientation: landscape) { }`,
			description: `two spaces inside the query`,
		},
		{
			code: `@media (min-width: 700px)\nand (orientation: landscape) { }`,
			description: `a break inside the query`,
		},
		{
			code: `@media (min-width: 700px)\r\nand (orientation: landscape) { }`,
			description: `a carriage return inside the query`,
		},
		{
			code: `@supports (animation-name: test) { }`,
			description: `a supports condition behind the space`,
		},
		{
			code: `@keyframes identifier { }`,
			description: `an identifier behind the space`,
		},
		{
			code: `@-webkit-keyframes identifier { }`,
			description: `an identifier behind a vendor-prefixed name`,
		},
		{
			code: `@viewport { }`,
			description: `an at-rule whose name is followed by nothing but its block`,
		},
		{
			code: `@viewport{ }`,
			description: `a block abutting the name, with no params to space from it`,
		},
		{
			code: `@viewport\n{ }`,
			description: `a break between the name and the block, with no params in between`,
		},
		{
			code: `@viewport\r\n{ }`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `@viewport\n\n{ }`,
			description: `an empty line between the name and the block`,
		},
		{
			code: `@viewport\r\n\r\n{ }`,
			description: `the same empty line spelled with carriage returns`,
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
			code: `@unknown ident { };`,
			description: `an identifier and a block behind an unknown name`,
		},
		{
			code: `a { color: pink; @crazy-custom-at-rule; }`,
			description: `a custom at-rule nested in a rule, with nothing behind its name`,
		},
	],

	reject: [
		{
			code: `@charset"UTF-8";`,
			fixed: `@charset "UTF-8";`,
			description: `params abutting the name`,
			message: messages.expectedAfter(`@charset`),
			line: 1,
			column: 8,
		},
		{
			code: `@charset  "UTF-8";`,
			fixed: `@charset "UTF-8";`,
			description: `two spaces where one belongs`,
			message: messages.expectedAfter(`@charset`),
			line: 1,
			column: 8,
		},
		{
			code: `@charset\n"UTF-8";`,
			fixed: `@charset "UTF-8";`,
			description: `a break where the space belongs`,
			message: messages.expectedAfter(`@charset`),
			line: 1,
			column: 8,
		},
		{
			code: `@charset\r\n"UTF-8";`,
			fixed: `@charset "UTF-8";`,
			description: `a carriage return where the space belongs`,
			message: messages.expectedAfter(`@charset`),
			line: 1,
			column: 8,
		},
		{
			code: `@charset\n\n"UTF-8";`,
			fixed: `@charset "UTF-8";`,
			description: `an empty line where the space belongs`,
			message: messages.expectedAfter(`@charset`),
			line: 1,
			column: 8,
		},
		{
			code: `@charset\r\n\r\n"UTF-8";`,
			fixed: `@charset "UTF-8";`,
			description: `the same empty line spelled with carriage returns`,
			message: messages.expectedAfter(`@charset`),
			line: 1,
			column: 8,
		},
		{
			code: `@media(width <= 100px) { }`,
			fixed: `@media (width <= 100px) { }`,
			description: `a range-syntax query abutting the name`,
			message: messages.expectedAfter(`@media`),
			line: 1,
			column: 6,
		},
		{
			code: `@media\n(width <= 100px) { }`,
			fixed: `@media (width <= 100px) { }`,
			description: `a break in front of a range-syntax query`,
			message: messages.expectedAfter(`@media`),
			line: 1,
			column: 6,
		},
		{
			code: `@media\r\n(width <= 100px) { }`,
			fixed: `@media (width <= 100px) { }`,
			description: `a carriage return in front of a range-syntax query`,
			message: messages.expectedAfter(`@media`),
			line: 1,
			column: 6,
		},
		{
			code: `@media  (width <= 100px) { }`,
			fixed: `@media (width <= 100px) { }`,
			description: `two spaces in front of a range-syntax query`,
			message: messages.expectedAfter(`@media`),
			line: 1,
			column: 6,
		},
		{
			code: `@unknown"ident";`,
			fixed: `@unknown "ident";`,
			description: `a string abutting the name of an unknown at-rule`,
			message: messages.expectedAfter(`@unknown`),
			line: 1,
			column: 8,
		},
		{
			code: `@unknown"ident" { };`,
			fixed: `@unknown "ident" { };`,
			description: `a string abutting that name, with a block behind it`,
			message: messages.expectedAfter(`@unknown`),
			line: 1,
			column: 8,
		},
		{
			code: `@unknown  ident { };`,
			fixed: `@unknown ident { };`,
			description: `two spaces in front of the identifier of an unknown at-rule`,
			message: messages.expectedAfter(`@unknown`),
			line: 1,
			column: 8,
		},
		{
			code: `@-webkit-keyframes  ident { };`,
			fixed: `@-webkit-keyframes ident { };`,
			description: `two spaces behind a vendor-prefixed name`,
			message: messages.expectedAfter(`@-webkit-keyframes`),
			line: 1,
			column: 18,
		},
		{
			code: `@media/*comment*/(width <= 100px) { }`,
			fixed: `@media /*comment*/(width <= 100px) { }`,
			description: `a comment standing where the space belongs`,
			message: messages.expectedAfter(`@media`),
			line: 1,
			column: 6,
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
			code: `@mixin mixin() { @content; }; .colors { @include mixin { color: $color; }}`,
			description: `a mixin and an include, each with a space behind its name`,
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			code: `@charset "UTF-8";`,
			description: `a single-line at-rule with the space behind its name`,
		},
		{
			code: `@charset\n"UTF-8";`,
			description: `a break behind the name, which makes the at-rule multi-line and puts it out of this option's reach`,
		},
		{
			code: `@charset\r\n"UTF-8";`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `@charset\n\n"UTF-8";`,
			description: `an empty line behind the name, which makes the at-rule multi-line too`,
		},
		{
			code: `@charset\r\n\r\n"UTF-8";`,
			description: `the same empty line spelled with carriage returns`,
		},
		{
			code: `@import "x.css";`,
			description: `a quoted URL behind the space`,
		},
		{
			code: `@import "x.css" screen and (orientation:landscape);`,
			description: `a quoted URL with a media query behind it`,
		},
		{
			code: `@import url("x.css");`,
			description: `a url() behind the space`,
		},
		{
			code: `@import\nurl("x.css");`,
			description: `a url() on the next line, which makes the at-rule multi-line`,
		},
		{
			code: `@import\r\nurl("x.css");`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `@import url("x.css") screen and (orientation:landscape);`,
			description: `a url() with a media query behind it`,
		},
		{
			code: `@namespace url(XML-namespace-URL);`,
			description: `a bare URL behind the space`,
		},
		{
			code: `@media (min-width: 700px) and (orientation: landscape) { }`,
			description: `a media query behind the space`,
		},
		{
			code: `@media (min-width: 700px) and (orientation: landscape)  { }`,
			description: `two spaces in front of the block`,
		},
		{
			code: `@media (min-width: 700px) and (orientation: landscape)\n{ }`,
			description: `a break in front of the block, which stands outside the text this rule reads`,
		},
		{
			code: `@media (min-width: 700px) and (orientation: landscape)\r\n{ }`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `@media (min-width: 700px)  and (orientation: landscape) { }`,
			description: `two spaces inside the query`,
		},
		{
			code: `@media (min-width: 700px)\nand (orientation: landscape) { }`,
			description: `a break inside the query, which makes the at-rule multi-line`,
		},
		{
			code: `@media (min-width: 700px)\r\nand (orientation: landscape) { }`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `@media(min-width: 700px)\nand (orientation: landscape) { }`,
			description: `a query abutting the name, but broken across lines, so the option passes it by`,
		},
		{
			code: `@media(min-width: 700px)\r\nand (orientation: landscape) { }`,
			description: `the same query broken with a carriage return`,
		},
		{
			code: `@media(min-width: 700px) and\n(orientation: landscape) { }`,
			description: `a break in front of the second feature, with the query abutting the name`,
		},
		{
			code: `@media(min-width: 700px) and\r\n(orientation: landscape) { }`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `@media\n(min-width: 700px) and (orientation: landscape) { }`,
			description: `a break where the space would go, which is itself what makes the at-rule multi-line`,
		},
		{
			code: `@media\r\n(min-width: 700px) and (orientation: landscape) { }`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `@supports (animation-name: test) { }`,
			description: `a supports condition behind the space`,
		},
		{
			code: `@keyframes identifier { }`,
			description: `an identifier behind the space`,
		},
		{
			code: `@-webkit-keyframes identifier { }`,
			description: `an identifier behind a vendor-prefixed name`,
		},
		{
			code: `@viewport { }`,
			description: `an at-rule whose name is followed by nothing but its block`,
		},
		{
			code: `@viewport{ }`,
			description: `a block abutting the name, with no params to space from it`,
		},
		{
			code: `@viewport\n{ }`,
			description: `a break between the name and the block, with no params in between`,
		},
		{
			code: `@viewport\r\n{ }`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `@viewport\n\n{ }`,
			description: `an empty line between the name and the block`,
		},
		{
			code: `@viewport\r\n\r\n{ }`,
			description: `the same empty line spelled with carriage returns`,
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
			code: `@unknown ident { };`,
			description: `an identifier and a block behind an unknown name`,
		},
	],

	reject: [
		{
			code: `@charset"UTF-8";`,
			fixed: `@charset "UTF-8";`,
			description: `params abutting the name of a single-line at-rule`,
			message: messages.expectedAfter(`@charset`),
			line: 1,
			column: 8,
		},
		{
			code: `@charset  "UTF-8";`,
			fixed: `@charset "UTF-8";`,
			description: `two spaces where one belongs`,
			message: messages.expectedAfter(`@charset`),
			line: 1,
			column: 8,
		},
		{
			code: `@media(width <= 100px) { }`,
			fixed: `@media (width <= 100px) { }`,
			description: `a range-syntax query abutting the name`,
			message: messages.expectedAfter(`@media`),
			line: 1,
			column: 6,
		},
		{
			code: `@media  (width <= 100px) { }`,
			fixed: `@media (width <= 100px) { }`,
			description: `two spaces in front of a range-syntax query`,
			message: messages.expectedAfter(`@media`),
			line: 1,
			column: 6,
		},
		{
			code: `@unknown"ident";`,
			fixed: `@unknown "ident";`,
			description: `a string abutting the name of an unknown at-rule`,
			message: messages.expectedAfter(`@unknown`),
			line: 1,
			column: 8,
		},
		{
			code: `@unknown"ident" { };`,
			fixed: `@unknown "ident" { };`,
			description: `a string abutting that name, with a block behind it`,
			message: messages.expectedAfter(`@unknown`),
			line: 1,
			column: 8,
		},
		{
			code: `@unknown  ident { };`,
			fixed: `@unknown ident { };`,
			description: `two spaces in front of the identifier of an unknown at-rule`,
			message: messages.expectedAfter(`@unknown`),
			line: 1,
			column: 8,
		},
		{
			code: `@-webkit-keyframes  ident { };`,
			fixed: `@-webkit-keyframes ident { };`,
			description: `two spaces behind a vendor-prefixed name`,
			message: messages.expectedAfter(`@-webkit-keyframes`),
			line: 1,
			column: 18,
		},
	],
})
