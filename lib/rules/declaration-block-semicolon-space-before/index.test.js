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
			autoStripIndent: true,
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
			description: `declaration on root`,
		},
		{
			code: `a { color: pink ; }`,
		},
		{
			code: `a::before { content: ";a" ; }`,
		},
		{
			code: `a { color: pink ; top: 0 ; }`,
		},
		{
			code: `a { color: pink ; top: 0}`,
		},
		{
			code: `a { width: 50% !important ;}`,
		},
		{
			code: `a { --foo: ; }`,
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
			message: messages.expectedBefore(),
			line: 1,
			column: 15,
		},
		{
			code: `a { color: pink  ; }`,
			fixed: `a { color: pink ; }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink\t; }`,
			fixed: `a { color: pink ; }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink\n; }`,
			fixed: `a { color: pink ; }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink\r\n; }`,
			fixed: `a { color: pink ; }`,
			description: `CRLF`,
			message: messages.expectedBefore(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink ; top: 0; }`,
			fixed: `a { color: pink ; top: 0 ; }`,
			message: messages.expectedBefore(),
			line: 1,
			column: 24,
		},
		{
			code: `a { color: pink/*comment*/; }`,
			fixed: `a { color: pink/*comment*/ ; }`,
			description: `comment`,
			message: messages.expectedBefore(),
			line: 1,
			column: 26,
		},
		{
			code: `a { color: pink /*comment*/; }`,
			fixed: `a { color: pink /*comment*/ ; }`,
			description: `comment`,
			message: messages.expectedBefore(),
			line: 1,
			column: 27,
		},
		{
			code: `a { width: 50% !important; }`,
			fixed: `a { width: 50% !important ; }`,
			description: `important`,
			message: messages.expectedBefore(),
			line: 1,
			column: 25,
		},
		{
			code: `a { --foo:; }`,
			fixed: `a { --foo: ; }`,
			description: `custom property null value`,
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
			description: `declaration on root`,
		},
		{
			code: `a { color: pink; }`,
		},
		{
			code: `a::before { content: ";a"; }`,
		},
		{
			code: `a { color: pink; top: 0; }`,
		},
		{
			code: `a { width: 50% !important;}`,
		},
		{
			// Valid because of `never` option
			code: `a { --foo:; }`,
		},
		{
			// A custom property may hold nothing but whitespace, and that whitespace is its value rather than the space in front of the semicolon
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50
			code: `a { --foo: ; }`,
		},
	],

	reject: [
		{
			code: `a { color: pink ; }`,
			fixed: `a { color: pink; }`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink  ; }`,
			fixed: `a { color: pink; }`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink\t; }`,
			fixed: `a { color: pink; }`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink\n; }`,
			fixed: `a { color: pink; }`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink\r\n; }`,
			fixed: `a { color: pink; }`,
			description: `CRLF`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink; top: 0 ; }`,
			fixed: `a { color: pink; top: 0; }`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 24,
		},
		{
			code: `a { color: pink/*comment*/ ; }`,
			fixed: `a { color: pink/*comment*/; }`,
			description: `comment`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 27,
		},
		{
			code: `a { color: pink /*comment*/ ; }`,
			fixed: `a { color: pink /*comment*/; }`,
			description: `comment`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 28,
		},
		{
			code: `a { width: 50% !important ; }`,
			fixed: `a { width: 50% !important; }`,
			description: `important`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 26,
		},
		{
			code: `a { width: 50% !important     ; }`,
			fixed: `a { width: 50% !important; }`,
			description: `important`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 30,
		},
		{
			code: `a { --foo:      ; }`,
			fixed: `a { --foo: ; }`,
			description: `Multiple spaces are replaced by the safe single space option`,
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
			autoStripIndent: true,
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
			description: `declaration on root`,
		},
		{
			code: `a { color: pink ; }`,
		},
		{
			code: `a::before { content: ";a" ; }`,
		},
		{
			code: `a { color: pink ; top: 0 ; }`,
		},
		{
			code: `a,\nb { color: pink ; top: 0 ; }`,
			description: `multi-line rule, single-line declaration-block`,
		},
		{
			code: `a {\n  color: pink;\n  top: 0;\n}`,
		},
		{
			code: `a {\r\n  color: pink;\r\n  top: 0;\r\n}`,
			description: `CRLF`,
		},
		{
			code: `a { width: 50% !important ; }`,
		},
		{
			code: `a {\n  width: 50% !important;\n}`,
		},
		{
			code: `a { --foo: ; }`,
		},
		{
			code: `a {\n  --foo: ;\n}`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }`,
			fixed: `a { color: pink ; }`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 15,
		},
		{
			code: `a,\nb { color: pink; }`,
			fixed: `a,\nb { color: pink ; }`,
			message: messages.expectedBeforeSingleLine(),
			line: 2,
			column: 15,
		},
		{
			code: `a,\r\nb { color: pink; }`,
			fixed: `a,\r\nb { color: pink ; }`,
			description: `CRLF`,
			message: messages.expectedBeforeSingleLine(),
			line: 2,
			column: 15,
		},
		{
			code: `a { color: pink  ; }`,
			fixed: `a { color: pink ; }`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink\t; }`,
			fixed: `a { color: pink ; }`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink ; top: 0; }`,
			fixed: `a { color: pink ; top: 0 ; }`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 24,
		},
		{
			code: `a { width: 50% !important; }`,
			fixed: `a { width: 50% !important ; }`,
			description: `important`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 25,
		},
		{
			code: `a { --foo:; }`,
			fixed: `a { --foo: ; }`,
			description: `custom property null value`,
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
			description: `declaration on root`,
		},
		{
			code: `a { color: pink; }`,
		},
		{
			code: `a::before { content: ";a"; }`,
		},
		{
			code: `a { color: pink; top: 0; }`,
		},
		{
			code: `a,\nb { color: pink; top: 0; }`,
			description: `multi-line rule, single-line declaration-block`,
		},
		{
			code: `a {\n  color: pink ;\n  top: 0 ;\n}`,
		},
		{
			code: `a { width: 50% !important; }`,
		},
		{
			code: `a {\n  width: 50% !important ;\n}`,
		},
		{
			// Valid because of `never-single-line` option
			code: `a { --foo:; }`,
		},
		{
			// A custom property may hold nothing but whitespace, and that whitespace is its value rather than the space in front of the semicolon
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50
			code: `a { --foo: ; }`,
		},
		{
			// Not checked because of multiline declaration
			code: `a {\n  --foo: ;\n  --bar:;\n}`,
		},
	],

	reject: [
		{
			code: `a { color: pink ; }`,
			fixed: `a { color: pink; }`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 16,
		},
		{
			code: `a,\nb { color: pink ; }`,
			fixed: `a,\nb { color: pink; }`,
			message: messages.rejectedBeforeSingleLine(),
			line: 2,
			column: 16,
		},
		{
			code: `a,\r\nb { color: pink ; }`,
			fixed: `a,\r\nb { color: pink; }`,
			description: `CRLF`,
			message: messages.rejectedBeforeSingleLine(),
			line: 2,
			column: 16,
		},
		{
			code: `a { color: pink  ; }`,
			fixed: `a { color: pink; }`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink\t; }`,
			fixed: `a { color: pink; }`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink; top: 0 ; }`,
			fixed: `a { color: pink; top: 0; }`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 24,
		},
		{
			code: `a { width: 50% !important ; }`,
			fixed: `a { width: 50% !important; }`,
			description: `important`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 26,
		},
		{
			code: `a { width: 50% !important     ; }`,
			fixed: `a { width: 50% !important; }`,
			description: `important`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 30,
		},
		{
			code: `a { --foo:      ; }`,
			fixed: `a { --foo: ; }`,
			description: `Multiple spaces are replaced by the safe single space option`,
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
	autoStripIndent: true,

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
	autoStripIndent: true,

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
	autoStripIndent: true,

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
	autoStripIndent: true,

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
	autoStripIndent: true,

	accept: [
		{
			code: `<div style="color: pink;top: 0;">x</div>`,
		},
		{
			code: `<div style="color: pink">x</div>`,
			description: `no trailing semicolon`,
		},
		{
			code: `<div style="">x</div>`,
			description: `empty style attribute`,
		},
		{
			code: `<span :style="{ color: 'pink' }">x</span>`,
			description: `a style binding is not a style attribute`,
		},
		{
			code: `<style lang="scss">$a: 1 ;$b: 2 ;</style>`,
			description: `top-level Sass variables are not a declaration block`,
		},
	],

	reject: [
		{
			code: `<div style="color: pink ;top: 0;">x</div>`,
			fixed: `<div style="color: pink;top: 0;">x</div>`,
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
	autoStripIndent: true,

	accept: [
		{
			code: `$a: 1 ;$b: 2 ;`,
			description: `top-level Sass variables are not a declaration block`,
		},
	],
})
