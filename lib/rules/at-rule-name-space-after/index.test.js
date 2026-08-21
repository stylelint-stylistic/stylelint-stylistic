import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a space behind the name`,
			code: `@charset "UTF-8";`,
		},
		{
			description: `a quoted URL behind the space`,
			code: `@import "x.css";`,
		},
		{
			description: `a quoted URL with a media query behind it`,
			code: `@import "x.css" screen and (orientation:landscape);`,
		},
		{
			description: `a url() behind the space`,
			code: `@import url("x.css");`,
		},
		{
			description: `a url() with a media query behind it`,
			code: `@import url("x.css") screen and (orientation:landscape);`,
		},
		{
			description: `a bare URL behind the space`,
			code: `@namespace url(XML-namespace-URL);`,
		},
		{
			description: `a media query list behind the space`,
			code: `@media (min-width: 700px) and (orientation: landscape) { }`,
		},
		{
			description: `two spaces in front of the block, which are none of this rule's business`,
			code: `@media (min-width: 700px) and (orientation: landscape)  { }`,
		},
		{
			description: `a break in front of the block`,
			code: `@media (min-width: 700px) and (orientation: landscape)\n{ }`,
		},
		{
			description: `a carriage return in front of the block`,
			code: `@media (min-width: 700px) and (orientation: landscape)\r\n{ }`,
		},
		{
			description: `two spaces inside the query`,
			code: `@media (min-width: 700px)  and (orientation: landscape) { }`,
		},
		{
			description: `a break inside the query`,
			code: `@media (min-width: 700px)\nand (orientation: landscape) { }`,
		},
		{
			description: `a carriage return inside the query`,
			code: `@media (min-width: 700px)\r\nand (orientation: landscape) { }`,
		},
		{
			description: `a supports condition behind the space`,
			code: `@supports (animation-name: test) { }`,
		},
		{
			description: `an identifier behind the space`,
			code: `@keyframes identifier { }`,
		},
		{
			description: `an identifier behind a vendor-prefixed name`,
			code: `@-webkit-keyframes identifier { }`,
		},
		{
			description: `an at-rule whose name is followed by nothing but its block`,
			code: `@viewport { }`,
		},
		{
			description: `a block abutting the name, with no params to space from it`,
			code: `@viewport{ }`,
		},
		{
			description: `a break between the name and the block, with no params in between`,
			code: `@viewport\n{ }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `@viewport\r\n{ }`,
		},
		{
			description: `an empty line between the name and the block`,
			code: `
				@viewport

				{ }
			`,
		},
		{
			description: `the same empty line spelled with carriage returns`,
			code: `@viewport\r\n\r\n{ }`,
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
			description: `an identifier and a block behind an unknown name`,
			code: `@unknown ident { };`,
		},
		{
			description: `a custom at-rule nested in a rule, with nothing behind its name`,
			code: `a { color: pink; @crazy-custom-at-rule; }`,
		},
	],

	reject: [
		{
			description: `params abutting the name`,
			code: `@charset"UTF-8";`,
			fixed: `@charset "UTF-8";`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@charset`),
		},
		{
			description: `two spaces where one belongs`,
			code: `@charset  "UTF-8";`,
			fixed: `@charset "UTF-8";`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@charset`),
		},
		{
			description: `a break where the space belongs`,
			code: `@charset\n"UTF-8";`,
			fixed: `@charset "UTF-8";`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@charset`),
		},
		{
			description: `a carriage return where the space belongs`,
			code: `@charset\r\n"UTF-8";`,
			fixed: `@charset "UTF-8";`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@charset`),
		},
		{
			description: `an empty line where the space belongs`,
			code: `@charset\n\n"UTF-8";`,
			fixed: `@charset "UTF-8";`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@charset`),
		},
		{
			description: `the same empty line spelled with carriage returns`,
			code: `@charset\r\n\r\n"UTF-8";`,
			fixed: `@charset "UTF-8";`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@charset`),
		},
		{
			description: `a range-syntax query abutting the name`,
			code: `@media(width <= 100px) { }`,
			fixed: `@media (width <= 100px) { }`,
			line: 1,
			column: 6,
			message: messages.expectedAfter(`@media`),
		},
		{
			description: `a break in front of a range-syntax query`,
			code: `@media\n(width <= 100px) { }`,
			fixed: `@media (width <= 100px) { }`,
			line: 1,
			column: 6,
			message: messages.expectedAfter(`@media`),
		},
		{
			description: `a carriage return in front of a range-syntax query`,
			code: `@media\r\n(width <= 100px) { }`,
			fixed: `@media (width <= 100px) { }`,
			line: 1,
			column: 6,
			message: messages.expectedAfter(`@media`),
		},
		{
			description: `two spaces in front of a range-syntax query`,
			code: `@media  (width <= 100px) { }`,
			fixed: `@media (width <= 100px) { }`,
			line: 1,
			column: 6,
			message: messages.expectedAfter(`@media`),
		},
		{
			description: `a string abutting the name of an unknown at-rule`,
			code: `@unknown"ident";`,
			fixed: `@unknown "ident";`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@unknown`),
		},
		{
			description: `a string abutting that name, with a block behind it`,
			code: `@unknown"ident" { };`,
			fixed: `@unknown "ident" { };`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@unknown`),
		},
		{
			description: `two spaces in front of the identifier of an unknown at-rule`,
			code: `@unknown  ident { };`,
			fixed: `@unknown ident { };`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@unknown`),
		},
		{
			description: `two spaces behind a vendor-prefixed name`,
			code: `@-webkit-keyframes  ident { };`,
			fixed: `@-webkit-keyframes ident { };`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(`@-webkit-keyframes`),
		},
		{
			description: `a comment standing where the space belongs`,
			code: `@media/*comment*/(width <= 100px) { }`,
			fixed: `@media /*comment*/(width <= 100px) { }`,
			line: 1,
			column: 6,
			message: messages.expectedAfter(`@media`),
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`always`],

	accept: [
		{
			description: `a Less variable, which the parser gives the shape of an at-rule`,
			code: `@nice-blue:#5B83AD;`,
		},
		{
			description: `a Less variable with a space behind its colon`,
			code: `@nice-blue: #5B83AD;`,
		},
		{
			description: `a Less variable whose value stands on the next line`,
			code: `@nice-blue:\n#5B83AD;`,
		},
		{
			description: `an interpolated selector, whose at-sign opens no at-rule`,
			code: `@variable: .bucket; .@{variable} { }`,
		},
		{
			description: `a detached ruleset passed to a mixin`,
			code: `@detached-ruleset: { background: red; }; .top { @detached-ruleset(); }`,
		},
		{
			description: `a detached ruleset holding a rule of its own`,
			code: `@my-ruleset: { .my-selector { background-color: black; } };`,
		},
		{
			description: `a mixin call, which is no at-rule`,
			code: `.class1 { .mixin(#ddd) }`,
		},
		{
			description: `a parent selector, which is no at-rule either`,
			code: `.button { &-ok {} }`,
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`always`],

	accept: [
		{
			description: `a mixin and an include, each with a space behind its name`,
			code: `@mixin mixin() { @content; }; .colors { @include mixin { color: $color; }}`,
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			description: `a single-line at-rule with the space behind its name`,
			code: `@charset "UTF-8";`,
		},
		{
			description: `a break behind the name, which makes the at-rule multi-line and puts it out of this option's reach`,
			code: `@charset\n"UTF-8";`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `@charset\r\n"UTF-8";`,
		},
		{
			description: `an empty line behind the name, which makes the at-rule multi-line too`,
			code: `@charset\n\n"UTF-8";`,
		},
		{
			description: `the same empty line spelled with carriage returns`,
			code: `@charset\r\n\r\n"UTF-8";`,
		},
		{
			description: `a quoted URL behind the space`,
			code: `@import "x.css";`,
		},
		{
			description: `a quoted URL with a media query behind it`,
			code: `@import "x.css" screen and (orientation:landscape);`,
		},
		{
			description: `a url() behind the space`,
			code: `@import url("x.css");`,
		},
		{
			description: `a url() on the next line, which makes the at-rule multi-line`,
			code: `@import\nurl("x.css");`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `@import\r\nurl("x.css");`,
		},
		{
			description: `a url() with a media query behind it`,
			code: `@import url("x.css") screen and (orientation:landscape);`,
		},
		{
			description: `a bare URL behind the space`,
			code: `@namespace url(XML-namespace-URL);`,
		},
		{
			description: `a media query behind the space`,
			code: `@media (min-width: 700px) and (orientation: landscape) { }`,
		},
		{
			description: `two spaces in front of the block`,
			code: `@media (min-width: 700px) and (orientation: landscape)  { }`,
		},
		{
			description: `a break in front of the block, which stands outside the text this rule reads`,
			code: `@media (min-width: 700px) and (orientation: landscape)\n{ }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `@media (min-width: 700px) and (orientation: landscape)\r\n{ }`,
		},
		{
			description: `two spaces inside the query`,
			code: `@media (min-width: 700px)  and (orientation: landscape) { }`,
		},
		{
			description: `a break inside the query, which makes the at-rule multi-line`,
			code: `@media (min-width: 700px)\nand (orientation: landscape) { }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `@media (min-width: 700px)\r\nand (orientation: landscape) { }`,
		},
		{
			description: `a query abutting the name, but broken across lines, so the option passes it by`,
			code: `@media(min-width: 700px)\nand (orientation: landscape) { }`,
		},
		{
			description: `the same query broken with a carriage return`,
			code: `@media(min-width: 700px)\r\nand (orientation: landscape) { }`,
		},
		{
			description: `a break in front of the second feature, with the query abutting the name`,
			code: `@media(min-width: 700px) and\n(orientation: landscape) { }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `@media(min-width: 700px) and\r\n(orientation: landscape) { }`,
		},
		{
			description: `a break where the space would go, which is itself what makes the at-rule multi-line`,
			code: `@media\n(min-width: 700px) and (orientation: landscape) { }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `@media\r\n(min-width: 700px) and (orientation: landscape) { }`,
		},
		{
			description: `a supports condition behind the space`,
			code: `@supports (animation-name: test) { }`,
		},
		{
			description: `an identifier behind the space`,
			code: `@keyframes identifier { }`,
		},
		{
			description: `an identifier behind a vendor-prefixed name`,
			code: `@-webkit-keyframes identifier { }`,
		},
		{
			description: `an at-rule whose name is followed by nothing but its block`,
			code: `@viewport { }`,
		},
		{
			description: `a block abutting the name, with no params to space from it`,
			code: `@viewport{ }`,
		},
		{
			description: `a break between the name and the block, with no params in between`,
			code: `@viewport\n{ }`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `@viewport\r\n{ }`,
		},
		{
			description: `an empty line between the name and the block`,
			code: `
				@viewport

				{ }
			`,
		},
		{
			description: `the same empty line spelled with carriage returns`,
			code: `@viewport\r\n\r\n{ }`,
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
			description: `an identifier and a block behind an unknown name`,
			code: `@unknown ident { };`,
		},
	],

	reject: [
		{
			description: `params abutting the name of a single-line at-rule`,
			code: `@charset"UTF-8";`,
			fixed: `@charset "UTF-8";`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@charset`),
		},
		{
			description: `two spaces where one belongs`,
			code: `@charset  "UTF-8";`,
			fixed: `@charset "UTF-8";`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@charset`),
		},
		{
			description: `a range-syntax query abutting the name`,
			code: `@media(width <= 100px) { }`,
			fixed: `@media (width <= 100px) { }`,
			line: 1,
			column: 6,
			message: messages.expectedAfter(`@media`),
		},
		{
			description: `two spaces in front of a range-syntax query`,
			code: `@media  (width <= 100px) { }`,
			fixed: `@media (width <= 100px) { }`,
			line: 1,
			column: 6,
			message: messages.expectedAfter(`@media`),
		},
		{
			description: `a string abutting the name of an unknown at-rule`,
			code: `@unknown"ident";`,
			fixed: `@unknown "ident";`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@unknown`),
		},
		{
			description: `a string abutting that name, with a block behind it`,
			code: `@unknown"ident" { };`,
			fixed: `@unknown "ident" { };`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@unknown`),
		},
		{
			description: `two spaces in front of the identifier of an unknown at-rule`,
			code: `@unknown  ident { };`,
			fixed: `@unknown ident { };`,
			line: 1,
			column: 8,
			message: messages.expectedAfter(`@unknown`),
		},
		{
			description: `two spaces behind a vendor-prefixed name`,
			code: `@-webkit-keyframes  ident { };`,
			fixed: `@-webkit-keyframes ident { };`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(`@-webkit-keyframes`),
		},
	],
})
