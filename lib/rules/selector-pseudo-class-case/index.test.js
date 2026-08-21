import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`lower`],

	accept: [
		{
			code: `a { color: pink; }`,
			description: `a selector with no pseudo-class`,
		},
		{
			code: `a:hover { color: pink; }`,
			description: `a lower-case pseudo-class`,
		},
		{
			code: `a:focus { color: pink; }`,
			description: `another lower-case pseudo-class`,
		},
		{
			code: `a:before { color: pink; }`,
			description: `a pseudo-element written with one colon, which this rule leaves to the pseudo-element rules`,
		},
		{
			code: `a:BEFORE { color: pink; }`,
			description: `the same pseudo-element in upper case, left alone for the same reason`,
		},
		{
			code: `a:after { color: pink; }`,
			description: `another single-colon pseudo-element`,
		},
		{
			code: `a:AFTER { color: pink; }`,
			description: `the same in upper case`,
		},
		{
			code: `a:first-letter { color: pink; }`,
			description: `a single-colon pseudo-element of the first letter`,
		},
		{
			code: `a:FIRST-LETTER { color: pink; }`,
			description: `the same in upper case`,
		},
		{
			code: `a:first-line { color: pink; }`,
			description: `a single-colon pseudo-element of the first line`,
		},
		{
			code: `a:FIRST-LINE { color: pink; }`,
			description: `the same in upper case`,
		},
		{
			code: `a::before { color: pink; }`,
			description: `a pseudo-element written with two colons`,
		},
		{
			code: `a::BEFORE { color: pink; }`,
			description: `the same in upper case`,
		},
		{
			code: `a::some-pseudo-element { }`,
			description: `a pseudo-element no specification knows`,
		},
		{
			code: `a::SOME-PSEUDO-ELEMENT { }`,
			description: `the same in upper case`,
		},
		{
			code: `p:first-child:before { }`,
			description: `a pseudo-class followed by a single-colon pseudo-element`,
		},
		{
			code: `p:first-child:BEFORE { }`,
			description: `the same with the pseudo-element in upper case`,
		},
		{
			code: `h1:not(h2, h3) { }`,
			description: `a pseudo-class taking a selector list`,
		},
		{
			code: `p:nth-child(3n+0) { }`,
			description: `a pseudo-class taking a formula`,
		},
		{
			code: `p:nth-child(odd) { }`,
			description: `a pseudo-class taking a keyword`,
		},
		{
			code: `input::-moz-placeholder { color: pink; }`,
			description: `a vendor-prefixed pseudo-element`,
		},
		{
			code: `input::-MOZ-PLACEHOLDER { color: pink; }`,
			description: `the same in upper case`,
		},
		{
			code: `:root { background: #ff0000; }`,
			description: `the root pseudo-class`,
		},
		{
			code: `a:some-pseudo-class { }`,
			description: `a pseudo-class no specification knows`,
		},
		{
			code: `:some-pseudo-class { }`,
			description: `the same standing on its own`,
		},
		{
			code: `input[type=file]:active::-webkit-file-upload-button { }`,
			description: `a pseudo-class in front of a vendor-prefixed pseudo-element`,
		},
		{
			code: `input[type=file]:active::-WEBKIT-FILE-UPLOAD-BUTTON { }`,
			description: `the same with the pseudo-element in upper case`,
		},
		{
			code: `:-ms-input-placeholder { }`,
			description: `a vendor-prefixed pseudo-class`,
		},
		{
			code: `:root { --foo: 1px; }`,
			description: `a custom property under the root selector`,
		},
		{
			code: `html { --foo: 1px; }`,
			description: `a custom property under a type selector`,
		},
		{
			code: `:root { --custom-property-set: {} }`,
			description: `a custom property set under the root selector`,
		},
		{
			code: `html { --custom-property-set: {} }`,
			description: `a custom property set under a type selector`,
		},
	],

	reject: [
		{
			code: `a:Hover { color: pink; }`,
			fixed: `a:hover { color: pink; }`,
			description: `a pseudo-class opening with a capital`,
			message: messages.expected(`:Hover`, `:hover`),
			line: 1,
			column: 2,
		},
		{
			code: `/* comment */ a:Hover { color: pink; }`,
			fixed: `/* comment */ a:hover { color: pink; }`,
			description: `the same pseudo-class behind a comment`,
			message: messages.expected(`:Hover`, `:hover`),
			line: 1,
			column: 16,
		},
		{
			code: `a:Hover,/*comment*/ .b {color: pink;}`,
			fixed: `a:hover,/*comment*/ .b {color: pink;}`,
			description: `the same in front of a comment standing after the comma`,
			message: messages.expected(`:Hover`, `:hover`),
			line: 1,
			column: 2,
		},
		{
			code: `a:Hover /* comment */ { color: pink; }`,
			fixed: `a:hover /* comment */ { color: pink; }`,
			description: `the same in front of a comment`,
			message: messages.expected(`:Hover`, `:hover`),
			line: 1,
			column: 2,
		},
		{
			code: `.foo > /* comment */ a:Hover { color: pink; }`,
			fixed: `.foo > /* comment */ a:hover { color: pink; }`,
			description: `the same behind a combinator and a comment`,
			message: messages.expected(`:Hover`, `:hover`),
			line: 1,
			column: 23,
		},
		{
			code: `a:First-child:Hover { color: pink; }`,
			fixed: `a:first-child:hover { color: pink; }`,
			description: `two pseudo-classes, both opening with a capital`,
			warnings: [
				{
					message: messages.expected(`:First-child`, `:first-child`),
					line: 1,
					column: 2,
				},
				{
					message: messages.expected(`:Hover`, `:hover`),
					line: 1,
					column: 14,
				},
			],
		},
		{
			code: `a:hOvEr { color: pink; }`,
			fixed: `a:hover { color: pink; }`,
			description: `a pseudo-class in mixed case`,
			message: messages.expected(`:hOvEr`, `:hover`),
			line: 1,
			column: 2,
		},
		{
			code: `a:HOVER { color: pink; }`,
			fixed: `a:hover { color: pink; }`,
			description: `a pseudo-class in upper case`,
			message: messages.expected(`:HOVER`, `:hover`),
			line: 1,
			column: 2,
		},
		{
			code: `p:First-child:before { }`,
			fixed: `p:first-child:before { }`,
			description: `a pseudo-class opening with a capital, followed by a single-colon pseudo-element`,
			message: messages.expected(`:First-child`, `:first-child`),
			line: 1,
			column: 2,
		},
		{
			code: `p:First-child:BEFORE { }`,
			fixed: `p:first-child:BEFORE { }`,
			description: `the same with the pseudo-element in upper case`,
			message: messages.expected(`:First-child`, `:first-child`),
			line: 1,
			column: 2,
		},
		{
			code: `h1:Not(h2, h3) { }`,
			fixed: `h1:not(h2, h3) { }`,
			description: `a pseudo-class taking a selector list, opening with a capital`,
			message: messages.expected(`:Not`, `:not`),
			line: 1,
			column: 3,
		},
		{
			code: `h1:nOt(h2, h3) { }`,
			fixed: `h1:not(h2, h3) { }`,
			description: `the same in mixed case`,
			message: messages.expected(`:nOt`, `:not`),
			line: 1,
			column: 3,
		},
		{
			code: `h1:NOT(h2, h3) { }`,
			fixed: `h1:not(h2, h3) { }`,
			description: `the same in upper case`,
			message: messages.expected(`:NOT`, `:not`),
			line: 1,
			column: 3,
		},
		{
			code: `:matcheS(a, .foo) { }`,
			fixed: `:matches(a, .foo) { }`,
			description: `a pseudo-class ending in a capital`,
			message: messages.expected(`:matcheS`, `:matches`),
			line: 1,
			column: 1,
		},
		{
			code: `:Matches(a, .foo) { }`,
			fixed: `:matches(a, .foo) { }`,
			description: `the same pseudo-class opening with one`,
			message: messages.expected(`:Matches`, `:matches`),
			line: 1,
			column: 1,
		},
		{
			code: `a:hAs(> img) { }`,
			fixed: `a:has(> img) { }`,
			description: `a pseudo-class taking a selector, in mixed case`,
			message: messages.expected(`:hAs`, `:has`),
			line: 1,
			column: 2,
		},
		{
			code: `a:HAS(> img) {\n}`,
			fixed: `a:has(> img) {\n}`,
			description: `the same in upper case`,
			message: messages.expected(`:HAS`, `:has`),
			line: 1,
			column: 2,
		},
		{
			code: `:Root { background: #ff0000; }`,
			fixed: `:root { background: #ff0000; }`,
			description: `the root pseudo-class opening with a capital`,
			message: messages.expected(`:Root`, `:root`),
			line: 1,
			column: 1,
		},
		{
			code: `:rOoT { background: #ff0000; }`,
			fixed: `:root { background: #ff0000; }`,
			description: `the same in mixed case`,
			message: messages.expected(`:rOoT`, `:root`),
			line: 1,
			column: 1,
		},
		{
			code: `:ROOT { background: #ff0000; }`,
			fixed: `:root { background: #ff0000; }`,
			description: `the same in upper case`,
			message: messages.expected(`:ROOT`, `:root`),
			line: 1,
			column: 1,
		},
		{
			code: `a:Some-pseudo-class { }`,
			fixed: `a:some-pseudo-class { }`,
			description: `a pseudo-class no specification knows, opening with a capital`,
			message: messages.expected(`:Some-pseudo-class`, `:some-pseudo-class`),
			line: 1,
			column: 2,
		},
		{
			code: `a:sOmE-pSeUdO-cLaSs { }`,
			fixed: `a:some-pseudo-class { }`,
			description: `the same in mixed case`,
			message: messages.expected(`:sOmE-pSeUdO-cLaSs`, `:some-pseudo-class`),
			line: 1,
			column: 2,
		},
		{
			code: `a:SOME-PSEUDO-CLASS { }`,
			fixed: `a:some-pseudo-class { }`,
			description: `the same in upper case`,
			message: messages.expected(`:SOME-PSEUDO-CLASS`, `:some-pseudo-class`),
			line: 1,
			column: 2,
		},
		{
			code: `:Some-pseudo-class { }`,
			fixed: `:some-pseudo-class { }`,
			description: `the same standing on its own`,
			message: messages.expected(`:Some-pseudo-class`, `:some-pseudo-class`),
			line: 1,
			column: 1,
		},
		{
			code: `:sOmE-pSeUdO-cLaSs { }`,
			fixed: `:some-pseudo-class { }`,
			description: `the same in mixed case`,
			message: messages.expected(`:sOmE-pSeUdO-cLaSs`, `:some-pseudo-class`),
			line: 1,
			column: 1,
		},
		{
			code: `:SOME-PSEUDO-CLASS { }`,
			fixed: `:some-pseudo-class { }`,
			description: `the same in upper case`,
			message: messages.expected(`:SOME-PSEUDO-CLASS`, `:some-pseudo-class`),
			line: 1,
			column: 1,
		},
		{
			code: `input[type=file]:Active::-webkit-file-upload-button { }`,
			fixed: `input[type=file]:active::-webkit-file-upload-button { }`,
			description: `a pseudo-class opening with a capital in front of a vendor-prefixed pseudo-element`,
			message: messages.expected(`:Active`, `:active`),
			line: 1,
			column: 17,
		},
		{
			code: `input[type=file]:Active::-WEBKIT-FILE-UPLOAD-BUTTON { }`,
			fixed: `input[type=file]:active::-WEBKIT-FILE-UPLOAD-BUTTON { }`,
			description: `the same with the pseudo-element in upper case`,
			message: messages.expected(`:Active`, `:active`),
			line: 1,
			column: 17,
		},
		{
			code: `:-Ms-input-placeholder { }`,
			fixed: `:-ms-input-placeholder { }`,
			description: `a vendor-prefixed pseudo-class opening with a capital`,
			message: messages.expected(`:-Ms-input-placeholder`, `:-ms-input-placeholder`),
			line: 1,
			column: 1,
		},
		{
			code: `:-mS-iNpUt-PlAcEhOlDer { }`,
			fixed: `:-ms-input-placeholder { }`,
			description: `the same in mixed case`,
			message: messages.expected(`:-mS-iNpUt-PlAcEhOlDer`, `:-ms-input-placeholder`),
			line: 1,
			column: 1,
		},
		{
			code: `:-MS-INPUT-PLACEHOLDER { }`,
			fixed: `:-ms-input-placeholder { }`,
			description: `the same in upper case`,
			message: messages.expected(`:-MS-INPUT-PLACEHOLDER`, `:-ms-input-placeholder`),
			line: 1,
			column: 1,
		},
		{
			code: `a::FIRST-LETTER, a:FIRST {color: pink;}`,
			fixed: `a::FIRST-LETTER, a:first {color: pink;}`,
			description: `an upper-case pseudo-class in the second selector of a list`,
			message: messages.expected(`:FIRST`, `:first`),
			line: 1,
			column: 19,
		},
		{
			code: `a::FIRST-LETTER:Hover, a:FIRST {color: pink;}`,
			fixed: `a::FIRST-LETTER:hover, a:first {color: pink;}`,
			description: `the same list with a pseudo-class opening with a capital in the first selector`,
			warnings: [
				{
					message: messages.expected(`:Hover`, `:hover`),
					line: 1,
					column: 16,
				},
				{
					message: messages.expected(`:FIRST`, `:first`),
					line: 1,
					column: 25,
				},
			],
		},
		{
			code: `a::FIRST-LETTER:Hover,/*comment*/ a:FIRST {color: pink;}`,
			fixed: `a::FIRST-LETTER:hover,/*comment*/ a:first {color: pink;}`,
			description: `the same list with a comment standing after the comma`,
			warnings: [
				{
					message: messages.expected(`:Hover`, `:hover`),
					line: 1,
					column: 16,
				},
				{
					message: messages.expected(`:FIRST`, `:first`),
					line: 1,
					column: 36,
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
			code: `a { color: pink; }`,
			description: `a selector with no pseudo-class`,
		},
		{
			code: `a:HOVER { color: pink; }`,
			description: `an upper-case pseudo-class`,
		},
		{
			code: `a:FOCUS { color: pink; }`,
			description: `another upper-case pseudo-class`,
		},
		{
			code: `a:before { color: pink; }`,
			description: `a pseudo-element written with one colon, which this rule leaves to the pseudo-element rules`,
		},
		{
			code: `a:BEFORE { color: pink; }`,
			description: `the same pseudo-element in upper case, left alone for the same reason`,
		},
		{
			code: `a:after { color: pink; }`,
			description: `another single-colon pseudo-element`,
		},
		{
			code: `a:AFTER { color: pink; }`,
			description: `the same in upper case`,
		},
		{
			code: `a:first-letter { color: pink; }`,
			description: `a single-colon pseudo-element of the first letter`,
		},
		{
			code: `a:FIRST-LETTER { color: pink; }`,
			description: `the same in upper case`,
		},
		{
			code: `a:first-line { color: pink; }`,
			description: `a single-colon pseudo-element of the first line`,
		},
		{
			code: `a:FIRST-LINE { color: pink; }`,
			description: `the same in upper case`,
		},
		{
			code: `a::before { color: pink; }`,
			description: `a pseudo-element written with two colons`,
		},
		{
			code: `a::BEFORE { color: pink; }`,
			description: `the same in upper case`,
		},
		{
			code: `a::some-pseudo-element { }`,
			description: `a pseudo-element no specification knows`,
		},
		{
			code: `a::SOME-PSEUDO-ELEMENT { }`,
			description: `the same in upper case`,
		},
		{
			code: `p:FIRST-CHILD:before { }`,
			description: `an upper-case pseudo-class followed by a single-colon pseudo-element`,
		},
		{
			code: `p:FIRST-CHILD:BEFORE { }`,
			description: `the same with the pseudo-element in upper case`,
		},
		{
			code: `h1:NOT(h2, h3) { }`,
			description: `a pseudo-class taking a selector list`,
		},
		{
			code: `p:NTH-CHILD(3n+0) { }`,
			description: `a pseudo-class taking a formula`,
		},
		{
			code: `p:NTH-CHILD(odd) { }`,
			description: `a pseudo-class taking a keyword`,
		},
		{
			code: `input::-moz-placeholder { color: pink; }`,
			description: `a vendor-prefixed pseudo-element`,
		},
		{
			code: `input::-MOZ-PLACEHOLDER { color: pink; }`,
			description: `the same in upper case`,
		},
		{
			code: `:ROOT { background: #ff0000; }`,
			description: `the root pseudo-class`,
		},
		{
			code: `a:SOME-PSEUDO-CLASS { }`,
			description: `a pseudo-class no specification knows`,
		},
		{
			code: `:SOME-PSEUDO-CLASS { }`,
			description: `the same standing on its own`,
		},
		{
			code: `input[type=file]:ACTIVE::-webkit-file-upload-button { }`,
			description: `a pseudo-class in front of a vendor-prefixed pseudo-element`,
		},
		{
			code: `input[type=file]:ACTIVE::-WEBKIT-FILE-UPLOAD-BUTTON { }`,
			description: `the same with the pseudo-element in upper case`,
		},
		{
			code: `:-MS-INPUT-PLACEHOLDER { }`,
			description: `a vendor-prefixed pseudo-class`,
		},
	],

	reject: [
		{
			code: `a:Hover { color: pink; }`,
			fixed: `a:HOVER { color: pink; }`,
			description: `a pseudo-class opening with a capital`,
			message: messages.expected(`:Hover`, `:HOVER`),
			line: 1,
			column: 2,
		},
		{
			code: `a:hOvEr { color: pink; }`,
			fixed: `a:HOVER { color: pink; }`,
			description: `the same in mixed case`,
			message: messages.expected(`:hOvEr`, `:HOVER`),
			line: 1,
			column: 2,
		},
		{
			code: `a:hover { color: pink; }`,
			fixed: `a:HOVER { color: pink; }`,
			description: `a pseudo-class in lower case`,
			message: messages.expected(`:hover`, `:HOVER`),
			line: 1,
			column: 2,
		},
		{
			code: `p:First-child:before { }`,
			fixed: `p:FIRST-CHILD:before { }`,
			description: `a pseudo-class opening with a capital, followed by a single-colon pseudo-element`,
			message: messages.expected(`:First-child`, `:FIRST-CHILD`),
			line: 1,
			column: 2,
		},
		{
			code: `p:First-child:BEFORE { }`,
			fixed: `p:FIRST-CHILD:BEFORE { }`,
			description: `the same with the pseudo-element in upper case`,
			message: messages.expected(`:First-child`, `:FIRST-CHILD`),
			line: 1,
			column: 2,
		},
		{
			code: `h1:Not(h2, h3) { }`,
			fixed: `h1:NOT(h2, h3) { }`,
			description: `a pseudo-class taking a selector list, opening with a capital`,
			message: messages.expected(`:Not`, `:NOT`),
			line: 1,
			column: 3,
		},
		{
			code: `h1:nOt(h2, h3) { }`,
			fixed: `h1:NOT(h2, h3) { }`,
			description: `the same in mixed case`,
			message: messages.expected(`:nOt`, `:NOT`),
			line: 1,
			column: 3,
		},
		{
			code: `h1:not(h2, h3) { }`,
			fixed: `h1:NOT(h2, h3) { }`,
			description: `the same in lower case`,
			message: messages.expected(`:not`, `:NOT`),
			line: 1,
			column: 3,
		},
		{
			code: `:Root { background: #ff0000; }`,
			fixed: `:ROOT { background: #ff0000; }`,
			description: `the root pseudo-class opening with a capital`,
			message: messages.expected(`:Root`, `:ROOT`),
			line: 1,
			column: 1,
		},
		{
			code: `:rOoT { background: #ff0000; }`,
			fixed: `:ROOT { background: #ff0000; }`,
			description: `the same in mixed case`,
			message: messages.expected(`:rOoT`, `:ROOT`),
			line: 1,
			column: 1,
		},
		{
			code: `:root { background: #ff0000; }`,
			fixed: `:ROOT { background: #ff0000; }`,
			description: `the same in lower case`,
			message: messages.expected(`:root`, `:ROOT`),
			line: 1,
			column: 1,
		},
		{
			code: `a:Some-pseudo-class { }`,
			fixed: `a:SOME-PSEUDO-CLASS { }`,
			description: `a pseudo-class no specification knows, opening with a capital`,
			message: messages.expected(`:Some-pseudo-class`, `:SOME-PSEUDO-CLASS`),
			line: 1,
			column: 2,
		},
		{
			code: `a:sOmE-pSeUdO-cLaSs { }`,
			fixed: `a:SOME-PSEUDO-CLASS { }`,
			description: `the same in mixed case`,
			message: messages.expected(`:sOmE-pSeUdO-cLaSs`, `:SOME-PSEUDO-CLASS`),
			line: 1,
			column: 2,
		},
		{
			code: `a:some-pseudo-class { }`,
			fixed: `a:SOME-PSEUDO-CLASS { }`,
			description: `the same in lower case`,
			message: messages.expected(`:some-pseudo-class`, `:SOME-PSEUDO-CLASS`),
			line: 1,
			column: 2,
		},
		{
			code: `:Some-pseudo-class { }`,
			fixed: `:SOME-PSEUDO-CLASS { }`,
			description: `the same standing on its own`,
			message: messages.expected(`:Some-pseudo-class`, `:SOME-PSEUDO-CLASS`),
			line: 1,
			column: 1,
		},
		{
			code: `:sOmE-pSeUdO-cLaSs { }`,
			fixed: `:SOME-PSEUDO-CLASS { }`,
			description: `the same in mixed case`,
			message: messages.expected(`:sOmE-pSeUdO-cLaSs`, `:SOME-PSEUDO-CLASS`),
			line: 1,
			column: 1,
		},
		{
			code: `:some-pseudo-class { }`,
			fixed: `:SOME-PSEUDO-CLASS { }`,
			description: `the same in lower case`,
			message: messages.expected(`:some-pseudo-class`, `:SOME-PSEUDO-CLASS`),
			line: 1,
			column: 1,
		},
		{
			code: `input[type=file]:Active::-webkit-file-upload-button { }`,
			fixed: `input[type=file]:ACTIVE::-webkit-file-upload-button { }`,
			description: `a pseudo-class opening with a capital in front of a vendor-prefixed pseudo-element`,
			message: messages.expected(`:Active`, `:ACTIVE`),
			line: 1,
			column: 17,
		},
		{
			code: `input[type=file]:Active::-WEBKIT-FILE-UPLOAD-BUTTON { }`,
			fixed: `input[type=file]:ACTIVE::-WEBKIT-FILE-UPLOAD-BUTTON { }`,
			description: `the same with the pseudo-element in upper case`,
			message: messages.expected(`:Active`, `:ACTIVE`),
			line: 1,
			column: 17,
		},
		{
			code: `:-Ms-input-placeholder { }`,
			fixed: `:-MS-INPUT-PLACEHOLDER { }`,
			description: `a vendor-prefixed pseudo-class opening with a capital`,
			message: messages.expected(`:-Ms-input-placeholder`, `:-MS-INPUT-PLACEHOLDER`),
			line: 1,
			column: 1,
		},
		{
			code: `:-mS-iNpUt-PlAcEhOlDer { }`,
			fixed: `:-MS-INPUT-PLACEHOLDER { }`,
			description: `the same in mixed case`,
			message: messages.expected(`:-mS-iNpUt-PlAcEhOlDer`, `:-MS-INPUT-PLACEHOLDER`),
			line: 1,
			column: 1,
		},
		{
			code: `:-ms-input-placeholder { }`,
			fixed: `:-MS-INPUT-PLACEHOLDER { }`,
			description: `the same in lower case`,
			message: messages.expected(`:-ms-input-placeholder`, `:-MS-INPUT-PLACEHOLDER`),
			line: 1,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [`lower`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `:#{$variable} {}`,
			description: `a pseudo-class built by interpolation`,
		},
		{
			code: `:#{$VARIABLE} {}`,
			description: `the same interpolation written in upper case`,
		},
		{
			code: `a:#{$variable} {}`,
			description: `the same interpolation behind a type selector`,
		},
	],
})

testRule({
	ruleName,
	config: [`upper`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `:#{$variable} {}`,
			description: `a pseudo-class built by interpolation`,
		},
		{
			code: `:#{$VARIABLE} {}`,
			description: `the same interpolation written in upper case`,
		},
		{
			code: `a:#{$variable} {}`,
			description: `the same interpolation behind a type selector`,
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
			code: `.a // c\nb:HOVER {}`,
			fixed: `.a // c\nb:hover {}`,
			description: `a selector carrying an inline comment, whose fix reaches the copy the file spells, reported in the file's own coordinates`,
			message: messages.expected(`:HOVER`, `:hover`),
			line: 2,
			column: 2,
		},
	],
})
