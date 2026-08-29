import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`lower`],

	accept: [
		{
			description: `a name already in lower case`,
			code: `@charset 'UTF-8';`,
		},
		{
			description: `an at-rule closing on nothing, neither a semicolon nor a block`,
			code: `@import 'test.css'`,
		},
		{
			description: `a name in front of a URL, which is left as it is spelled`,
			code: `@namespace url(XML-namespace-URL);`,
		},
		{
			description: `a name in front of a media query`,
			code: `@media screen {}`,
		},
		{
			description: `a name in front of a media feature`,
			code: `@media (min-width: 50em) {}`,
		},
		{
			description: `an at-rule nested in another, both names in lower case`,
			code: `@media only screen and (min-width: 415px) { @keyframes pace-anim { 100% { opacity: 0; } } }`,
		},
		{
			description: `a name in front of a supports condition`,
			code: `@supports (animation-name: test) {}`,
		},
		{
			description: `a name in front of a list of functions, whose own names the rule says nothing about`,
			code: `@document url(http://www.w3.org/), url-prefix(http://www.w3.org/Style/), domain(mozilla.org), regexp('https:.*')`,
		},
		{
			description: `a name followed by a pseudo-class`,
			code: `@page :first { margin: 1cm; }`,
		},
		{
			description: `a name whose block holds a percentage selector`,
			code: `@keyframes { 0% { top: 0; } }`,
		},
		{
			description: `a vendor prefix, which is part of the name and lower case with it`,
			code: `@-webkit-keyframes { 0% { top: 0; } }`,
		},
		{
			description: `a name of a single word`,
			code: `@viewport { orientation: landscape; }`,
		},
		{
			description: `a hyphenated name`,
			code: `@counter-style win-list { system: fixed; symbols: url(gold-medal.svg) url(silver-medal.svg) ; suffix: ' ';}`,
		},
		{
			description: `an at-rule nested in a block that is not a rule`,
			code: `@font-feature-values Font One { @styleset { nice-style: 12; } }`,
		},
	],

	reject: [
		{
			description: `a capital first letter`,
			code: `@Charset 'UTF-8';`,
			fixed: `@charset 'UTF-8';`,
			line: 1,
			column: 1,
			message: messages.expected(`Charset`, `charset`),
		},
		{
			description: `alternating case`,
			code: `@cHaRsEt 'UTF-8';`,
			fixed: `@charset 'UTF-8';`,
			line: 1,
			column: 1,
			message: messages.expected(`cHaRsEt`, `charset`),
		},
		{
			description: `the whole name in upper case`,
			code: `@CHARSET 'UTF-8';`,
			fixed: `@charset 'UTF-8';`,
			line: 1,
			column: 1,
			message: messages.expected(`CHARSET`, `charset`),
		},
		{
			description: `a capital first letter on an at-rule carrying a block`,
			code: `@Media screen {}`,
			fixed: `@media screen {}`,
			line: 1,
			column: 1,
			message: messages.expected(`Media`, `media`),
		},
		{
			description: `alternating case on an at-rule carrying a block`,
			code: `@mEdIa screen {}`,
			fixed: `@media screen {}`,
			line: 1,
			column: 1,
			message: messages.expected(`mEdIa`, `media`),
		},
		{
			description: `the whole name in upper case on an at-rule carrying a block`,
			code: `@MEDIA screen {}`,
			fixed: `@media screen {}`,
			line: 1,
			column: 1,
			message: messages.expected(`MEDIA`, `media`),
		},
		{
			description: `a capital first letter on the nested at-rule, reported at its own column`,
			code: `@media only screen and (min-width: 415px) { @Keyframes pace-anim { 100% { opacity: 0; } } }`,
			fixed:
				`@media only screen and (min-width: 415px) { @keyframes pace-anim { 100% { opacity: 0; } } }`,
			line: 1,
			column: 45,
			message: messages.expected(`Keyframes`, `keyframes`),
		},
		{
			description: `alternating case on the nested at-rule, reported at its own column`,
			code: `@media only screen and (min-width: 415px) { @kEyFrAmEs pace-anim { 100% { opacity: 0; } } }`,
			fixed:
				`@media only screen and (min-width: 415px) { @keyframes pace-anim { 100% { opacity: 0; } } }`,
			line: 1,
			column: 45,
			message: messages.expected(`kEyFrAmEs`, `keyframes`),
		},
		{
			description: `the whole nested name in upper case, reported at its own column`,
			code: `@media only screen and (min-width: 415px) { @KEYFRAMES pace-anim { 100% { opacity: 0; } } }`,
			fixed:
				`@media only screen and (min-width: 415px) { @keyframes pace-anim { 100% { opacity: 0; } } }`,
			line: 1,
			column: 45,
			message: messages.expected(`KEYFRAMES`, `keyframes`),
		},
		{
			description: `an upper-case vendor prefix in front of a lower-case name`,
			code: `@-WEBKIT-keyframes { 0% { top: 0; } }`,
			fixed: `@-webkit-keyframes { 0% { top: 0; } }`,
			line: 1,
			column: 1,
			message: messages.expected(`-WEBKIT-keyframes`, `-webkit-keyframes`),
		},
		{
			description: `a vendor prefix and the name behind it both in upper case`,
			code: `@-WEBKIT-KEYFRAMES { 0% { top: 0; } }`,
			fixed: `@-webkit-keyframes { 0% { top: 0; } }`,
			line: 1,
			column: 1,
			message: messages.expected(`-WEBKIT-KEYFRAMES`, `-webkit-keyframes`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/357
		{
			description: `an at-rule spelled without a space in front of its options, which the parser gives the shape of a call to a Less detached ruleset`,
			code: `span { @IMPORT(reference) "x"; }`,
			fixed: `span { @import(reference) "x"; }`,
			line: 1,
			column: 8,
			message: messages.expected(`IMPORT`, `import`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/357
		{
			description: `the same at-rule written with the space`,
			code: `span { @IMPORT (reference) "x"; }`,
			fixed: `span { @import (reference) "x"; }`,
			line: 1,
			column: 8,
			message: messages.expected(`IMPORT`, `import`),
		},
	],
})

testRule({
	ruleName,
	config: [`upper`],

	accept: [
		{
			description: `a name already in upper case`,
			code: `@CHARSET 'UTF-8';`,
		},
		{
			description: `an at-rule closing on nothing, neither a semicolon nor a block`,
			code: `@IMPORT 'test.css'`,
		},
		{
			description: `a name in front of a URL, which is left as it is spelled`,
			code: `@NAMESPACE url(XML-namespace-URL);`,
		},
		{
			description: `a name in front of a media query`,
			code: `@MEDIA screen {}`,
		},
		{
			description: `a name in front of a media feature`,
			code: `@MEDIA (min-width: 50em) {}`,
		},
		{
			description: `an at-rule nested in another, both names in upper case`,
			code: `@MEDIA only screen and (min-width: 415px) { @KEYFRAMES pace-anim { 100% { opacity: 0; } } }`,
		},
		{
			description: `a name in front of a supports condition`,
			code: `@SUPPORTS (animation-name: test) {}`,
		},
		{
			description: `a name in front of a list of functions, whose own names the rule says nothing about`,
			code: `@DOCUMENT url(http://www.w3.org/), url-prefix(http://www.w3.org/Style/), domain(mozilla.org), regexp('https:.*')`,
		},
		{
			description: `a name followed by a pseudo-class`,
			code: `@PAGE :first { margin: 1cm; }`,
		},
		{
			description: `a name whose block holds a percentage selector`,
			code: `@KEYFRAMES { 0% { top: 0; } }`,
		},
		{
			description: `a vendor prefix, which is part of the name and upper case with it`,
			code: `@-WEBKIT-KEYFRAMES { 0% { top: 0; } }`,
		},
		{
			description: `a name of a single word`,
			code: `@VIEWPORT { orientation: landscape; }`,
		},
		{
			description: `a hyphenated name`,
			code: `@COUNTER-STYLE win-list { system: fixed; symbols: url(gold-medal.svg) url(silver-medal.svg) ; suffix: ' ';}`,
		},
		{
			description: `an at-rule nested in a block that is not a rule`,
			code: `@FONT-FEATURE-VALUES Font One { @STYLESET { nice-style: 12; } }`,
		},
	],

	reject: [
		{
			description: `a capital first letter`,
			code: `@Charset 'UTF-8';`,
			fixed: `@CHARSET 'UTF-8';`,
			line: 1,
			column: 1,
			message: messages.expected(`Charset`, `CHARSET`),
		},
		{
			description: `alternating case`,
			code: `@cHaRsEt 'UTF-8';`,
			fixed: `@CHARSET 'UTF-8';`,
			line: 1,
			column: 1,
			message: messages.expected(`cHaRsEt`, `CHARSET`),
		},
		{
			description: `the whole name in lower case`,
			code: `@charset 'UTF-8';`,
			fixed: `@CHARSET 'UTF-8';`,
			line: 1,
			column: 1,
			message: messages.expected(`charset`, `CHARSET`),
		},
		{
			description: `a capital first letter on an at-rule carrying a block`,
			code: `@Media screen {}`,
			fixed: `@MEDIA screen {}`,
			line: 1,
			column: 1,
			message: messages.expected(`Media`, `MEDIA`),
		},
		{
			description: `alternating case on an at-rule carrying a block`,
			code: `@mEdIa screen {}`,
			fixed: `@MEDIA screen {}`,
			line: 1,
			column: 1,
			message: messages.expected(`mEdIa`, `MEDIA`),
		},
		{
			description: `the whole name in lower case on an at-rule carrying a block`,
			code: `@media screen {}`,
			fixed: `@MEDIA screen {}`,
			line: 1,
			column: 1,
			message: messages.expected(`media`, `MEDIA`),
		},
		{
			description: `a capital first letter on the nested at-rule, reported at its own column`,
			code: `@MEDIA only screen and (min-width: 415px) { @Keyframes pace-anim { 100% { opacity: 0; } } }`,
			fixed:
				`@MEDIA only screen and (min-width: 415px) { @KEYFRAMES pace-anim { 100% { opacity: 0; } } }`,
			line: 1,
			column: 45,
			message: messages.expected(`Keyframes`, `KEYFRAMES`),
		},
		{
			description: `alternating case on the nested at-rule, reported at its own column`,
			code: `@MEDIA only screen and (min-width: 415px) { @kEyFrAmEs pace-anim { 100% { opacity: 0; } } }`,
			fixed:
				`@MEDIA only screen and (min-width: 415px) { @KEYFRAMES pace-anim { 100% { opacity: 0; } } }`,
			line: 1,
			column: 45,
			message: messages.expected(`kEyFrAmEs`, `KEYFRAMES`),
		},
		{
			description: `the whole nested name in lower case, reported at its own column`,
			code: `@MEDIA only screen and (min-width: 415px) { @keyframes pace-anim { 100% { opacity: 0; } } }`,
			fixed:
				`@MEDIA only screen and (min-width: 415px) { @KEYFRAMES pace-anim { 100% { opacity: 0; } } }`,
			line: 1,
			column: 45,
			message: messages.expected(`keyframes`, `KEYFRAMES`),
		},
		{
			description: `a lower-case vendor prefix in front of an upper-case name`,
			code: `@-webkit-KEYFRAMES { 0% { top: 0; } }`,
			fixed: `@-WEBKIT-KEYFRAMES { 0% { top: 0; } }`,
			line: 1,
			column: 1,
			message: messages.expected(`-webkit-KEYFRAMES`, `-WEBKIT-KEYFRAMES`),
		},
		{
			description: `a vendor prefix and the name behind it both in lower case`,
			code: `@-webkit-keyframes { 0% { top: 0; } }`,
			fixed: `@-WEBKIT-KEYFRAMES { 0% { top: 0; } }`,
			line: 1,
			column: 1,
			message: messages.expected(`-webkit-keyframes`, `-WEBKIT-KEYFRAMES`),
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`lower`],

	accept: [
		{
			description: `a Less mixin, whose parentheses are no at-rule`,
			code: `
				.someMixin() { margin: 0; }

				span { .someMixin(); }
			`,
		},
		{
			description: `a Less variable, which the parser gives the shape of an at-rule`,
			code: `
				@myVariable: #f7f8f9;
				span { background-color: @myVariable; }
			`,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/357
		{
			description: `a call to a Less detached ruleset, which takes no arguments and no space in front of its parentheses`,
			code: `
				@detachedRuleset: { margin: 0; };
				span { @detachedRuleset(); }
			`,
		},
	],
})
