import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `@foo;\na {}`,
		},
		{
			code: `@import 'x.css';\na {}`,
		},
		{
			code: `@iMpOrT 'x.css';\na {}`,
		},
		{
			code: `@IMPORT 'x.css';\na {}`,
		},
		{
			code: `@charset 'UTF-8';\na {}`,
		},
		{
			code: `@charset 'UTF-8';\n@import 'x.css'`,
		},
		{
			code: `@charset 'UTF-8';\n@import 'x.css'\na {}`,
		},
		{
			code: `@namespace url(XML-namespace-URL);\na {}`,
		},
		{
			code: `@import 'x.css'); /* comment */\n`,
		},
		{
			code: `@import 'x.css');/* comment */\n`,
		},
		{
			code: `@import 'x.css');   /* comment */\n`,
		},
		{
			code: `@import 'x.css');\t/* comment */\n`,
		},
		{
			code: `@import 'x.css'); \t/* comment */\n`,
		},
		{
			code: `@charset 'UTF-8';\n@media {}`,
		},
		{
			code: `@import 'x.css';\r\n`,
			description: `windows`,
		},
		{
			code: `@import 'x.css'; /* comment */\r\n`,
			description: `windows`,
		},
		{
			code: `@import 'x.css';\n/* comment */;\na {}`,
			description: `a comment on a line of its own behind the semicolon, with a stray semicolon behind the comment, which is no part of the run behind the at-rule`,
		},
		{
			code: `@import 'x.css';\r\n/* comment */;\r\na {}`,
			description: `the same comment and stray semicolon written with carriage-return line breaks`,
		},
		{
			code: `@import 'x.css';\n/* comment */ a {}`,
			description: `a comment on a line of its own behind the semicolon, with a rule behind it on the same line`,
		},
		{
			code: `@import 'x.css'; /* one */\n/* two */ a {}`,
			description: `an end-of-line comment, then a comment on a line of its own with a rule behind it on the same line`,
		},
		{
			code: `@import 'x.css';`,
			description: `single blockless rule`,
		},
		{
			code: `a{\n@extend .b;\n@extend .c\n}`,
			description: `non-standard nested rule`,
		},
		{
			code: `@font-face {}; a {}`,
			description: `ignore at-rule with block`,
		},
	],

	reject: [
		{
			code: `@mixin foo; a {}`,
			fixed: `@mixin foo;\n a {}`,
			message: messages.expectedAfter(),
			line: 1,
			column: 12,
		},
		{
			code: `@mIxIn foo; a {}`,
			fixed: `@mIxIn foo;\n a {}`,
			message: messages.expectedAfter(),
			line: 1,
			column: 12,
		},
		{
			code: `@MIXIN foo; a {}`,
			fixed: `@MIXIN foo;\n a {}`,
			message: messages.expectedAfter(),
			line: 1,
			column: 12,
		},
		{
			code: `@import 'x.css'; /* comment */ a {}`,
			fixed: `@import 'x.css'; /* comment */\n a {}`,
			description: `an end-of-line comment with a rule behind it on the same line`,
			message: messages.expectedAfter(),
			line: 1,
			column: 17,
		},
		{
			code: `@import url("x.css"); @charset "UTF-8";`,
			fixed: `@import url("x.css");\n @charset "UTF-8";`,
			message: messages.expectedAfter(),
			line: 1,
			column: 22,
		},
		{
			code: `@charset "UTF-8"; a {};`,
			fixed: `@charset "UTF-8";\n a {};`,
			message: messages.expectedAfter(),
			line: 1,
			column: 18,
		},
		{
			code: `a{\n@extend .b; @extend .c\n}`,
			fixed: `a{\n@extend .b;\n @extend .c\n}`,
			message: messages.expectedAfter(),
			line: 2,
			column: 12,
		},
		{
			code: `a{\r\n@extend .b; @extend .c\r\n}`,
			fixed: `a{\r\n@extend .b;\r\n @extend .c\r\n}`,
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
			description: `ignore Less mixin`,
		},
		{
			code: `
        @myVariable: #f7f8f9;
        span { background-color: @myVariable; }
      `,
			description: `ignore Less variable`,
		},
	],
})
