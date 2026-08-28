import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/208
		{
			description: `a comment closing the block behind a declaration without a semicolon, which has no semicolon to space`,
			code: `a { color: pink /* c */ }`,
		},
		{
			description: `two comments closing the block behind a declaration without a semicolon`,
			code: `
				a {
					color: pink
					/* c */
					/* d */
				}
			`,
		},
		{
			description: `a declaration at the top level of the file, outside any block`,
			code: `color: pink ;`,
		},
		{
			description: `a space in front of the semicolon`,
			code: `a { color: pink ; }`,
		},
		{
			description: `a semicolon standing in a string, which closes no declaration`,
			code: `a::before { content: ";a" ; }`,
		},
		{
			description: `two declarations, each with the space in front of its semicolon`,
			code: `a { color: pink ; top: 0 ; }`,
		},
		{
			description: `a last declaration carrying no semicolon at all`,
			code: `a { color: pink ; top: 0}`,
		},
		{
			description: `a flag in front of the semicolon, with the space between them`,
			code: `a { width: 50% !important ;}`,
		},
		{
			description: `a custom property whose value is nothing but whitespace, which is its value rather than the space this rule asks for`,
			code: `a { --foo: ; }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/208
			description: `a nested rule closing the block, whose declaration keeps its semicolon and is still measured`,
			code: `a { color: pink; b {} }`,
			fixed: `a { color: pink ; b {} }`,
			line: 1,
			column: 15,
			message: messages.expectedBefore(),
		},
		{
			description: `a semicolon abutting the value`,
			code: `a { color: pink; }`,
			fixed: `a { color: pink ; }`,
			line: 1,
			column: 15,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces where one belongs`,
			code: `a { color: pink  ; }`,
			fixed: `a { color: pink ; }`,
			line: 1,
			column: 17,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab where the space belongs`,
			code: `a { color: pink\t; }`,
			fixed: `a { color: pink ; }`,
			line: 1,
			column: 16,
			message: messages.expectedBefore(),
		},
		{
			description: `a break where the space belongs`,
			code: `a { color: pink\n; }`,
			fixed: `a { color: pink ; }`,
			line: 1,
			column: 16,
			message: messages.expectedBefore(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink\r\n; }`,
			fixed: `a { color: pink ; }`,
			line: 1,
			column: 17,
			message: messages.expectedBefore(),
		},
		{
			description: `the second of two declarations abutting its semicolon`,
			code: `a { color: pink ; top: 0; }`,
			fixed: `a { color: pink ; top: 0 ; }`,
			line: 1,
			column: 24,
			message: messages.expectedBefore(),
		},
		{
			description: `a comment abutting the semicolon`,
			code: `a { color: pink/*comment*/; }`,
			fixed: `a { color: pink/*comment*/ ; }`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
		{
			description: `the same comment behind a space`,
			code: `a { color: pink /*comment*/; }`,
			fixed: `a { color: pink /*comment*/ ; }`,
			line: 1,
			column: 27,
			message: messages.expectedBefore(),
		},
		{
			description: `a flag abutting the semicolon`,
			code: `a { width: 50% !important; }`,
			fixed: `a { width: 50% !important ; }`,
			line: 1,
			column: 25,
			message: messages.expectedBefore(),
		},
		{
			description: `a custom property with no value at all, whose semicolon abuts the colon`,
			code: `a { --foo:; }`,
			fixed: `a { --foo: ; }`,
			line: 1,
			column: 10,
			message: messages.expectedBefore(),
		},
		{
			description: `important on a line of its own, which the fix leaves where it stands`,
			code: `a { color: pink\n!important; }`,
			fixed: `a { color: pink\n!important ; }`,
			line: 2,
			column: 10,
			message: messages.expectedBefore(),
		},
		{
			description: `unquoted URL, its double slash opening no comment`,
			code: `a { background: url(http://foo.bar/a.png)\n; }`,
			fixed: `a { background: url(http://foo.bar/a.png) ; }`,
			line: 1,
			column: 42,
			message: messages.expectedBefore(),
		},
		{
			description: `string holding a double slash`,
			code: `a::before { content: "//"\n; }`,
			fixed: `a::before { content: "//" ; }`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a declaration at the top level of the file, outside any block`,
			code: `color: pink;`,
		},
		{
			description: `a semicolon abutting the value`,
			code: `a { color: pink; }`,
		},
		{
			description: `a semicolon standing in a string, which closes no declaration`,
			code: `a::before { content: ";a"; }`,
		},
		{
			description: `two declarations, each abutting its semicolon`,
			code: `a { color: pink; top: 0; }`,
		},
		{
			description: `a flag abutting the semicolon`,
			code: `a { width: 50% !important;}`,
		},
		{
			// Valid because of `never` option
			description: `a custom property with no value at all`,
			code: `a { --foo:; }`,
		},
		{
			// A custom property may hold nothing but whitespace, and that whitespace is its value rather than the space in front of the semicolon
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50
			description: `a custom property whose value is nothing but whitespace`,
			code: `a { --foo: ; }`,
		},
	],

	reject: [
		{
			description: `a space in front of the semicolon`,
			code: `a { color: pink ; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 16,
			message: messages.rejectedBefore(),
		},
		{
			description: `two spaces in front of the semicolon`,
			code: `a { color: pink  ; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 17,
			message: messages.rejectedBefore(),
		},
		{
			description: `a tab in front of the semicolon`,
			code: `a { color: pink\t; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 16,
			message: messages.rejectedBefore(),
		},
		{
			description: `a break in front of the semicolon`,
			code: `a { color: pink\n; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 16,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink\r\n; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 17,
			message: messages.rejectedBefore(),
		},
		{
			description: `the second of two declarations carrying the space`,
			code: `a { color: pink; top: 0 ; }`,
			fixed: `a { color: pink; top: 0; }`,
			line: 1,
			column: 24,
			message: messages.rejectedBefore(),
		},
		{
			description: `a comment behind a space, with the semicolon behind the comment`,
			code: `a { color: pink/*comment*/ ; }`,
			fixed: `a { color: pink/*comment*/; }`,
			line: 1,
			column: 27,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same comment standing behind another space`,
			code: `a { color: pink /*comment*/ ; }`,
			fixed: `a { color: pink /*comment*/; }`,
			line: 1,
			column: 28,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space between the flag and the semicolon`,
			code: `a { width: 50% !important ; }`,
			fixed: `a { width: 50% !important; }`,
			line: 1,
			column: 26,
			message: messages.rejectedBefore(),
		},
		{
			description: `five spaces between the flag and the semicolon`,
			code: `a { width: 50% !important     ; }`,
			fixed: `a { width: 50% !important; }`,
			line: 1,
			column: 30,
			message: messages.rejectedBefore(),
		},
		{
			description: `a custom property whose whitespace value is trimmed to the single space the safe option leaves`,
			code: `a { --foo:      ; }`,
			fixed: `a { --foo: ; }`,
			line: 1,
			column: 16,
			message: messages.rejectedBefore(),
		},
		{
			description: `unquoted URL, its double slash opening no comment`,
			code: `a { background: url(http://foo.bar/a.png)\n; }`,
			fixed: `a { background: url(http://foo.bar/a.png); }`,
			line: 1,
			column: 42,
			message: messages.rejectedBefore(),
		},
		{
			description: `string holding a double slash`,
			code: `a::before { content: "//"\n; }`,
			fixed: `a::before { content: "//"; }`,
			line: 1,
			column: 26,
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			description: `a double slash of plain CSS opens no comment, so the semicolon has a line to join and the fix is written`,
			code: `
				a {
					b: 1px//c
					;
				}
			`,
			fixed: `
				a {
					b: 1px//c;
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			description: `a declaration at the top level of the file, outside any block`,
			code: `color: pink ;`,
		},
		{
			description: `a space in front of the semicolon of a single-line block`,
			code: `a { color: pink ; }`,
		},
		{
			description: `a semicolon standing in a string, in a single-line block`,
			code: `a::before { content: ";a" ; }`,
		},
		{
			description: `two declarations, each with the space`,
			code: `a { color: pink ; top: 0 ; }`,
		},
		{
			description: `a selector broken across lines, whose block is single-line all the same`,
			code: `a,\nb { color: pink ; top: 0 ; }`,
		},
		{
			description: `a multi-line block, which this option passes over`,
			code: `
				a {
				  color: pink;
				  top: 0;
				}
			`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a {\r\n  color: pink;\r\n  top: 0;\r\n}`,
		},
		{
			description: `a flag in front of the semicolon of a single-line block`,
			code: `a { width: 50% !important ; }`,
		},
		{
			description: `the same flag in a multi-line block, which this option passes over`,
			code: `
				a {
				  width: 50% !important;
				}
			`,
		},
		{
			description: `a custom property whose value is whitespace, in a single-line block`,
			code: `a { --foo: ; }`,
		},
		{
			description: `the same custom property in a multi-line block`,
			code: `
				a {
				  --foo: ;
				}
			`,
		},
	],

	reject: [
		{
			description: `a semicolon abutting the value of a single-line block`,
			code: `a { color: pink; }`,
			fixed: `a { color: pink ; }`,
			line: 1,
			column: 15,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `the same block under a selector broken across lines`,
			code: `a,\nb { color: pink; }`,
			fixed: `a,\nb { color: pink ; }`,
			line: 2,
			column: 15,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `the same selector broken with a carriage return`,
			code: `a,\r\nb { color: pink; }`,
			fixed: `a,\r\nb { color: pink ; }`,
			line: 2,
			column: 15,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `two spaces in front of the semicolon`,
			code: `a { color: pink  ; }`,
			fixed: `a { color: pink ; }`,
			line: 1,
			column: 17,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `a tab in front of the semicolon`,
			code: `a { color: pink\t; }`,
			fixed: `a { color: pink ; }`,
			line: 1,
			column: 16,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `the second of two declarations abutting its semicolon`,
			code: `a { color: pink ; top: 0; }`,
			fixed: `a { color: pink ; top: 0 ; }`,
			line: 1,
			column: 24,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `a flag abutting the semicolon of a single-line block`,
			code: `a { width: 50% !important; }`,
			fixed: `a { width: 50% !important ; }`,
			line: 1,
			column: 25,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `a custom property with no value at all, in a single-line block`,
			code: `a { --foo:; }`,
			fixed: `a { --foo: ; }`,
			line: 1,
			column: 10,
			message: messages.expectedBeforeSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `a declaration at the top level of the file, outside any block`,
			code: `color: pink;`,
		},
		{
			description: `a semicolon abutting the value of a single-line block`,
			code: `a { color: pink; }`,
		},
		{
			description: `a semicolon standing in a string, in a single-line block`,
			code: `a::before { content: ";a"; }`,
		},
		{
			description: `two declarations, each abutting its semicolon`,
			code: `a { color: pink; top: 0; }`,
		},
		{
			description: `a selector broken across lines, whose block is single-line all the same`,
			code: `a,\nb { color: pink; top: 0; }`,
		},
		{
			description: `a multi-line block, which this option passes over`,
			code: `
				a {
				  color: pink ;
				  top: 0 ;
				}
			`,
		},
		{
			description: `a flag abutting the semicolon of a single-line block`,
			code: `a { width: 50% !important; }`,
		},
		{
			description: `the same flag spaced from it in a multi-line block, which this option passes over`,
			code: `
				a {
				  width: 50% !important ;
				}
			`,
		},
		{
			// Valid because of `never-single-line` option
			description: `a custom property with no value at all, in a single-line block`,
			code: `a { --foo:; }`,
		},
		{
			// A custom property may hold nothing but whitespace, and that whitespace is its value rather than the space in front of the semicolon
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50
			description: `a custom property whose value is whitespace, in a single-line block`,
			code: `a { --foo: ; }`,
		},
		{
			// Not checked because of multiline declaration
			description: `the same pair of custom properties in a multi-line block`,
			code: `
				a {
				  --foo: ;
				  --bar:;
				}
			`,
		},
	],

	reject: [
		{
			description: `a space in front of the semicolon of a single-line block`,
			code: `a { color: pink ; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 16,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same block under a selector broken across lines`,
			code: `a,\nb { color: pink ; }`,
			fixed: `a,\nb { color: pink; }`,
			line: 2,
			column: 16,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same selector broken with a carriage return`,
			code: `a,\r\nb { color: pink ; }`,
			fixed: `a,\r\nb { color: pink; }`,
			line: 2,
			column: 16,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `two spaces in front of the semicolon`,
			code: `a { color: pink  ; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 17,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `a tab in front of the semicolon`,
			code: `a { color: pink\t; }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 16,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the second of two declarations carrying the space`,
			code: `a { color: pink; top: 0 ; }`,
			fixed: `a { color: pink; top: 0; }`,
			line: 1,
			column: 24,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `a space between the flag and the semicolon`,
			code: `a { width: 50% !important ; }`,
			fixed: `a { width: 50% !important; }`,
			line: 1,
			column: 26,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `five spaces between the flag and the semicolon`,
			code: `a { width: 50% !important     ; }`,
			fixed: `a { width: 50% !important; }`,
			line: 1,
			column: 30,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `a custom property whose whitespace value is trimmed to the single space the safe option leaves`,
			code: `a { --foo:      ; }`,
			fixed: `a { --foo: ; }`,
			line: 1,
			column: 16,
			message: messages.rejectedBeforeSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/117
			description: `inline comment before the semicolon: the semicolon cannot join the comment's line, so the code is left alone and the warning stands`,
			code: `
				a {
					color: red // keep me
					;
				}
			`,
			fixed: `
				a {
					color: red // keep me
					;
				}
			`,
			line: 3,
			column: 3,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/117
			description: `inline comment behind the flag: the semicolon cannot join its line either`,
			code: `
				a {
					color: red !important // keep me
					;
				}
			`,
			fixed: `
				a {
					color: red !important // keep me
					;
				}
			`,
			line: 3,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/117
			description: `inline comment in front of the flag: the space goes behind the flag, and the comment stays where it is`,
			code: `
				a {
					color: red // keep me
						!important;
				}
			`,
			fixed: `
				a {
					color: red // keep me
						!important ;
				}
			`,
			line: 3,
			column: 14,
			message: messages.expectedBefore(),
		},
		{
			description: `block comment behind the flag: nothing of it depends on a line break, so the fix goes through`,
			code: `
				a {
					color: red !important /* keep me */
					;
				}
			`,
			fixed: `
				a {
					color: red !important /* keep me */ ;
				}
			`,
			line: 3,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/211
			// The column a declaration carrying an inline comment is measured at is what #139 is about, so none of these cases asserts one
			description: `a flag standing in the text of the comment, which this syntax reads as comment text and no flag of its own — the twin of the Less case below, where the guard used to let the fix through`,
			code: `
				a {
					color: red // c !important
					;
				}
			`,
			fixed: `
				a {
					color: red // c !important
					;
				}
			`,
			line: 3,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/117
			description: `inline comment before the semicolon: the semicolon cannot join the comment's line, so the code is left alone and the warning stands`,
			code: `
				a {
					color: red // keep me
					;
				}
			`,
			fixed: `
				a {
					color: red // keep me
					;
				}
			`,
			line: 3,
			column: 3,
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/117
			description: `inline comment behind the flag: the semicolon cannot join its line either`,
			code: `
				a {
					color: red !important // keep me
					;
				}
			`,
			fixed: `
				a {
					color: red !important // keep me
					;
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `inline comment in front of the flag: the whitespace behind the flag is what goes, and the comment stays where it is`,
			code: `
				a {
					color: red // keep me
						!important
					;
				}
			`,
			fixed: `
				a {
					color: red // keep me
						!important;
				}
			`,
			line: 4,
			column: 3,
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/211
			// The column a declaration carrying an inline comment is measured at is what #139 is about, so none of these cases asserts one
			description: `a flag standing in the text of the comment, which this syntax reads as comment text and no flag of its own — the twin of the Less case below, where the guard used to let the fix through`,
			code: `
				a {
					color: red // c !important
					;
				}
			`,
			fixed: `
				a {
					color: red // c !important
					;
				}
			`,
			line: 3,
			message: messages.rejectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/117
			description: `inline comment before the semicolon: the semicolon cannot join the comment's line, so the code is left alone and the warning stands`,
			code: `
				a {
					color: red // keep me
					;
				}
			`,
			fixed: `
				a {
					color: red // keep me
					;
				}
			`,
			line: 3,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/117
			description: `inline comment in front of the flag: the space goes behind the flag, and the comment stays where it is`,
			code: `
				a {
					color: red // keep me
						!important;
				}
			`,
			fixed: `
				a {
					color: red // keep me
						!important ;
				}
			`,
			line: 3,
			column: 12,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/211
			// The column a declaration carrying an inline comment is measured at is what #139 is about, so none of these cases asserts one
			description: `a flag standing in the text of the comment, which Less reads as comment text while the parser reads it as the flag — the value and the flag's raw together show the comment running on to the semicolon`,
			code: `
				a {
					color: red // c !important
					;
				}
			`,
			fixed: `
				a {
					color: red // c !important
					;
				}
			`,
			line: 3,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/211
			// The column a declaration carrying an inline comment is measured at is what #139 is about, so none of these cases asserts one
			description: `the same flag with the semicolon already standing on the comment's line, which the parser keeps no raw of, so the value alone shows the comment`,
			code: `
				a {
					color: red // c !important;
				}
			`,
			fixed: `
				a {
					color: red // c !important;
				}
			`,
			line: 2,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/333
			description: `a form feed inside an inline comment, which is whitespace and no line break, so the semicolon stands in the comment's text and the value is left alone`,
			code: `a { b: 1px // c\f\t2px; }`,
			fixed: `a { b: 1px // c\f\t2px; }`,
			line: 1,
			column: 20,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/117
			description: `inline comment before the semicolon: the semicolon cannot join the comment's line, so the code is left alone and the warning stands`,
			code: `
				a {
					color: red // keep me
					;
				}
			`,
			fixed: `
				a {
					color: red // keep me
					;
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/211
			// The column a declaration carrying an inline comment is measured at is what #139 is about, so none of these cases asserts one
			description: `a flag standing in the text of the comment, which Less reads as comment text while the parser reads it as the flag — the value and the flag's raw together show the comment running on to the semicolon`,
			code: `
				a {
					color: red // c !important
					;
				}
			`,
			fixed: `
				a {
					color: red // c !important
					;
				}
			`,
			line: 3,
			message: messages.rejectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-html`,

	accept: [
		{
			description: `a style attribute whose semicolons abut their declarations`,
			code: `<div style="color: pink;top: 0;">x</div>`,
		},
		{
			description: `a style attribute with no semicolon in it at all`,
			code: `<div style="color: pink">x</div>`,
		},
		{
			description: `an empty style attribute`,
			code: `<div style="">x</div>`,
		},
		{
			description: `a style binding, which is no style attribute`,
			code: `<span :style="{ color: 'pink' }">x</span>`,
		},
		{
			description: `Sass variables at the top level of a style element, which are no declaration block`,
			code: `<style lang="scss">$a: 1 ;$b: 2 ;</style>`,
		},
	],

	reject: [
		{
			description: `a style attribute with a space in front of its first semicolon`,
			code: `<div style="color: pink ;top: 0;">x</div>`,
			fixed: `<div style="color: pink;top: 0;">x</div>`,
			line: 1,
			column: 24,
			message: messages.rejectedBefore(),
		},
		{
			description: `a style attribute and a style element in one document`,
			code: `
				<div style="color: pink ;top: 0;">x</div>
				<style>a { color: pink ;top: 0; }</style>
			`,
			fixed: `
				<div style="color: pink;top: 0;">x</div>
				<style>a { color: pink;top: 0; }</style>
			`,
			warnings: [
				{
					line: 1,
					column: 24,
					message: messages.rejectedBefore(),
				},
				{
					line: 2,
					column: 23,
					message: messages.rejectedBefore(),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `Sass variables at the top level of a file, which are no declaration block`,
			code: `$a: 1 ;$b: 2 ;`,
		},
	],
})
