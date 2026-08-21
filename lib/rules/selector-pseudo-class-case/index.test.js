import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`lower`],

	accept: [
		{
			description: `a selector with no pseudo-class`,
			code: `a { color: pink; }`,
		},
		{
			description: `a lower-case pseudo-class`,
			code: `a:hover { color: pink; }`,
		},
		{
			description: `another lower-case pseudo-class`,
			code: `a:focus { color: pink; }`,
		},
		{
			description: `a pseudo-element written with one colon, which this rule leaves to the pseudo-element rules`,
			code: `a:before { color: pink; }`,
		},
		{
			description: `the same pseudo-element in upper case, left alone for the same reason`,
			code: `a:BEFORE { color: pink; }`,
		},
		{
			description: `another single-colon pseudo-element`,
			code: `a:after { color: pink; }`,
		},
		{
			description: `the same in upper case`,
			code: `a:AFTER { color: pink; }`,
		},
		{
			description: `a single-colon pseudo-element of the first letter`,
			code: `a:first-letter { color: pink; }`,
		},
		{
			description: `the same in upper case`,
			code: `a:FIRST-LETTER { color: pink; }`,
		},
		{
			description: `a single-colon pseudo-element of the first line`,
			code: `a:first-line { color: pink; }`,
		},
		{
			description: `the same in upper case`,
			code: `a:FIRST-LINE { color: pink; }`,
		},
		{
			description: `a pseudo-element written with two colons`,
			code: `a::before { color: pink; }`,
		},
		{
			description: `the same in upper case`,
			code: `a::BEFORE { color: pink; }`,
		},
		{
			description: `a pseudo-element no specification knows`,
			code: `a::some-pseudo-element { }`,
		},
		{
			description: `the same in upper case`,
			code: `a::SOME-PSEUDO-ELEMENT { }`,
		},
		{
			description: `a pseudo-class followed by a single-colon pseudo-element`,
			code: `p:first-child:before { }`,
		},
		{
			description: `the same with the pseudo-element in upper case`,
			code: `p:first-child:BEFORE { }`,
		},
		{
			description: `a pseudo-class taking a selector list`,
			code: `h1:not(h2, h3) { }`,
		},
		{
			description: `a pseudo-class taking a formula`,
			code: `p:nth-child(3n+0) { }`,
		},
		{
			description: `a pseudo-class taking a keyword`,
			code: `p:nth-child(odd) { }`,
		},
		{
			description: `a vendor-prefixed pseudo-element`,
			code: `input::-moz-placeholder { color: pink; }`,
		},
		{
			description: `the same in upper case`,
			code: `input::-MOZ-PLACEHOLDER { color: pink; }`,
		},
		{
			description: `the root pseudo-class`,
			code: `:root { background: #ff0000; }`,
		},
		{
			description: `a pseudo-class no specification knows`,
			code: `a:some-pseudo-class { }`,
		},
		{
			description: `the same standing on its own`,
			code: `:some-pseudo-class { }`,
		},
		{
			description: `a pseudo-class in front of a vendor-prefixed pseudo-element`,
			code: `input[type=file]:active::-webkit-file-upload-button { }`,
		},
		{
			description: `the same with the pseudo-element in upper case`,
			code: `input[type=file]:active::-WEBKIT-FILE-UPLOAD-BUTTON { }`,
		},
		{
			description: `a vendor-prefixed pseudo-class`,
			code: `:-ms-input-placeholder { }`,
		},
		{
			description: `a custom property under the root selector`,
			code: `:root { --foo: 1px; }`,
		},
		{
			description: `a custom property under a type selector`,
			code: `html { --foo: 1px; }`,
		},
		{
			description: `a custom property set under the root selector`,
			code: `:root { --custom-property-set: {} }`,
		},
		{
			description: `a custom property set under a type selector`,
			code: `html { --custom-property-set: {} }`,
		},
	],

	reject: [
		{
			description: `a pseudo-class opening with a capital`,
			code: `a:Hover { color: pink; }`,
			fixed: `a:hover { color: pink; }`,
			line: 1,
			column: 2,
			message: messages.expected(`:Hover`, `:hover`),
		},
		{
			description: `the same pseudo-class behind a comment`,
			code: `/* comment */ a:Hover { color: pink; }`,
			fixed: `/* comment */ a:hover { color: pink; }`,
			line: 1,
			column: 16,
			message: messages.expected(`:Hover`, `:hover`),
		},
		{
			description: `the same in front of a comment standing after the comma`,
			code: `a:Hover,/*comment*/ .b {color: pink;}`,
			fixed: `a:hover,/*comment*/ .b {color: pink;}`,
			line: 1,
			column: 2,
			message: messages.expected(`:Hover`, `:hover`),
		},
		{
			description: `the same in front of a comment`,
			code: `a:Hover /* comment */ { color: pink; }`,
			fixed: `a:hover /* comment */ { color: pink; }`,
			line: 1,
			column: 2,
			message: messages.expected(`:Hover`, `:hover`),
		},
		{
			description: `the same behind a combinator and a comment`,
			code: `.foo > /* comment */ a:Hover { color: pink; }`,
			fixed: `.foo > /* comment */ a:hover { color: pink; }`,
			line: 1,
			column: 23,
			message: messages.expected(`:Hover`, `:hover`),
		},
		{
			description: `two pseudo-classes, both opening with a capital`,
			code: `a:First-child:Hover { color: pink; }`,
			fixed: `a:first-child:hover { color: pink; }`,
			warnings: [
				{
					line: 1,
					column: 2,
					message: messages.expected(`:First-child`, `:first-child`),
				},
				{
					line: 1,
					column: 14,
					message: messages.expected(`:Hover`, `:hover`),
				},
			],
		},
		{
			description: `a pseudo-class in mixed case`,
			code: `a:hOvEr { color: pink; }`,
			fixed: `a:hover { color: pink; }`,
			line: 1,
			column: 2,
			message: messages.expected(`:hOvEr`, `:hover`),
		},
		{
			description: `a pseudo-class in upper case`,
			code: `a:HOVER { color: pink; }`,
			fixed: `a:hover { color: pink; }`,
			line: 1,
			column: 2,
			message: messages.expected(`:HOVER`, `:hover`),
		},
		{
			description: `a pseudo-class opening with a capital, followed by a single-colon pseudo-element`,
			code: `p:First-child:before { }`,
			fixed: `p:first-child:before { }`,
			line: 1,
			column: 2,
			message: messages.expected(`:First-child`, `:first-child`),
		},
		{
			description: `the same with the pseudo-element in upper case`,
			code: `p:First-child:BEFORE { }`,
			fixed: `p:first-child:BEFORE { }`,
			line: 1,
			column: 2,
			message: messages.expected(`:First-child`, `:first-child`),
		},
		{
			description: `a pseudo-class taking a selector list, opening with a capital`,
			code: `h1:Not(h2, h3) { }`,
			fixed: `h1:not(h2, h3) { }`,
			line: 1,
			column: 3,
			message: messages.expected(`:Not`, `:not`),
		},
		{
			description: `the same in mixed case`,
			code: `h1:nOt(h2, h3) { }`,
			fixed: `h1:not(h2, h3) { }`,
			line: 1,
			column: 3,
			message: messages.expected(`:nOt`, `:not`),
		},
		{
			description: `the same in upper case`,
			code: `h1:NOT(h2, h3) { }`,
			fixed: `h1:not(h2, h3) { }`,
			line: 1,
			column: 3,
			message: messages.expected(`:NOT`, `:not`),
		},
		{
			description: `a pseudo-class ending in a capital`,
			code: `:matcheS(a, .foo) { }`,
			fixed: `:matches(a, .foo) { }`,
			line: 1,
			column: 1,
			message: messages.expected(`:matcheS`, `:matches`),
		},
		{
			description: `the same pseudo-class opening with one`,
			code: `:Matches(a, .foo) { }`,
			fixed: `:matches(a, .foo) { }`,
			line: 1,
			column: 1,
			message: messages.expected(`:Matches`, `:matches`),
		},
		{
			description: `a pseudo-class taking a selector, in mixed case`,
			code: `a:hAs(> img) { }`,
			fixed: `a:has(> img) { }`,
			line: 1,
			column: 2,
			message: messages.expected(`:hAs`, `:has`),
		},
		{
			description: `the same in upper case`,
			code: `a:HAS(> img) {\n}`,
			fixed: `a:has(> img) {\n}`,
			line: 1,
			column: 2,
			message: messages.expected(`:HAS`, `:has`),
		},
		{
			description: `the root pseudo-class opening with a capital`,
			code: `:Root { background: #ff0000; }`,
			fixed: `:root { background: #ff0000; }`,
			line: 1,
			column: 1,
			message: messages.expected(`:Root`, `:root`),
		},
		{
			description: `the same in mixed case`,
			code: `:rOoT { background: #ff0000; }`,
			fixed: `:root { background: #ff0000; }`,
			line: 1,
			column: 1,
			message: messages.expected(`:rOoT`, `:root`),
		},
		{
			description: `the same in upper case`,
			code: `:ROOT { background: #ff0000; }`,
			fixed: `:root { background: #ff0000; }`,
			line: 1,
			column: 1,
			message: messages.expected(`:ROOT`, `:root`),
		},
		{
			description: `a pseudo-class no specification knows, opening with a capital`,
			code: `a:Some-pseudo-class { }`,
			fixed: `a:some-pseudo-class { }`,
			line: 1,
			column: 2,
			message: messages.expected(`:Some-pseudo-class`, `:some-pseudo-class`),
		},
		{
			description: `the same in mixed case`,
			code: `a:sOmE-pSeUdO-cLaSs { }`,
			fixed: `a:some-pseudo-class { }`,
			line: 1,
			column: 2,
			message: messages.expected(`:sOmE-pSeUdO-cLaSs`, `:some-pseudo-class`),
		},
		{
			description: `the same in upper case`,
			code: `a:SOME-PSEUDO-CLASS { }`,
			fixed: `a:some-pseudo-class { }`,
			line: 1,
			column: 2,
			message: messages.expected(`:SOME-PSEUDO-CLASS`, `:some-pseudo-class`),
		},
		{
			description: `the same standing on its own`,
			code: `:Some-pseudo-class { }`,
			fixed: `:some-pseudo-class { }`,
			line: 1,
			column: 1,
			message: messages.expected(`:Some-pseudo-class`, `:some-pseudo-class`),
		},
		{
			description: `the same in mixed case`,
			code: `:sOmE-pSeUdO-cLaSs { }`,
			fixed: `:some-pseudo-class { }`,
			line: 1,
			column: 1,
			message: messages.expected(`:sOmE-pSeUdO-cLaSs`, `:some-pseudo-class`),
		},
		{
			description: `the same in upper case`,
			code: `:SOME-PSEUDO-CLASS { }`,
			fixed: `:some-pseudo-class { }`,
			line: 1,
			column: 1,
			message: messages.expected(`:SOME-PSEUDO-CLASS`, `:some-pseudo-class`),
		},
		{
			description: `a pseudo-class opening with a capital in front of a vendor-prefixed pseudo-element`,
			code: `input[type=file]:Active::-webkit-file-upload-button { }`,
			fixed: `input[type=file]:active::-webkit-file-upload-button { }`,
			line: 1,
			column: 17,
			message: messages.expected(`:Active`, `:active`),
		},
		{
			description: `the same with the pseudo-element in upper case`,
			code: `input[type=file]:Active::-WEBKIT-FILE-UPLOAD-BUTTON { }`,
			fixed: `input[type=file]:active::-WEBKIT-FILE-UPLOAD-BUTTON { }`,
			line: 1,
			column: 17,
			message: messages.expected(`:Active`, `:active`),
		},
		{
			description: `a vendor-prefixed pseudo-class opening with a capital`,
			code: `:-Ms-input-placeholder { }`,
			fixed: `:-ms-input-placeholder { }`,
			line: 1,
			column: 1,
			message: messages.expected(`:-Ms-input-placeholder`, `:-ms-input-placeholder`),
		},
		{
			description: `the same in mixed case`,
			code: `:-mS-iNpUt-PlAcEhOlDer { }`,
			fixed: `:-ms-input-placeholder { }`,
			line: 1,
			column: 1,
			message: messages.expected(`:-mS-iNpUt-PlAcEhOlDer`, `:-ms-input-placeholder`),
		},
		{
			description: `the same in upper case`,
			code: `:-MS-INPUT-PLACEHOLDER { }`,
			fixed: `:-ms-input-placeholder { }`,
			line: 1,
			column: 1,
			message: messages.expected(`:-MS-INPUT-PLACEHOLDER`, `:-ms-input-placeholder`),
		},
		{
			description: `an upper-case pseudo-class in the second selector of a list`,
			code: `a::FIRST-LETTER, a:FIRST {color: pink;}`,
			fixed: `a::FIRST-LETTER, a:first {color: pink;}`,
			line: 1,
			column: 19,
			message: messages.expected(`:FIRST`, `:first`),
		},
		{
			description: `the same list with a pseudo-class opening with a capital in the first selector`,
			code: `a::FIRST-LETTER:Hover, a:FIRST {color: pink;}`,
			fixed: `a::FIRST-LETTER:hover, a:first {color: pink;}`,
			warnings: [
				{
					line: 1,
					column: 16,
					message: messages.expected(`:Hover`, `:hover`),
				},
				{
					line: 1,
					column: 25,
					message: messages.expected(`:FIRST`, `:first`),
				},
			],
		},
		{
			description: `the same list with a comment standing after the comma`,
			code: `a::FIRST-LETTER:Hover,/*comment*/ a:FIRST {color: pink;}`,
			fixed: `a::FIRST-LETTER:hover,/*comment*/ a:first {color: pink;}`,
			warnings: [
				{
					line: 1,
					column: 16,
					message: messages.expected(`:Hover`, `:hover`),
				},
				{
					line: 1,
					column: 36,
					message: messages.expected(`:FIRST`, `:first`),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`upper`],

	accept: [
		{
			description: `a selector with no pseudo-class`,
			code: `a { color: pink; }`,
		},
		{
			description: `an upper-case pseudo-class`,
			code: `a:HOVER { color: pink; }`,
		},
		{
			description: `another upper-case pseudo-class`,
			code: `a:FOCUS { color: pink; }`,
		},
		{
			description: `a pseudo-element written with one colon, which this rule leaves to the pseudo-element rules`,
			code: `a:before { color: pink; }`,
		},
		{
			description: `the same pseudo-element in upper case, left alone for the same reason`,
			code: `a:BEFORE { color: pink; }`,
		},
		{
			description: `another single-colon pseudo-element`,
			code: `a:after { color: pink; }`,
		},
		{
			description: `the same in upper case`,
			code: `a:AFTER { color: pink; }`,
		},
		{
			description: `a single-colon pseudo-element of the first letter`,
			code: `a:first-letter { color: pink; }`,
		},
		{
			description: `the same in upper case`,
			code: `a:FIRST-LETTER { color: pink; }`,
		},
		{
			description: `a single-colon pseudo-element of the first line`,
			code: `a:first-line { color: pink; }`,
		},
		{
			description: `the same in upper case`,
			code: `a:FIRST-LINE { color: pink; }`,
		},
		{
			description: `a pseudo-element written with two colons`,
			code: `a::before { color: pink; }`,
		},
		{
			description: `the same in upper case`,
			code: `a::BEFORE { color: pink; }`,
		},
		{
			description: `a pseudo-element no specification knows`,
			code: `a::some-pseudo-element { }`,
		},
		{
			description: `the same in upper case`,
			code: `a::SOME-PSEUDO-ELEMENT { }`,
		},
		{
			description: `an upper-case pseudo-class followed by a single-colon pseudo-element`,
			code: `p:FIRST-CHILD:before { }`,
		},
		{
			description: `the same with the pseudo-element in upper case`,
			code: `p:FIRST-CHILD:BEFORE { }`,
		},
		{
			description: `a pseudo-class taking a selector list`,
			code: `h1:NOT(h2, h3) { }`,
		},
		{
			description: `a pseudo-class taking a formula`,
			code: `p:NTH-CHILD(3n+0) { }`,
		},
		{
			description: `a pseudo-class taking a keyword`,
			code: `p:NTH-CHILD(odd) { }`,
		},
		{
			description: `a vendor-prefixed pseudo-element`,
			code: `input::-moz-placeholder { color: pink; }`,
		},
		{
			description: `the same in upper case`,
			code: `input::-MOZ-PLACEHOLDER { color: pink; }`,
		},
		{
			description: `the root pseudo-class`,
			code: `:ROOT { background: #ff0000; }`,
		},
		{
			description: `a pseudo-class no specification knows`,
			code: `a:SOME-PSEUDO-CLASS { }`,
		},
		{
			description: `the same standing on its own`,
			code: `:SOME-PSEUDO-CLASS { }`,
		},
		{
			description: `a pseudo-class in front of a vendor-prefixed pseudo-element`,
			code: `input[type=file]:ACTIVE::-webkit-file-upload-button { }`,
		},
		{
			description: `the same with the pseudo-element in upper case`,
			code: `input[type=file]:ACTIVE::-WEBKIT-FILE-UPLOAD-BUTTON { }`,
		},
		{
			description: `a vendor-prefixed pseudo-class`,
			code: `:-MS-INPUT-PLACEHOLDER { }`,
		},
	],

	reject: [
		{
			description: `a pseudo-class opening with a capital`,
			code: `a:Hover { color: pink; }`,
			fixed: `a:HOVER { color: pink; }`,
			line: 1,
			column: 2,
			message: messages.expected(`:Hover`, `:HOVER`),
		},
		{
			description: `the same in mixed case`,
			code: `a:hOvEr { color: pink; }`,
			fixed: `a:HOVER { color: pink; }`,
			line: 1,
			column: 2,
			message: messages.expected(`:hOvEr`, `:HOVER`),
		},
		{
			description: `a pseudo-class in lower case`,
			code: `a:hover { color: pink; }`,
			fixed: `a:HOVER { color: pink; }`,
			line: 1,
			column: 2,
			message: messages.expected(`:hover`, `:HOVER`),
		},
		{
			description: `a pseudo-class opening with a capital, followed by a single-colon pseudo-element`,
			code: `p:First-child:before { }`,
			fixed: `p:FIRST-CHILD:before { }`,
			line: 1,
			column: 2,
			message: messages.expected(`:First-child`, `:FIRST-CHILD`),
		},
		{
			description: `the same with the pseudo-element in upper case`,
			code: `p:First-child:BEFORE { }`,
			fixed: `p:FIRST-CHILD:BEFORE { }`,
			line: 1,
			column: 2,
			message: messages.expected(`:First-child`, `:FIRST-CHILD`),
		},
		{
			description: `a pseudo-class taking a selector list, opening with a capital`,
			code: `h1:Not(h2, h3) { }`,
			fixed: `h1:NOT(h2, h3) { }`,
			line: 1,
			column: 3,
			message: messages.expected(`:Not`, `:NOT`),
		},
		{
			description: `the same in mixed case`,
			code: `h1:nOt(h2, h3) { }`,
			fixed: `h1:NOT(h2, h3) { }`,
			line: 1,
			column: 3,
			message: messages.expected(`:nOt`, `:NOT`),
		},
		{
			description: `the same in lower case`,
			code: `h1:not(h2, h3) { }`,
			fixed: `h1:NOT(h2, h3) { }`,
			line: 1,
			column: 3,
			message: messages.expected(`:not`, `:NOT`),
		},
		{
			description: `the root pseudo-class opening with a capital`,
			code: `:Root { background: #ff0000; }`,
			fixed: `:ROOT { background: #ff0000; }`,
			line: 1,
			column: 1,
			message: messages.expected(`:Root`, `:ROOT`),
		},
		{
			description: `the same in mixed case`,
			code: `:rOoT { background: #ff0000; }`,
			fixed: `:ROOT { background: #ff0000; }`,
			line: 1,
			column: 1,
			message: messages.expected(`:rOoT`, `:ROOT`),
		},
		{
			description: `the same in lower case`,
			code: `:root { background: #ff0000; }`,
			fixed: `:ROOT { background: #ff0000; }`,
			line: 1,
			column: 1,
			message: messages.expected(`:root`, `:ROOT`),
		},
		{
			description: `a pseudo-class no specification knows, opening with a capital`,
			code: `a:Some-pseudo-class { }`,
			fixed: `a:SOME-PSEUDO-CLASS { }`,
			line: 1,
			column: 2,
			message: messages.expected(`:Some-pseudo-class`, `:SOME-PSEUDO-CLASS`),
		},
		{
			description: `the same in mixed case`,
			code: `a:sOmE-pSeUdO-cLaSs { }`,
			fixed: `a:SOME-PSEUDO-CLASS { }`,
			line: 1,
			column: 2,
			message: messages.expected(`:sOmE-pSeUdO-cLaSs`, `:SOME-PSEUDO-CLASS`),
		},
		{
			description: `the same in lower case`,
			code: `a:some-pseudo-class { }`,
			fixed: `a:SOME-PSEUDO-CLASS { }`,
			line: 1,
			column: 2,
			message: messages.expected(`:some-pseudo-class`, `:SOME-PSEUDO-CLASS`),
		},
		{
			description: `the same standing on its own`,
			code: `:Some-pseudo-class { }`,
			fixed: `:SOME-PSEUDO-CLASS { }`,
			line: 1,
			column: 1,
			message: messages.expected(`:Some-pseudo-class`, `:SOME-PSEUDO-CLASS`),
		},
		{
			description: `the same in mixed case`,
			code: `:sOmE-pSeUdO-cLaSs { }`,
			fixed: `:SOME-PSEUDO-CLASS { }`,
			line: 1,
			column: 1,
			message: messages.expected(`:sOmE-pSeUdO-cLaSs`, `:SOME-PSEUDO-CLASS`),
		},
		{
			description: `the same in lower case`,
			code: `:some-pseudo-class { }`,
			fixed: `:SOME-PSEUDO-CLASS { }`,
			line: 1,
			column: 1,
			message: messages.expected(`:some-pseudo-class`, `:SOME-PSEUDO-CLASS`),
		},
		{
			description: `a pseudo-class opening with a capital in front of a vendor-prefixed pseudo-element`,
			code: `input[type=file]:Active::-webkit-file-upload-button { }`,
			fixed: `input[type=file]:ACTIVE::-webkit-file-upload-button { }`,
			line: 1,
			column: 17,
			message: messages.expected(`:Active`, `:ACTIVE`),
		},
		{
			description: `the same with the pseudo-element in upper case`,
			code: `input[type=file]:Active::-WEBKIT-FILE-UPLOAD-BUTTON { }`,
			fixed: `input[type=file]:ACTIVE::-WEBKIT-FILE-UPLOAD-BUTTON { }`,
			line: 1,
			column: 17,
			message: messages.expected(`:Active`, `:ACTIVE`),
		},
		{
			description: `a vendor-prefixed pseudo-class opening with a capital`,
			code: `:-Ms-input-placeholder { }`,
			fixed: `:-MS-INPUT-PLACEHOLDER { }`,
			line: 1,
			column: 1,
			message: messages.expected(`:-Ms-input-placeholder`, `:-MS-INPUT-PLACEHOLDER`),
		},
		{
			description: `the same in mixed case`,
			code: `:-mS-iNpUt-PlAcEhOlDer { }`,
			fixed: `:-MS-INPUT-PLACEHOLDER { }`,
			line: 1,
			column: 1,
			message: messages.expected(`:-mS-iNpUt-PlAcEhOlDer`, `:-MS-INPUT-PLACEHOLDER`),
		},
		{
			description: `the same in lower case`,
			code: `:-ms-input-placeholder { }`,
			fixed: `:-MS-INPUT-PLACEHOLDER { }`,
			line: 1,
			column: 1,
			message: messages.expected(`:-ms-input-placeholder`, `:-MS-INPUT-PLACEHOLDER`),
		},
	],
})

testRule({
	ruleName,
	config: [`lower`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a pseudo-class built by interpolation`,
			code: `:#{$variable} {}`,
		},
		{
			description: `the same interpolation written in upper case`,
			code: `:#{$VARIABLE} {}`,
		},
		{
			description: `the same interpolation behind a type selector`,
			code: `a:#{$variable} {}`,
		},
	],
})

testRule({
	ruleName,
	config: [`upper`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a pseudo-class built by interpolation`,
			code: `:#{$variable} {}`,
		},
		{
			description: `the same interpolation written in upper case`,
			code: `:#{$VARIABLE} {}`,
		},
		{
			description: `the same interpolation behind a type selector`,
			code: `a:#{$variable} {}`,
		},
	],
})

testRule({
	ruleName,
	config: [`lower`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/193
			description: `a selector carrying an inline comment, whose fix reaches the copy the file spells, reported in the file's own coordinates`,
			code: `.a // c\nb:HOVER {}`,
			fixed: `.a // c\nb:hover {}`,
			line: 2,
			column: 2,
			message: messages.expected(`:HOVER`, `:hover`),
		},
	],
})
