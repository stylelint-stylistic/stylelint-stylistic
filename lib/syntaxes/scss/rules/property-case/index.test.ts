import { createRule } from "../../../../rules/property-case/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`lower`],

	accept: [
		{
			description: `an SCSS variable, whose name is no property`,
			code: `$width: 5em;`,
		},
		{
			description: `the same variable written with a capital`,
			code: `$Width: 5em;`,
		},
		{
			description: `a key inside an SCSS map, which is no property either`,
			code: `$map: (width: 100px);`,
		},
		{
			description: `the same key written with a capital`,
			code: `$map: (Width: 100px);`,
		},
		{
			description: `a value written as a parenthesised list`,
			code: `a { font: (italic bold 10px/8px) }`,
		},
		{
			description: `a declaration under a selector referencing the parent`,
			code: `&-sidebar { border: 1px solid; }`,
		},
		{
			description: `a nested property block`,
			code: `a { font: { size: 30em; } }`,
		},
		{
			description: `a property name built by interpolation`,
			code: `p.#{$name} { #{$attr}-color: blue; }`,
		},
		{
			description: `the same name with a capital inside the interpolation`,
			code: `p.#{$name} { #{$Attr}-color: blue; }`,
		},
		{
			description: `the word after the interpolation opening with a capital`,
			code: `p.#{$name} { #{$attr}-Color: blue; }`,
		},
		{
			description: `a declaration under a placeholder selector`,
			code: `#context a%extreme { color: red; }`,
		},
		{
			description: `a declaration inside an at-root block`,
			code: `.parent { @at-root { .child1 { display: block; } } }`,
		},
		{
			description: `a declaration inside a mixin`,
			code: `@mixin large-text { font-size: 20px; }`,
		},
		{
			description: `a declaration inside a conditional at-rule`,
			code: `p { @if 1 + 1 == 2 { border: 1px solid;  } }`,
		},
	],

	reject: [
		{
			description: `a property opening with a capital, under a selector referencing the parent`,
			code: `&-sidebar { Border: 1px solid; }`,
			fixed: `&-sidebar { border: 1px solid; }`,
			line: 1,
			column: 13,
			endLine: 1,
			endColumn: 19,
			message: messages.expected(`Border`, `border`),
		},
		{
			description: `a property opening with a capital, its value a parenthesised list`,
			code: `a { Font: (italic bold 10px/8px) }`,
			fixed: `a { font: (italic bold 10px/8px) }`,
			line: 1,
			column: 5,
			endLine: 1,
			endColumn: 9,
			message: messages.expected(`Font`, `font`),
		},
		{
			description: `a property opening with a capital inside a nested property block`,
			code: `a { font: { Size: 30em; } }`,
			fixed: `a { font: { size: 30em; } }`,
			line: 1,
			column: 13,
			endLine: 1,
			endColumn: 17,
			message: messages.expected(`Size`, `size`),
		},
		{
			description: `a property opening with a capital under a placeholder selector`,
			code: `#context a%extreme { Color: red; }`,
			fixed: `#context a%extreme { color: red; }`,
			line: 1,
			column: 22,
			endLine: 1,
			endColumn: 27,
			message: messages.expected(`Color`, `color`),
		},
		{
			description: `a property opening with a capital inside an at-root block`,
			code: `.parent { @at-root { .child1 { Display: block; } } }`,
			fixed: `.parent { @at-root { .child1 { display: block; } } }`,
			line: 1,
			column: 32,
			endLine: 1,
			endColumn: 39,
			message: messages.expected(`Display`, `display`),
		},
		{
			description: `a property opening with a capital inside a mixin`,
			code: `@mixin large-text { Font-size: 20px; }`,
			fixed: `@mixin large-text { font-size: 20px; }`,
			line: 1,
			column: 21,
			endLine: 1,
			endColumn: 30,
			message: messages.expected(`Font-size`, `font-size`),
		},
		{
			description: `a property opening with a capital inside a conditional at-rule`,
			code: `p { @if 1 + 1 == 2 { Border: 1px solid;  } }`,
			fixed: `p { @if 1 + 1 == 2 { border: 1px solid;  } }`,
			line: 1,
			column: 22,
			endLine: 1,
			endColumn: 28,
			message: messages.expected(`Border`, `border`),
		},
	],
})
testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`upper`],

	accept: [
		{
			description: `an SCSS variable, whose name is no property`,
			code: `$width: 5em;`,
		},
		{
			description: `the same variable written with a capital`,
			code: `$Width: 5em;`,
		},
		{
			description: `a key inside an SCSS map, which is no property either`,
			code: `$map: (width: 100px);`,
		},
		{
			description: `the same key written with a capital`,
			code: `$map: (Width: 100px);`,
		},
		{
			description: `a value written as a parenthesised list`,
			code: `a { FONT: (italic bold 10px/8px) }`,
		},
		{
			description: `a declaration under a selector referencing the parent`,
			code: `&-sidebar { BORDER: 1px solid; }`,
		},
		{
			description: `a nested property block`,
			code: `a { font: { SIZE: 30em; } }`,
		},
		{
			description: `a property name built by interpolation`,
			code: `p.#{$name} { #{$attr}-color: blue; }`,
		},
		{
			description: `the same name with a capital inside the interpolation`,
			code: `p.#{$name} { #{$Attr}-color: blue; }`,
		},
		{
			description: `the word after the interpolation opening with a capital`,
			code: `p.#{$name} { #{$attr}-Color: blue; }`,
		},
		{
			description: `a declaration under a placeholder selector`,
			code: `#context a%extreme { COLOR: red; }`,
		},
		{
			description: `a declaration inside an at-root block`,
			code: `.parent { @at-root { .child1 { DISPLAY: block; } } }`,
		},
		{
			description: `a declaration inside a mixin`,
			code: `@mixin large-text { FONT-SIZE: 20px; }`,
		},
		{
			description: `a declaration inside a conditional at-rule`,
			code: `p { @if 1 + 1 == 2 { BORDER: 1px solid;  } }`,
		},
	],

	reject: [
		{
			description: `a property opening with a capital, under a selector referencing the parent`,
			code: `&-sidebar { Border: 1px solid; }`,
			fixed: `&-sidebar { BORDER: 1px solid; }`,
			line: 1,
			column: 13,
			endLine: 1,
			endColumn: 19,
			message: messages.expected(`Border`, `BORDER`),
		},
		{
			description: `a property opening with a capital, its value a parenthesised list`,
			code: `a { Font: (italic bold 10px/8px) }`,
			fixed: `a { FONT: (italic bold 10px/8px) }`,
			line: 1,
			column: 5,
			endLine: 1,
			endColumn: 9,
			message: messages.expected(`Font`, `FONT`),
		},
		{
			description: `a property opening with a capital inside a nested property block`,
			code: `a { font: { Size: 30em; } }`,
			fixed: `a { font: { SIZE: 30em; } }`,
			line: 1,
			column: 13,
			endLine: 1,
			endColumn: 17,
			message: messages.expected(`Size`, `SIZE`),
		},
		{
			description: `a property opening with a capital under a placeholder selector`,
			code: `#context a%extreme { Color: red; }`,
			fixed: `#context a%extreme { COLOR: red; }`,
			line: 1,
			column: 22,
			endLine: 1,
			endColumn: 27,
			message: messages.expected(`Color`, `COLOR`),
		},
		{
			description: `a property opening with a capital inside an at-root block`,
			code: `.parent { @at-root { .child1 { Display: block; } } }`,
			fixed: `.parent { @at-root { .child1 { DISPLAY: block; } } }`,
			line: 1,
			column: 32,
			endLine: 1,
			endColumn: 39,
			message: messages.expected(`Display`, `DISPLAY`),
		},
		{
			description: `a property opening with a capital inside a mixin`,
			code: `@mixin large-text { Font-size: 20px; }`,
			fixed: `@mixin large-text { FONT-SIZE: 20px; }`,
			line: 1,
			column: 21,
			endLine: 1,
			endColumn: 30,
			message: messages.expected(`Font-size`, `FONT-SIZE`),
		},
		{
			description: `a property opening with a capital inside a conditional at-rule`,
			code: `p { @if 1 + 1 == 2 { Border: 1px solid;  } }`,
			fixed: `p { @if 1 + 1 == 2 { BORDER: 1px solid;  } }`,
			line: 1,
			column: 22,
			endLine: 1,
			endColumn: 28,
			message: messages.expected(`Border`, `BORDER`),
		},
	],
})
