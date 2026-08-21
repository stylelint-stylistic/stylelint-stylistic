import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/208
		{
			code: `a { color: pink /* c */ }`,
			description: `a comment closing the block behind a declaration without a semicolon, which has no semicolon to space`,
		},
		{
			code: `
				a {
					color: pink
					/* c */
					/* d */
				}
			`,
			description: `two comments closing the block behind a declaration without a semicolon`,
		},
		{
			code: `color: pink ;`,
			description: `a declaration at the top level of the file, outside any block`,
		},
		{
			code: `a { color: pink ; }`,
			description: `a space in front of the semicolon`,
		},
		{
			code: `a::before { content: ";a" ; }`,
			description: `a semicolon standing in a string, which closes no declaration`,
		},
		{
			code: `a { color: pink ; top: 0 ; }`,
			description: `two declarations, each with the space in front of its semicolon`,
		},
		{
			code: `a { color: pink ; top: 0}`,
			description: `a last declaration carrying no semicolon at all`,
		},
		{
			code: `a { width: 50% !important ;}`,
			description: `a flag in front of the semicolon, with the space between them`,
		},
		{
			code: `a { --foo: ; }`,
			description: `a custom property whose value is nothing but whitespace, which is its value rather than the space this rule asks for`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/208
			code: `a { color: pink; b {} }`,
			fixed: `a { color: pink ; b {} }`,
			description: `a nested rule closing the block, whose declaration keeps its semicolon and is still measured`,
			message: messages.expectedBefore(),
			line: 1,
			column: 15,
		},
		{
			code: `a { color: pink; }`,
			fixed: `a { color: pink ; }`,
			description: `a semicolon abutting the value`,
			message: messages.expectedBefore(),
			line: 1,
			column: 15,
		},
		{
			code: `a { color: pink  ; }`,
			fixed: `a { color: pink ; }`,
			description: `two spaces where one belongs`,
			message: messages.expectedBefore(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink\t; }`,
			fixed: `a { color: pink ; }`,
			description: `a tab where the space belongs`,
			message: messages.expectedBefore(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink\n; }`,
			fixed: `a { color: pink ; }`,
			description: `a break where the space belongs`,
			message: messages.expectedBefore(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink\r\n; }`,
			fixed: `a { color: pink ; }`,
			description: `the same break spelled with a carriage return`,
			message: messages.expectedBefore(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink ; top: 0; }`,
			fixed: `a { color: pink ; top: 0 ; }`,
			description: `the second of two declarations abutting its semicolon`,
			message: messages.expectedBefore(),
			line: 1,
			column: 24,
		},
		{
			code: `a { color: pink/*comment*/; }`,
			fixed: `a { color: pink/*comment*/ ; }`,
			description: `a comment abutting the semicolon`,
			message: messages.expectedBefore(),
			line: 1,
			column: 26,
		},
		{
			code: `a { color: pink /*comment*/; }`,
			fixed: `a { color: pink /*comment*/ ; }`,
			description: `the same comment behind a space`,
			message: messages.expectedBefore(),
			line: 1,
			column: 27,
		},
		{
			code: `a { width: 50% !important; }`,
			fixed: `a { width: 50% !important ; }`,
			description: `a flag abutting the semicolon`,
			message: messages.expectedBefore(),
			line: 1,
			column: 25,
		},
		{
			code: `a { --foo:; }`,
			fixed: `a { --foo: ; }`,
			description: `a custom property with no value at all, whose semicolon abuts the colon`,
			message: messages.expectedBefore(),
			line: 1,
			column: 10,
		},
		{
			code: `a { color: pink\n!important; }`,
			fixed: `a { color: pink\n!important ; }`,
			description: `important on a line of its own, which the fix leaves where it stands`,
			message: messages.expectedBefore(),
			line: 2,
			column: 10,
		},
		{
			code: `a { background: url(http://foo.bar/a.png)\n; }`,
			fixed: `a { background: url(http://foo.bar/a.png) ; }`,
			description: `unquoted URL, its double slash opening no comment`,
			message: messages.expectedBefore(),
			line: 1,
			column: 42,
		},
		{
			code: `a::before { content: "//"\n; }`,
			fixed: `a::before { content: "//" ; }`,
			description: `string holding a double slash`,
			message: messages.expectedBefore(),
			line: 1,
			column: 26,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `color: pink;`,
			description: `a declaration at the top level of the file, outside any block`,
		},
		{
			code: `a { color: pink; }`,
			description: `a semicolon abutting the value`,
		},
		{
			code: `a::before { content: ";a"; }`,
			description: `a semicolon standing in a string, which closes no declaration`,
		},
		{
			code: `a { color: pink; top: 0; }`,
			description: `two declarations, each abutting its semicolon`,
		},
		{
			code: `a { width: 50% !important;}`,
			description: `a flag abutting the semicolon`,
		},
		{
			// Valid because of `never` option
			code: `a { --foo:; }`,
			description: `a custom property with no value at all`,
		},
		{
			// A custom property may hold nothing but whitespace, and that whitespace is its value rather than the space in front of the semicolon
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50
			code: `a { --foo: ; }`,
			description: `a custom property whose value is nothing but whitespace`,
		},
	],

	reject: [
		{
			code: `a { color: pink ; }`,
			fixed: `a { color: pink; }`,
			description: `a space in front of the semicolon`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink  ; }`,
			fixed: `a { color: pink; }`,
			description: `two spaces in front of the semicolon`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink\t; }`,
			fixed: `a { color: pink; }`,
			description: `a tab in front of the semicolon`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink\n; }`,
			fixed: `a { color: pink; }`,
			description: `a break in front of the semicolon`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink\r\n; }`,
			fixed: `a { color: pink; }`,
			description: `the same break spelled with a carriage return`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink; top: 0 ; }`,
			fixed: `a { color: pink; top: 0; }`,
			description: `the second of two declarations carrying the space`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 24,
		},
		{
			code: `a { color: pink/*comment*/ ; }`,
			fixed: `a { color: pink/*comment*/; }`,
			description: `a comment behind a space, with the semicolon behind the comment`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 27,
		},
		{
			code: `a { color: pink /*comment*/ ; }`,
			fixed: `a { color: pink /*comment*/; }`,
			description: `the same comment standing behind another space`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 28,
		},
		{
			code: `a { width: 50% !important ; }`,
			fixed: `a { width: 50% !important; }`,
			description: `a space between the flag and the semicolon`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 26,
		},
		{
			code: `a { width: 50% !important     ; }`,
			fixed: `a { width: 50% !important; }`,
			description: `five spaces between the flag and the semicolon`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 30,
		},
		{
			code: `a { --foo:      ; }`,
			fixed: `a { --foo: ; }`,
			description: `a custom property whose whitespace value is trimmed to the single space the safe option leaves`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 16,
		},
		{
			code: `a { background: url(http://foo.bar/a.png)\n; }`,
			fixed: `a { background: url(http://foo.bar/a.png); }`,
			description: `unquoted URL, its double slash opening no comment`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 42,
		},
		{
			code: `a::before { content: "//"\n; }`,
			fixed: `a::before { content: "//"; }`,
			description: `string holding a double slash`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 26,
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
			message: messages.rejectedBefore(),
			line: 3,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			code: `color: pink ;`,
			description: `a declaration at the top level of the file, outside any block`,
		},
		{
			code: `a { color: pink ; }`,
			description: `a space in front of the semicolon of a single-line block`,
		},
		{
			code: `a::before { content: ";a" ; }`,
			description: `a semicolon standing in a string, in a single-line block`,
		},
		{
			code: `a { color: pink ; top: 0 ; }`,
			description: `two declarations, each with the space`,
		},
		{
			code: `a,\nb { color: pink ; top: 0 ; }`,
			description: `a selector broken across lines, whose block is single-line all the same`,
		},
		{
			code: `
				a {
				  color: pink;
				  top: 0;
				}
			`,
			description: `a multi-line block, which this option passes over`,
		},
		{
			code: `a {\r\n  color: pink;\r\n  top: 0;\r\n}`,
			description: `the same block spelled with carriage returns`,
		},
		{
			code: `a { width: 50% !important ; }`,
			description: `a flag in front of the semicolon of a single-line block`,
		},
		{
			code: `
				a {
				  width: 50% !important;
				}
			`,
			description: `the same flag in a multi-line block, which this option passes over`,
		},
		{
			code: `a { --foo: ; }`,
			description: `a custom property whose value is whitespace, in a single-line block`,
		},
		{
			code: `
				a {
				  --foo: ;
				}
			`,
			description: `the same custom property in a multi-line block`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }`,
			fixed: `a { color: pink ; }`,
			description: `a semicolon abutting the value of a single-line block`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 15,
		},
		{
			code: `a,\nb { color: pink; }`,
			fixed: `a,\nb { color: pink ; }`,
			description: `the same block under a selector broken across lines`,
			message: messages.expectedBeforeSingleLine(),
			line: 2,
			column: 15,
		},
		{
			code: `a,\r\nb { color: pink; }`,
			fixed: `a,\r\nb { color: pink ; }`,
			description: `the same selector broken with a carriage return`,
			message: messages.expectedBeforeSingleLine(),
			line: 2,
			column: 15,
		},
		{
			code: `a { color: pink  ; }`,
			fixed: `a { color: pink ; }`,
			description: `two spaces in front of the semicolon`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink\t; }`,
			fixed: `a { color: pink ; }`,
			description: `a tab in front of the semicolon`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink ; top: 0; }`,
			fixed: `a { color: pink ; top: 0 ; }`,
			description: `the second of two declarations abutting its semicolon`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 24,
		},
		{
			code: `a { width: 50% !important; }`,
			fixed: `a { width: 50% !important ; }`,
			description: `a flag abutting the semicolon of a single-line block`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 25,
		},
		{
			code: `a { --foo:; }`,
			fixed: `a { --foo: ; }`,
			description: `a custom property with no value at all, in a single-line block`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 10,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			code: `color: pink;`,
			description: `a declaration at the top level of the file, outside any block`,
		},
		{
			code: `a { color: pink; }`,
			description: `a semicolon abutting the value of a single-line block`,
		},
		{
			code: `a::before { content: ";a"; }`,
			description: `a semicolon standing in a string, in a single-line block`,
		},
		{
			code: `a { color: pink; top: 0; }`,
			description: `two declarations, each abutting its semicolon`,
		},
		{
			code: `a,\nb { color: pink; top: 0; }`,
			description: `a selector broken across lines, whose block is single-line all the same`,
		},
		{
			code: `
				a {
				  color: pink ;
				  top: 0 ;
				}
			`,
			description: `a multi-line block, which this option passes over`,
		},
		{
			code: `a { width: 50% !important; }`,
			description: `a flag abutting the semicolon of a single-line block`,
		},
		{
			code: `
				a {
				  width: 50% !important ;
				}
			`,
			description: `the same flag spaced from it in a multi-line block, which this option passes over`,
		},
		{
			// Valid because of `never-single-line` option
			code: `a { --foo:; }`,
			description: `a custom property with no value at all, in a single-line block`,
		},
		{
			// A custom property may hold nothing but whitespace, and that whitespace is its value rather than the space in front of the semicolon
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50
			code: `a { --foo: ; }`,
			description: `a custom property whose value is whitespace, in a single-line block`,
		},
		{
			// Not checked because of multiline declaration
			code: `
				a {
				  --foo: ;
				  --bar:;
				}
			`,
			description: `the same pair of custom properties in a multi-line block`,
		},
	],

	reject: [
		{
			code: `a { color: pink ; }`,
			fixed: `a { color: pink; }`,
			description: `a space in front of the semicolon of a single-line block`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 16,
		},
		{
			code: `a,\nb { color: pink ; }`,
			fixed: `a,\nb { color: pink; }`,
			description: `the same block under a selector broken across lines`,
			message: messages.rejectedBeforeSingleLine(),
			line: 2,
			column: 16,
		},
		{
			code: `a,\r\nb { color: pink ; }`,
			fixed: `a,\r\nb { color: pink; }`,
			description: `the same selector broken with a carriage return`,
			message: messages.rejectedBeforeSingleLine(),
			line: 2,
			column: 16,
		},
		{
			code: `a { color: pink  ; }`,
			fixed: `a { color: pink; }`,
			description: `two spaces in front of the semicolon`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink\t; }`,
			fixed: `a { color: pink; }`,
			description: `a tab in front of the semicolon`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink; top: 0 ; }`,
			fixed: `a { color: pink; top: 0; }`,
			description: `the second of two declarations carrying the space`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 24,
		},
		{
			code: `a { width: 50% !important ; }`,
			fixed: `a { width: 50% !important; }`,
			description: `a space between the flag and the semicolon`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 26,
		},
		{
			code: `a { width: 50% !important     ; }`,
			fixed: `a { width: 50% !important; }`,
			description: `five spaces between the flag and the semicolon`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 30,
		},
		{
			code: `a { --foo:      ; }`,
			fixed: `a { --foo: ; }`,
			description: `a custom property whose whitespace value is trimmed to the single space the safe option leaves`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 16,
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
			message: messages.expectedBefore(),
			line: 3,
			column: 3,
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
			message: messages.expectedBefore(),
			line: 3,
			column: 1,
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
			message: messages.expectedBefore(),
			line: 3,
			column: 14,
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
			message: messages.expectedBefore(),
			line: 3,
			column: 1,
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
			message: messages.rejectedBefore(),
			line: 3,
			column: 3,
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
			message: messages.rejectedBefore(),
			line: 3,
			column: 1,
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
			message: messages.rejectedBefore(),
			line: 4,
			column: 3,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	reject: [
		{
			code: `a { color: red // keep me\rblue; }`,
			fixed: `a { color: red // keep me\rblue ; }`,
			description: `a carriage return ends the comment, so the semicolon does not join its line and the fix goes through`,
			message: messages.expectedBefore(),
			line: 1,
			column: 30,
		},
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
			message: messages.expectedBefore(),
			line: 3,
			column: 1,
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
			message: messages.expectedBefore(),
			line: 3,
			column: 12,
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
			message: messages.rejectedBefore(),
			line: 3,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-html`,

	accept: [
		{
			code: `<div style="color: pink;top: 0;">x</div>`,
			description: `a style attribute whose semicolons abut their declarations`,
		},
		{
			code: `<div style="color: pink">x</div>`,
			description: `a style attribute with no semicolon in it at all`,
		},
		{
			code: `<div style="">x</div>`,
			description: `an empty style attribute`,
		},
		{
			code: `<span :style="{ color: 'pink' }">x</span>`,
			description: `a style binding, which is no style attribute`,
		},
		{
			code: `<style lang="scss">$a: 1 ;$b: 2 ;</style>`,
			description: `Sass variables at the top level of a style element, which are no declaration block`,
		},
	],

	reject: [
		{
			code: `<div style="color: pink ;top: 0;">x</div>`,
			fixed: `<div style="color: pink;top: 0;">x</div>`,
			description: `a style attribute with a space in front of its first semicolon`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 24,
		},
		{
			code: `
				<div style="color: pink ;top: 0;">x</div>
				<style>a { color: pink ;top: 0; }</style>
			`,
			fixed: `
				<div style="color: pink;top: 0;">x</div>
				<style>a { color: pink;top: 0; }</style>
			`,
			description: `a style attribute and a style element in one document`,
			warnings: [
				{
					message: messages.rejectedBefore(),
					line: 1,
					column: 24,
				},
				{
					message: messages.rejectedBefore(),
					line: 2,
					column: 23,
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
			code: `$a: 1 ;$b: 2 ;`,
			description: `Sass variables at the top level of a file, which are no declaration block`,
		},
	],
})
