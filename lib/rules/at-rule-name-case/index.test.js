import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`lower`],

	accept: [
		{
			code: `@charset 'UTF-8';`,
			description: `a name already in lower case`,
		},
		{
			code: `@import 'test.css'`,
			description: `an at-rule closing on nothing, neither a semicolon nor a block`,
		},
		{
			code: `@namespace url(XML-namespace-URL);`,
			description: `a name in front of a URL, which is left as it is spelled`,
		},
		{
			code: `@media screen {}`,
			description: `a name in front of a media query`,
		},
		{
			code: `@media (min-width: 50em) {}`,
			description: `a name in front of a media feature`,
		},
		{
			code: `@media only screen and (min-width: 415px) { @keyframes pace-anim { 100% { opacity: 0; } } }`,
			description: `an at-rule nested in another, both names in lower case`,
		},
		{
			code: `@supports (animation-name: test) {}`,
			description: `a name in front of a supports condition`,
		},
		{
			code: `@document url(http://www.w3.org/), url-prefix(http://www.w3.org/Style/), domain(mozilla.org), regexp('https:.*')`,
			description: `a name in front of a list of functions, whose own names the rule says nothing about`,
		},
		{
			code: `@page :first { margin: 1cm; }`,
			description: `a name followed by a pseudo-class`,
		},
		{
			code: `@keyframes { 0% { top: 0; } }`,
			description: `a name whose block holds a percentage selector`,
		},
		{
			code: `@-webkit-keyframes { 0% { top: 0; } }`,
			description: `a vendor prefix, which is part of the name and lower case with it`,
		},
		{
			code: `@viewport { orientation: landscape; }`,
			description: `a name of a single word`,
		},
		{
			code: `@counter-style win-list { system: fixed; symbols: url(gold-medal.svg) url(silver-medal.svg) ; suffix: ' ';}`,
			description: `a hyphenated name`,
		},
		{
			code: `@font-feature-values Font One { @styleset { nice-style: 12; } }`,
			description: `an at-rule nested in a block that is not a rule`,
		},
	],

	reject: [
		{
			code: `@Charset 'UTF-8';`,
			fixed: `@charset 'UTF-8';`,
			description: `a capital first letter`,
			message: messages.expected(`Charset`, `charset`),
			line: 1,
			column: 1,
		},
		{
			code: `@cHaRsEt 'UTF-8';`,
			fixed: `@charset 'UTF-8';`,
			description: `alternating case`,
			message: messages.expected(`cHaRsEt`, `charset`),
			line: 1,
			column: 1,
		},
		{
			code: `@CHARSET 'UTF-8';`,
			fixed: `@charset 'UTF-8';`,
			description: `the whole name in upper case`,
			message: messages.expected(`CHARSET`, `charset`),
			line: 1,
			column: 1,
		},
		{
			code: `@Media screen {}`,
			fixed: `@media screen {}`,
			description: `a capital first letter on an at-rule carrying a block`,
			message: messages.expected(`Media`, `media`),
			line: 1,
			column: 1,
		},
		{
			code: `@mEdIa screen {}`,
			fixed: `@media screen {}`,
			description: `alternating case on an at-rule carrying a block`,
			message: messages.expected(`mEdIa`, `media`),
			line: 1,
			column: 1,
		},
		{
			code: `@MEDIA screen {}`,
			fixed: `@media screen {}`,
			description: `the whole name in upper case on an at-rule carrying a block`,
			message: messages.expected(`MEDIA`, `media`),
			line: 1,
			column: 1,
		},
		{
			code: `@media only screen and (min-width: 415px) { @Keyframes pace-anim { 100% { opacity: 0; } } }`,
			fixed:
				`@media only screen and (min-width: 415px) { @keyframes pace-anim { 100% { opacity: 0; } } }`,
			description: `a capital first letter on the nested at-rule, reported at its own column`,
			message: messages.expected(`Keyframes`, `keyframes`),
			line: 1,
			column: 45,
		},
		{
			code: `@media only screen and (min-width: 415px) { @kEyFrAmEs pace-anim { 100% { opacity: 0; } } }`,
			fixed:
				`@media only screen and (min-width: 415px) { @keyframes pace-anim { 100% { opacity: 0; } } }`,
			description: `alternating case on the nested at-rule, reported at its own column`,
			message: messages.expected(`kEyFrAmEs`, `keyframes`),
			line: 1,
			column: 45,
		},
		{
			code: `@media only screen and (min-width: 415px) { @KEYFRAMES pace-anim { 100% { opacity: 0; } } }`,
			fixed:
				`@media only screen and (min-width: 415px) { @keyframes pace-anim { 100% { opacity: 0; } } }`,
			description: `the whole nested name in upper case, reported at its own column`,
			message: messages.expected(`KEYFRAMES`, `keyframes`),
			line: 1,
			column: 45,
		},
		{
			code: `@-WEBKIT-keyframes { 0% { top: 0; } }`,
			fixed: `@-webkit-keyframes { 0% { top: 0; } }`,
			description: `an upper-case vendor prefix in front of a lower-case name`,
			message: messages.expected(`-WEBKIT-keyframes`, `-webkit-keyframes`),
			line: 1,
			column: 1,
		},
		{
			code: `@-WEBKIT-KEYFRAMES { 0% { top: 0; } }`,
			fixed: `@-webkit-keyframes { 0% { top: 0; } }`,
			description: `a vendor prefix and the name behind it both in upper case`,
			message: messages.expected(`-WEBKIT-KEYFRAMES`, `-webkit-keyframes`),
			line: 1,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [`upper`],

	accept: [
		{
			code: `@CHARSET 'UTF-8';`,
			description: `a name already in upper case`,
		},
		{
			code: `@IMPORT 'test.css'`,
			description: `an at-rule closing on nothing, neither a semicolon nor a block`,
		},
		{
			code: `@NAMESPACE url(XML-namespace-URL);`,
			description: `a name in front of a URL, which is left as it is spelled`,
		},
		{
			code: `@MEDIA screen {}`,
			description: `a name in front of a media query`,
		},
		{
			code: `@MEDIA (min-width: 50em) {}`,
			description: `a name in front of a media feature`,
		},
		{
			code: `@MEDIA only screen and (min-width: 415px) { @KEYFRAMES pace-anim { 100% { opacity: 0; } } }`,
			description: `an at-rule nested in another, both names in upper case`,
		},
		{
			code: `@SUPPORTS (animation-name: test) {}`,
			description: `a name in front of a supports condition`,
		},
		{
			code: `@DOCUMENT url(http://www.w3.org/), url-prefix(http://www.w3.org/Style/), domain(mozilla.org), regexp('https:.*')`,
			description: `a name in front of a list of functions, whose own names the rule says nothing about`,
		},
		{
			code: `@PAGE :first { margin: 1cm; }`,
			description: `a name followed by a pseudo-class`,
		},
		{
			code: `@KEYFRAMES { 0% { top: 0; } }`,
			description: `a name whose block holds a percentage selector`,
		},
		{
			code: `@-WEBKIT-KEYFRAMES { 0% { top: 0; } }`,
			description: `a vendor prefix, which is part of the name and upper case with it`,
		},
		{
			code: `@VIEWPORT { orientation: landscape; }`,
			description: `a name of a single word`,
		},
		{
			code: `@COUNTER-STYLE win-list { system: fixed; symbols: url(gold-medal.svg) url(silver-medal.svg) ; suffix: ' ';}`,
			description: `a hyphenated name`,
		},
		{
			code: `@FONT-FEATURE-VALUES Font One { @STYLESET { nice-style: 12; } }`,
			description: `an at-rule nested in a block that is not a rule`,
		},
	],

	reject: [
		{
			code: `@Charset 'UTF-8';`,
			fixed: `@CHARSET 'UTF-8';`,
			description: `a capital first letter`,
			message: messages.expected(`Charset`, `CHARSET`),
			line: 1,
			column: 1,
		},
		{
			code: `@cHaRsEt 'UTF-8';`,
			fixed: `@CHARSET 'UTF-8';`,
			description: `alternating case`,
			message: messages.expected(`cHaRsEt`, `CHARSET`),
			line: 1,
			column: 1,
		},
		{
			code: `@charset 'UTF-8';`,
			fixed: `@CHARSET 'UTF-8';`,
			description: `the whole name in lower case`,
			message: messages.expected(`charset`, `CHARSET`),
			line: 1,
			column: 1,
		},
		{
			code: `@Media screen {}`,
			fixed: `@MEDIA screen {}`,
			description: `a capital first letter on an at-rule carrying a block`,
			message: messages.expected(`Media`, `MEDIA`),
			line: 1,
			column: 1,
		},
		{
			code: `@mEdIa screen {}`,
			fixed: `@MEDIA screen {}`,
			description: `alternating case on an at-rule carrying a block`,
			message: messages.expected(`mEdIa`, `MEDIA`),
			line: 1,
			column: 1,
		},
		{
			code: `@media screen {}`,
			fixed: `@MEDIA screen {}`,
			description: `the whole name in lower case on an at-rule carrying a block`,
			message: messages.expected(`media`, `MEDIA`),
			line: 1,
			column: 1,
		},
		{
			code: `@MEDIA only screen and (min-width: 415px) { @Keyframes pace-anim { 100% { opacity: 0; } } }`,
			fixed:
				`@MEDIA only screen and (min-width: 415px) { @KEYFRAMES pace-anim { 100% { opacity: 0; } } }`,
			description: `a capital first letter on the nested at-rule, reported at its own column`,
			message: messages.expected(`Keyframes`, `KEYFRAMES`),
			line: 1,
			column: 45,
		},
		{
			code: `@MEDIA only screen and (min-width: 415px) { @kEyFrAmEs pace-anim { 100% { opacity: 0; } } }`,
			fixed:
				`@MEDIA only screen and (min-width: 415px) { @KEYFRAMES pace-anim { 100% { opacity: 0; } } }`,
			description: `alternating case on the nested at-rule, reported at its own column`,
			message: messages.expected(`kEyFrAmEs`, `KEYFRAMES`),
			line: 1,
			column: 45,
		},
		{
			code: `@MEDIA only screen and (min-width: 415px) { @keyframes pace-anim { 100% { opacity: 0; } } }`,
			fixed:
				`@MEDIA only screen and (min-width: 415px) { @KEYFRAMES pace-anim { 100% { opacity: 0; } } }`,
			description: `the whole nested name in lower case, reported at its own column`,
			message: messages.expected(`keyframes`, `KEYFRAMES`),
			line: 1,
			column: 45,
		},
		{
			code: `@-webkit-KEYFRAMES { 0% { top: 0; } }`,
			fixed: `@-WEBKIT-KEYFRAMES { 0% { top: 0; } }`,
			description: `a lower-case vendor prefix in front of an upper-case name`,
			message: messages.expected(`-webkit-KEYFRAMES`, `-WEBKIT-KEYFRAMES`),
			line: 1,
			column: 1,
		},
		{
			code: `@-webkit-keyframes { 0% { top: 0; } }`,
			fixed: `@-WEBKIT-KEYFRAMES { 0% { top: 0; } }`,
			description: `a vendor prefix and the name behind it both in lower case`,
			message: messages.expected(`-webkit-keyframes`, `-WEBKIT-KEYFRAMES`),
			line: 1,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`lower`],

	accept: [
		{
			code: `
        .someMixin() { margin: 0; }

        span { .someMixin(); }
      `,
			description: `a Less mixin, whose parentheses are no at-rule`,
		},
		{
			code: `
        @myVariable: #f7f8f9;
        span { background-color: @myVariable; }
      `,
			description: `a Less variable, which the parser gives the shape of an at-rule`,
		},
	],
})
