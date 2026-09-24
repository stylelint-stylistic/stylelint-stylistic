import { CHARSET_RULE_MESSAGE } from "../../utils/asksForTheCharsetRule/index.ts"

import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`lower`],

	accept: [
		{
			description: `a name already in lower case`,
			code: `@layer base;`,
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
		{
			// A name is ASCII case-insensitive, so a code point outside ASCII is part of it as it stands; recasing it made another name
			description: `an at-rule whose one ASCII letter is lower-case already, the capital I with a dot behind it having no lower case of one code point`,
			code: `@f\u0130 screen { }`,
		},
	],

	reject: [
		{
			description: `a capital first letter`,
			code: `@Layer base;`,
			fixed: `@layer base;`,
			line: 1,
			column: 1,
			message: messages.expected(`Layer`, `layer`),
		},
		{
			description: `alternating case`,
			code: `@lAyEr base;`,
			fixed: `@layer base;`,
			line: 1,
			column: 1,
			message: messages.expected(`lAyEr`, `layer`),
		},
		{
			description: `the whole name in upper case`,
			code: `@LAYER base;`,
			fixed: `@layer base;`,
			line: 1,
			column: 1,
			message: messages.expected(`LAYER`, `layer`),
		},
		{
			description: `a charset in every case of its name, which the rule passes over, the file getting the one warning asking for the core rule instead`,
			code: `@Charset "utf-8";\n@CHARSET "utf-8";\n@charset 'utf-8';`,
			fixed: `@Charset "utf-8";\n@CHARSET "utf-8";\n@charset 'utf-8';`,
			line: 1,
			column: 1,
			message: `${CHARSET_RULE_MESSAGE} (${ruleName})`,
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
		// See #357
		{
			description: `an at-rule spelled without a space in front of its options, which the parser gives the shape of a call to a Less detached ruleset`,
			code: `span { @IMPORT(reference) "x"; }`,
			fixed: `span { @import(reference) "x"; }`,
			line: 1,
			column: 8,
			message: messages.expected(`IMPORT`, `import`),
		},
		// See #357
		{
			description: `the same at-rule written with the space`,
			code: `span { @IMPORT (reference) "x"; }`,
			fixed: `span { @import (reference) "x"; }`,
			line: 1,
			column: 8,
			message: messages.expected(`IMPORT`, `import`),
		},
		{
			// The ASCII letter alone has a case of the same name, so it alone is asked for and written
			description: `an upper-case letter in front of a capital I with a dot, which alone is asked for`,
			code: `@F\u0130 screen { }`,
			fixed: `@f\u0130 screen { }`,
			line: 1,
			column: 1,
			message: messages.expected(`F\u0130`, `f\u0130`),
		},
	],
})

testRule({
	ruleName,
	config: [`upper`],

	accept: [
		{
			description: `a name already in upper case`,
			code: `@LAYER base;`,
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
		{
			// A name is ASCII case-insensitive, so a code point outside ASCII is part of it as it stands; recasing it made another name
			description: `an at-rule whose one ASCII letter is upper-case already, the sharp s behind it having no upper case of its own length`,
			code: `@F\u00DF screen { }`,
		},
	],

	reject: [
		{
			description: `a capital first letter`,
			code: `@Layer base;`,
			fixed: `@LAYER base;`,
			line: 1,
			column: 1,
			message: messages.expected(`Layer`, `LAYER`),
		},
		{
			description: `alternating case`,
			code: `@lAyEr base;`,
			fixed: `@LAYER base;`,
			line: 1,
			column: 1,
			message: messages.expected(`lAyEr`, `LAYER`),
		},
		{
			description: `the whole name in lower case`,
			code: `@layer base;`,
			fixed: `@LAYER base;`,
			line: 1,
			column: 1,
			message: messages.expected(`layer`, `LAYER`),
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
		{
			// The ASCII letter alone has a case of the same name, so it alone is asked for and written
			description: `a lower-case letter in front of a sharp s, which alone is asked for`,
			code: `@f\u00DF screen { }`,
			fixed: `@F\u00DF screen { }`,
			line: 1,
			column: 1,
			message: messages.expected(`f\u00DF`, `F\u00DF`),
		},
	],
})
