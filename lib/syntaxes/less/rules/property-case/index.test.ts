import { createRule } from "../../../../rules/property-case/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`lower`],

	accept: [
		{
			description: `a Less at-variable, whose name is no property`,
			code: `@variable: 10px`,
		},
		{
			description: `the same variable written with a capital`,
			code: `@Variable: 10px`,
		},
		{
			description: `the same variable written in upper case`,
			code: `@VARIABLE: 10px`,
		},
		{
			description: `a declaration whose value is a Less variable`,
			code: `a { color: @light-blue; }`,
		},
		{
			description: `a mixin call, which is no declaration`,
			code: `a { .bordered; }`,
		},
		{
			description: `the same call written with a capital`,
			code: `a { .Bordered; }`,
		},
		{
			description: `the same call written with an argument`,
			code: `a { .Bordered(5px); }`,
		},
		{
			description: `a declaration inside a mixin definition`,
			code: `.mixin(@color: black) { color: @color; }`,
		},
		{
			description: `a declaration under a selector built by interpolation`,
			code: `.@{my-selector} { font-weight: bold; }`,
		},
		{
			description: `a property name built by interpolation`,
			code: `.widget { @{property}: #0ee; }`,
		},
		{
			description: `the same name with a capital inside the interpolation`,
			code: `.widget { @{Property}: #0ee; }`,
		},
		{
			description: `a property marked as mergeable`,
			code: `a { box-shadow+: inset 0 0 10px #555; }`,
		},
		{
			description: `a property marked as mergeable with a space`,
			code: `a { box-shadow+_: inset 0 0 10px #555; }`,
		},
		{
			description: `a declaration under a nested selector`,
			code: `.bucket { tr & { color: blue; } }`,
		},
		{
			description: `a mergeable property opening with a capital, which the rule does not measure at all`,
			code: `a { Box-shadow+: inset 0 0 10px #555; }`,
		},
		{
			description: `a mergeable-with-space property opening with a capital, left alone for the same reason`,
			code: `a { Transform+_: scale(2); }`,
		},
	],

	reject: [
		{
			description: `a property opening with a capital, its value a Less variable`,
			code: `a { Color: @light-blue; }`,
			fixed: `a { color: @light-blue; }`,
			line: 1,
			column: 5,
			endLine: 1,
			endColumn: 10,
			message: messages.expected(`Color`, `color`),
		},
		{
			description: `a property opening with a capital under a selector built by interpolation`,
			code: `.@{my-selector} { Font-weight: bold; }`,
			fixed: `.@{my-selector} { font-weight: bold; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 30,
			message: messages.expected(`Font-weight`, `font-weight`),
		},
		{
			description: `a property opening with a capital inside a mixin definition`,
			code: `.mixin(@color: black) { Color: @color; }`,
			fixed: `.mixin(@color: black) { color: @color; }`,
			line: 1,
			column: 25,
			endLine: 1,
			endColumn: 30,
			message: messages.expected(`Color`, `color`),
		},
		{
			description: `a property opening with a capital inside two nested media queries`,
			code: `@media screen { @media (min-width: 768px) { Color: red; }}`,
			fixed: `@media screen { @media (min-width: 768px) { color: red; }}`,
			line: 1,
			column: 45,
			endLine: 1,
			endColumn: 50,
			message: messages.expected(`Color`, `color`),
		},
		{
			description: `a property opening with a capital under a nested selector`,
			code: `.bucket { tr & { Color: blue; } }`,
			fixed: `.bucket { tr & { color: blue; } }`,
			line: 1,
			column: 18,
			endLine: 1,
			endColumn: 23,
			message: messages.expected(`Color`, `color`),
		},
	],
})
testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`upper`],

	accept: [
		{
			description: `a Less at-variable, whose name is no property`,
			code: `@variable: 10px`,
		},
		{
			description: `the same variable written with a capital`,
			code: `@Variable: 10px`,
		},
		{
			description: `the same variable written in upper case`,
			code: `@VARIABLE: 10px`,
		},
		{
			description: `a declaration whose value is a Less variable`,
			code: `a { COLOR: @light-blue; }`,
		},
		{
			description: `a mixin call, which is no declaration`,
			code: `a { .bordered; }`,
		},
		{
			description: `the same call written with a capital`,
			code: `a { .Bordered; }`,
		},
		{
			description: `the same call written with an argument`,
			code: `a { .Bordered(5px); }`,
		},
		{
			description: `a declaration inside a mixin definition`,
			code: `.mixin(@color: black) { COLOR: @color; }`,
		},
		{
			description: `a declaration under a selector built by interpolation`,
			code: `.@{my-selector} { FONT-WEIGHT: bold; }`,
		},
		{
			description: `a property name built by interpolation`,
			code: `.widget { @{property}: #0ee; }`,
		},
		{
			description: `the same name with a capital inside the interpolation`,
			code: `.widget { @{Property}: #0ee; }`,
		},
		{
			description: `a property marked as mergeable`,
			code: `a { BOX_SHADOW+: inset 0 0 10px #555; }`,
		},
		{
			description: `a property marked as mergeable with a space`,
			code: `a { BOX-SHADOW+_: inset 0 0 10px #555; }`,
		},
		{
			description: `a declaration under a nested selector`,
			code: `.bucket { tr & { COLOR: blue; } }`,
		},
		{
			description: `a mergeable property opening with a capital, which the rule does not measure at all`,
			code: `a { Box-shadow+: inset 0 0 10px #555; }`,
		},
		{
			description: `a mergeable-with-space property opening with a capital, left alone for the same reason`,
			code: `a { Transform+_: scale(2); }`,
		},
	],

	reject: [
		{
			description: `a property opening with a capital, its value a Less variable`,
			code: `a { Color: @light-blue; }`,
			fixed: `a { COLOR: @light-blue; }`,
			line: 1,
			column: 5,
			endLine: 1,
			endColumn: 10,
			message: messages.expected(`Color`, `COLOR`),
		},
		{
			description: `a property opening with a capital under a selector built by interpolation`,
			code: `.@{my-selector} { Font-weight: bold; }`,
			fixed: `.@{my-selector} { FONT-WEIGHT: bold; }`,
			line: 1,
			column: 19,
			endLine: 1,
			endColumn: 30,
			message: messages.expected(`Font-weight`, `FONT-WEIGHT`),
		},
		{
			description: `a property opening with a capital inside a mixin definition`,
			code: `.mixin(@color: black) { Color: @color; }`,
			fixed: `.mixin(@color: black) { COLOR: @color; }`,
			line: 1,
			column: 25,
			endLine: 1,
			endColumn: 30,
			message: messages.expected(`Color`, `COLOR`),
		},
		{
			description: `a property opening with a capital inside two nested media queries`,
			code: `@media screen { @media (min-width: 768px) { Color: red; }}`,
			fixed: `@media screen { @media (min-width: 768px) { COLOR: red; }}`,
			line: 1,
			column: 45,
			endLine: 1,
			endColumn: 50,
			message: messages.expected(`Color`, `COLOR`),
		},
		{
			description: `a property opening with a capital under a nested selector`,
			code: `.bucket { tr & { Color: blue; } }`,
			fixed: `.bucket { tr & { COLOR: blue; } }`,
			line: 1,
			column: 18,
			endLine: 1,
			endColumn: 23,
			message: messages.expected(`Color`, `COLOR`),
		},
	],
})
