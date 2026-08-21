import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `@foo;\na {}`,
			description: `a break behind the semicolon of a blockless at-rule`,
		},
		{
			code: `@import 'x.css';\na {}`,
			description: `a break behind the semicolon of an import`,
		},
		{
			code: `@iMpOrT 'x.css';\na {}`,
			description: `a name in alternating case, which this rule says nothing about`,
		},
		{
			code: `@IMPORT 'x.css';\na {}`,
			description: `a name in upper case, which this rule says nothing about`,
		},
		{
			code: `@charset 'UTF-8';\na {}`,
			description: `a break between two at-rules`,
		},
		{
			code: `@charset 'UTF-8';\n@import 'x.css'`,
			description: `a break in front of an at-rule that closes on nothing`,
		},
		{
			code: `@charset 'UTF-8';\n@import 'x.css'\na {}`,
			description: `a break in front of an at-rule that closes on nothing, with a rule behind it`,
		},
		{
			code: `@namespace url(XML-namespace-URL);\na {}`,
			description: `a break behind a namespace declaration`,
		},
		{
			autoStripIndent: false,
			code: `@import 'x.css'); /* comment */\n`,
			description: `a comment behind the semicolon, with the break behind the comment`,
		},
		{
			autoStripIndent: false,
			code: `@import 'x.css');/* comment */\n`,
			description: `a comment abutting the semicolon, with the break behind the comment`,
		},
		{
			autoStripIndent: false,
			code: `@import 'x.css');   /* comment */\n`,
			description: `three spaces between the semicolon and the comment behind it`,
		},
		{
			autoStripIndent: false,
			code: `@import 'x.css');\t/* comment */\n`,
			description: `a tab between the semicolon and the comment behind it`,
		},
		{
			autoStripIndent: false,
			code: `@import 'x.css'); \t/* comment */\n`,
			description: `a space and a tab between the semicolon and the comment behind it`,
		},
		{
			code: `@charset 'UTF-8';\n@media {}`,
			description: `a break in front of an at-rule carrying a block`,
		},
		{
			autoStripIndent: false,
			code: `@import 'x.css';\r\n`,
			description: `a carriage return and a line feed behind the semicolon`,
		},
		{
			autoStripIndent: false,
			code: `@import 'x.css'; /* comment */\r\n`,
			description: `the same pair behind a comment of its own`,
		},
		{
			code: `@import 'x.css';`,
			description: `a semicolon closing the file, with no line for the break to open`,
		},
		{
			code: `
				a{
				@extend .b;
				@extend .c
				}
			`,
			description: `nested at-rules closing on a break, which the parser reads as one statement each`,
		},
		{
			code: `@font-face {}; a {}`,
			description: `an at-rule carrying a block, whose stray semicolon is none of this rule's business`,
		},
	],

	reject: [
		{
			code: `@mixin foo; a {}`,
			fixed: `@mixin foo;\n a {}`,
			description: `a space where the break belongs`,
			message: messages.expectedAfter(),
			line: 1,
			column: 12,
		},
		{
			code: `@mIxIn foo; a {}`,
			fixed: `@mIxIn foo;\n a {}`,
			description: `the same at-rule named in alternating case`,
			message: messages.expectedAfter(),
			line: 1,
			column: 12,
		},
		{
			code: `@MIXIN foo; a {}`,
			fixed: `@MIXIN foo;\n a {}`,
			description: `the same at-rule named in upper case`,
			message: messages.expectedAfter(),
			line: 1,
			column: 12,
		},
		{
			code: `@import url("x.css"); @charset "UTF-8";`,
			fixed: `@import url("x.css");\n @charset "UTF-8";`,
			description: `a space between two at-rules of the file's first line`,
			message: messages.expectedAfter(),
			line: 1,
			column: 22,
		},
		{
			code: `@charset "UTF-8"; a {};`,
			fixed: `@charset "UTF-8";\n a {};`,
			description: `a space in front of a rule, whose own stray semicolon closes the file`,
			message: messages.expectedAfter(),
			line: 1,
			column: 18,
		},
		{
			code: `
				a{
				@extend .b; @extend .c
				}
			`,
			fixed: `
				a{
				@extend .b;
				 @extend .c
				}
			`,
			description: `a space between two nested at-rules`,
			message: messages.expectedAfter(),
			line: 2,
			column: 12,
		},
		{
			code: `a{\r\n@extend .b; @extend .c\r\n}`,
			fixed: `a{\r\n@extend .b;\r\n @extend .c\r\n}`,
			description: `the same pair on a file broken with carriage returns`,
			message: messages.expectedAfter(),
			line: 2,
			column: 12,
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`always`],
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
