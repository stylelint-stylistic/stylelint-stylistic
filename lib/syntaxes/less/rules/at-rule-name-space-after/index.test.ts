import { createRule } from "../../../../rules/at-rule-name-space-after/index.ts"
import { less } from "../../index.ts"

let { messages, ruleName } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`always`],

	accept: [
		{
			description: `a Less variable, which the parser gives the shape of an at-rule`,
			code: `@nice-blue:#5B83AD;`,
		},
		{
			description: `a Less variable with a space behind its colon`,
			code: `@nice-blue: #5B83AD;`,
		},
		{
			description: `a Less variable whose value stands on the next line`,
			code: `@nice-blue:\n#5B83AD;`,
		},
		{
			description: `a Less variable declared with a tab in front of its colon, which the parser leaves unmarked`,
			code: `@nice-blue\t: #5B83AD;`,
		},
		{
			description: `a Less variable declared with a line break in front of its colon`,
			code: `@nice-blue\n: #5B83AD;`,
		},
		{
			description: `an interpolated selector, whose at-sign opens no at-rule`,
			code: `@variable: .bucket; .@{variable} { }`,
		},
		{
			description: `a detached ruleset passed to a mixin`,
			code: `@detached-ruleset: { background: red; }; .top { @detached-ruleset(); }`,
		},
		{
			description: `the same call carrying a lookup, which Less inlines just as it inlines the bare one`,
			code: `@detached-ruleset: { background: red; }; .top { @detached-ruleset()[background]; }`,
		},
		{
			description: `a detached ruleset holding a rule of its own`,
			code: `@my-ruleset: { .my-selector { background-color: black; } };`,
		},
		{
			description: `a mixin call, which is no at-rule`,
			code: `.class1 { .mixin(#ddd) }`,
		},
		{
			description: `a parent selector, which is no at-rule either`,
			code: `.button { &-ok {} }`,
		},
	],

	reject: [
		{
			description: `an import with its options against the name, which Less prints through as text and a written space would load`,
			code: `@import(reference) "x.less";`,
			fixed: `@import(reference) "x.less";`,
			line: 1,
			column: 7,
			message: messages.expectedAfter(`@import`),
		},
		{
			description: `an import with its address against the name`,
			code: `@import"x.less";`,
			fixed: `@import"x.less";`,
			line: 1,
			column: 7,
			message: messages.expectedAfter(`@import`),
		},
		{
			description: `an import with a comment right behind the name, which Less reads no whitespace in`,
			code: `@import/* c */"x.less";`,
			fixed: `@import/* c */"x.less";`,
			line: 1,
			column: 7,
			message: messages.expectedAfter(`@import`),
		},
		{
			description: `a plugin with its options against the name, which a written space would hand the options to`,
			code: `@plugin(args) "p";`,
			fixed: `@plugin(args) "p";`,
			line: 1,
			column: 7,
			message: messages.expectedAfter(`@plugin`),
		},
		{
			description: `a plugin with its address against the name`,
			code: `@plugin"p";`,
			fixed: `@plugin"p";`,
			line: 1,
			column: 7,
			message: messages.expectedAfter(`@plugin`),
		},
		{
			description: `the same import inside a rule`,
			code: `a { @import(reference) "x.less"; }`,
			fixed: `a { @import(reference) "x.less"; }`,
			line: 1,
			column: 11,
			message: messages.expectedAfter(`@import`),
		},
		{
			description: `an import with two spaces behind the name, which Less reads as a directive in both spellings`,
			code: `@import  "x.less";`,
			fixed: `@import "x.less";`,
			line: 1,
			column: 7,
			message: messages.expectedAfter(`@import`),
		},
		{
			description: `an import whose name is in upper case, which at-rule-name-case may lowercase within the same run`,
			code: `@IMPORT(reference) "x.less";`,
			fixed: `@IMPORT(reference) "x.less";`,
			line: 1,
			column: 7,
			message: messages.expectedAfter(`@IMPORT`),
		},
		{
			description: `a media query against the name, which Less compiles the same in both spellings`,
			code: `@media(min-width: 1px) { a { color: red } }`,
			fixed: `@media (min-width: 1px) { a { color: red } }`,
			line: 1,
			column: 6,
			message: messages.expectedAfter(`@media`),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `the shape of a detached ruleset call under a name Less reads shorter than the parser, whose name no whitespace can be written behind without landing in the at-rule's options`,
			code: `
				a {
					@dr$();
				}
			`,
		},
	],
})
