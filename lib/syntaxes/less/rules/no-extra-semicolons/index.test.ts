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
		// See #357
		{
			description: `the semicolon closing the declaration of a detached ruleset in front of a call to it, which the rule passes over`,
			code: `@dr: { color: red; }; @dr();`,
		},
		{
			// See #720
			description: `a second semicolon in the text of the inline comment behind a declaration a semicolon of that text closed`,
			code: `
				a {
					color: pink // ;;
				}
			`,
		},
		{
			// See #720
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
			// See #720
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
			description: `a second semicolon behind a declaration standing after a mixin call`,
			code: `a { .mixin();\ncolor: red;; }`,
			fixed: `a { .mixin();\ncolor: red; }`,
			line: 2,
			column: 12,
			message: messages.rejected,
		},
		// See #357
		{
			description: `that same semicolon in front of an at-rule spelled without a space in front of its options`,
			code: `@dr: { color: red; }; @import(reference) "x";`,
			fixed: `@dr: { color: red; } @import(reference) "x";`,
			line: 1,
			column: 21,
			message: messages.rejected,
		},
		{
			// See #720
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
