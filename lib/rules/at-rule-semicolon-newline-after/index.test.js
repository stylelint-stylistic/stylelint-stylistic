import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a break behind the semicolon of a blockless at-rule`,
			code: `@foo;\na {}`,
		},
		{
			description: `a break behind the semicolon of an import`,
			code: `@import 'x.css';\na {}`,
		},
		{
			description: `a name in alternating case, which this rule says nothing about`,
			code: `@iMpOrT 'x.css';\na {}`,
		},
		{
			description: `a name in upper case, which this rule says nothing about`,
			code: `@IMPORT 'x.css';\na {}`,
		},
		{
			description: `a break between two at-rules`,
			code: `@charset 'UTF-8';\na {}`,
		},
		{
			description: `a break in front of an at-rule that closes on nothing`,
			code: `@charset 'UTF-8';\n@import 'x.css'`,
		},
		{
			description: `a break in front of an at-rule that closes on nothing, with a rule behind it`,
			code: `@charset 'UTF-8';\n@import 'x.css'\na {}`,
		},
		{
			description: `a break behind a namespace declaration`,
			code: `@namespace url(XML-namespace-URL);\na {}`,
		},
		{
			autoStripIndent: false,
			description: `a comment behind the semicolon, with the break behind the comment`,
			code: `@import 'x.css'); /* comment */\n`,
		},
		{
			autoStripIndent: false,
			description: `a comment abutting the semicolon, with the break behind the comment`,
			code: `@import 'x.css');/* comment */\n`,
		},
		{
			autoStripIndent: false,
			description: `three spaces between the semicolon and the comment behind it`,
			code: `@import 'x.css');   /* comment */\n`,
		},
		{
			autoStripIndent: false,
			description: `a tab between the semicolon and the comment behind it`,
			code: `@import 'x.css');\t/* comment */\n`,
		},
		{
			autoStripIndent: false,
			description: `a space and a tab between the semicolon and the comment behind it`,
			code: `@import 'x.css'); \t/* comment */\n`,
		},
		{
			description: `a break in front of an at-rule carrying a block`,
			code: `@charset 'UTF-8';\n@media {}`,
		},
		{
			autoStripIndent: false,
			description: `a carriage return and a line feed behind the semicolon`,
			code: `@import 'x.css';\r\n`,
		},
		{
			autoStripIndent: false,
			description: `the same pair behind a comment of its own`,
			code: `@import 'x.css'; /* comment */\r\n`,
		},
		{
			description: `a semicolon closing the file, with no line for the break to open`,
			code: `@import 'x.css';`,
		},
		{
			description: `nested at-rules closing on a break, which the parser reads as one statement each`,
			code: `
				a{
				@extend .b;
				@extend .c
				}
			`,
		},
		{
			description: `an at-rule carrying a block, whose stray semicolon is none of this rule's business`,
			code: `@font-face {}; a {}`,
		},
	],

	reject: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/357
		{
			description: `an at-rule spelled without a space in front of its options, with a declaration standing behind its semicolon`,
			code: `span { @layer(l); color: red; }`,
			fixed: `span { @layer(l);\n color: red; }`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `a space where the break belongs`,
			code: `@mixin foo; a {}`,
			fixed: `@mixin foo;\n a {}`,
			line: 1,
			column: 12,
			message: messages.expectedAfter(),
		},
		{
			description: `the same at-rule named in alternating case`,
			code: `@mIxIn foo; a {}`,
			fixed: `@mIxIn foo;\n a {}`,
			line: 1,
			column: 12,
			message: messages.expectedAfter(),
		},
		{
			description: `the same at-rule named in upper case`,
			code: `@MIXIN foo; a {}`,
			fixed: `@MIXIN foo;\n a {}`,
			line: 1,
			column: 12,
			message: messages.expectedAfter(),
		},
		{
			description: `a space between two at-rules of the file's first line`,
			code: `@import url("x.css"); @charset "UTF-8";`,
			fixed: `@import url("x.css");\n @charset "UTF-8";`,
			line: 1,
			column: 22,
			message: messages.expectedAfter(),
		},
		{
			description: `a space in front of a rule, whose own stray semicolon closes the file`,
			code: `@charset "UTF-8"; a {};`,
			fixed: `@charset "UTF-8";\n a {};`,
			line: 1,
			column: 18,
			message: messages.expectedAfter(),
		},
		{
			description: `a space between two nested at-rules`,
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
			line: 2,
			column: 12,
			message: messages.expectedAfter(),
		},
		{
			description: `the same pair on a file broken with carriage returns`,
			code: `a{\r\n@extend .b; @extend .c\r\n}`,
			fixed: `a{\r\n@extend .b;\r\n @extend .c\r\n}`,
			line: 2,
			column: 12,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`always`],
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
			code: `@dr: { color: red; }; span { @dr(); color: red; }`,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139
			description: `no newline behind the semicolon of an at-rule whose parameters carry on past an inline comment, which this syntax keeps a second copy of`,
			code: `
				@import "a" // c
					"b" ;@import "c";
			`,
			fixed: `
				@import "a" // c
					"b" ;
				@import "c";
			`,
			line: 2,
			column: 7,
			message: messages.expectedAfter(),
		},
	],
})
