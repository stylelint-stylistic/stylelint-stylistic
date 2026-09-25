import { createRule } from "../../../../rules/no-extra-semicolons/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-less`,

	accept: [
		{
			// The code Less reads behind the carriage return closing the comment is a declaration its semicolon closes
			description: `a declaration behind a bare carriage return in the text of a double-slash comment`,
			code: `a {\n\tcolor: pink; // c\r top: 0;\n}\n`,
		},
		{
			// A semicolon inside a string or a call's arguments is text of it, and taking one away changes what Less compiles
			description: `semicolons inside a string and inside an address behind a bare carriage return in such a comment`,
			code: `a {\n\tcolor: pink; // c\r content: "a;;"; background: url(a;;b);\n}\n`,
		},
		{
			description: `a semicolon behind a form feed in such a comment, which Less reads as the comment's text`,
			code: `a {\n\tcolor: pink; // c\f;\n}\n`,
		},
		{
			description: `an import closed by its own semicolon`,
			code: `@import 'x.css';`,
		},
		{
			description: `two mixin calls, each closed by a semicolon`,
			code: `a { .mixin(); .mixin2; }`,
		},
		{
			description: `a second semicolon behind each mixin call, which the syntax reads as part of the call`,
			code: `a { .mixin();; .mixin2;; }`,
		},
		{
			description: `the semicolon closing the declaration of a detached ruleset in front of a call to it, which the rule passes over`,
			code: `@dr: { color: red; }; @dr();`,
		},
		{
			description: `a second semicolon in the text of the inline comment behind a declaration a semicolon of that text closed`,
			code: `
				a {
					color: pink // ;;
				}
			`,
		},
		{
			description: `the semicolon of code Less closes such a declaration on, heading the next line`,
			code: `
				a {
					color: pink // ;
					;
					top: 0;
				}
			`,
		},
		{
			description: `the same semicolon behind a second inline comment standing in the text of the first`,
			code: `
				a {
					color: pink // ; // d ;
					;
					top: 0;
				}
			`,
		},
		{
			// Pins the semicolon Less closes on kept behind every node, not only where Less reads the comment as one
			description: `the semicolon of code Less closes an at-rule on behind a comment holding a semicolon, which the rule leaves whatever Less makes of the comment`,
			code: `
				a {
					@include x // ;
					;
				}
			`,
		},
	],

	reject: [
		{
			// Less closes a double-slash comment on a bare carriage return, where the parser reads on to the line feed and keeps the semicolon in the comment's text
			description: `a semicolon behind a bare carriage return in the text of a double-slash comment behind a declaration`,
			code: `a {\n\tcolor: pink; // c\r;\n}\n`,
			fixed: `a {\n\tcolor: pink; // c\r\n}\n`,
			line: 2,
			column: 20,
			message: messages.rejected,
		},
		{
			description: `two such semicolons, one behind the other`,
			code: `a {\n\tcolor: pink; // c\r; ;\n}\n`,
			fixed: `a {\n\tcolor: pink; // c\r \n}\n`,
			warnings: [
				{
					line: 2,
					column: 20,
					message: messages.rejected,
				},
				{
					line: 2,
					column: 22,
					message: messages.rejected,
				},
			],
		},
		{
			description: `a second semicolon behind a mixin call Less reads in such a comment`,
			code: `a {\n\tcolor: pink; // c\r .m();;\n}\n`,
			fixed: `a {\n\tcolor: pink; // c\r .m();\n}\n`,
			line: 2,
			column: 26,
			message: messages.rejected,
		},
		{
			description: `a second semicolon behind a declaration Less reads in such a comment`,
			code: `a {\n\tcolor: pink; // c\r top: 0; ;\n}\n`,
			fixed: `a {\n\tcolor: pink; // c\r top: 0; \n}\n`,
			line: 2,
			column: 29,
			message: messages.rejected,
		},
		{
			description: `a second semicolon behind a declaration standing after a mixin call`,
			code: `a { .mixin();\ncolor: red;; }`,
			fixed: `a { .mixin();\ncolor: red; }`,
			line: 2,
			column: 12,
			message: messages.rejected,
		},
		{
			description: `that same semicolon in front of an at-rule spelled without a space in front of its options`,
			code: `@dr: { color: red; }; @import(reference) "x";`,
			fixed: `@dr: { color: red; } @import(reference) "x";`,
			line: 1,
			column: 21,
			message: messages.rejected,
		},
		{
			description: `a second semicolon of code behind the one Less closes such a declaration on`,
			code: `
				a {
					color: pink // ;
					;;
					top: 0;
				}
			`,
			fixed: `
				a {
					color: pink // ;
					;
					top: 0;
				}
			`,
			line: 3,
			column: 3,
			message: messages.rejected,
		},
	],
})
