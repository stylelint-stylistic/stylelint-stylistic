import { createRule } from "../../../../rules/media-feature-name-case/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`lower`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `a Less variable as the value`,
			code: `@media (min-width: @tablet) { }`,
		},
		{
			description: `a Less operation as the value`,
			code: `@media (min-width: (@value + 10px)) { }`,
		},
		{
			description: `a Less variable standing for the whole first query`,
			code: `@media @smartphones and (orientation: landscape) { }`,
		},
		{
			description: `a Less variable standing for the whole query list`,
			code: `@media @smartphones { }`,
		},
		{
			description: `a Less variable, a comment and a lower-case feature name`,
			code: `@media @smartphones /* comments */ and (orientation: landscape) {}`,
		},
	],

	reject: [
		{
			description: `an upper-case feature name with a Less variable value`,
			code: `@media (MIN-WIDTH: @tablet) { }`,
			fixed: `@media (min-width: @tablet) { }`,
			line: 1,
			column: 9,
			message: messages.expected(`MIN-WIDTH`, `min-width`),
		},
		{
			description: `an upper-case feature name with a Less operation value`,
			code: `@media (MIN-WIDTH: (@value + 10px)) { }`,
			fixed: `@media (min-width: (@value + 10px)) { }`,
			line: 1,
			column: 9,
			message: messages.expected(`MIN-WIDTH`, `min-width`),
		},
		{
			description: `an upper-case feature name after a Less variable query`,
			code: `@media @smartphones and (ORIENTATION: landscape) { }`,
			fixed: `@media @smartphones and (orientation: landscape) { }`,
			line: 1,
			column: 26,
			message: messages.expected(`ORIENTATION`, `orientation`),
		},
		{
			description: `an upper-case feature name after a Less variable query and a comment`,
			code: `@media @smartphones /* comments */ and (ORIENTATION: landscape) {}`,
			fixed: `@media @smartphones /* comments */ and (orientation: landscape) {}`,
			line: 1,
			column: 41,
			message: messages.expected(`ORIENTATION`, `orientation`),
		},
	],
})
testRule({
	ruleName,
	config: [`upper`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `an upper-case feature name with a Less variable value`,
			code: `@media (MIN-WIDTH: @tablet) { }`,
		},
		{
			description: `an upper-case feature name with a Less operation value`,
			code: `@media (MIN-WIDTH: (@value + 10px)) { }`,
		},
		{
			description: `an upper-case feature name after a Less variable query`,
			code: `@media @smartphones and (ORIENTATION: landscape) { }`,
		},
		{
			description: `an upper-case feature name after a Less variable query and a comment`,
			code: `@media @smartphones /* comments */ and (ORIENTATION: landscape) { }`,
		},
		{
			description: `a Less variable standing for the whole query list`,
			code: `@media @smartphones { }`,
		},
	],

	reject: [
		{
			description: `a lower-case feature name with a Less variable value`,
			code: `@media (min-width: @tablet) { }`,
			fixed: `@media (MIN-WIDTH: @tablet) { }`,
			line: 1,
			column: 9,
			message: messages.expected(`min-width`, `MIN-WIDTH`),
		},
		{
			description: `a lower-case feature name with a Less operation value`,
			code: `@media (min-width: (@value + 10px)) { }`,
			fixed: `@media (MIN-WIDTH: (@value + 10px)) { }`,
			line: 1,
			column: 9,
			message: messages.expected(`min-width`, `MIN-WIDTH`),
		},
		{
			description: `a lower-case feature name after a Less variable query`,
			code: `@media @smartphones and (orientation: landscape) { }`,
			fixed: `@media @smartphones and (ORIENTATION: landscape) { }`,
			line: 1,
			column: 26,
			message: messages.expected(`orientation`, `ORIENTATION`),
		},
		{
			description: `a lower-case feature name after a Less variable query and a comment`,
			code: `@media @smartphones /* comments */ and (orientation: landscape) { }`,
			fixed: `@media @smartphones /* comments */ and (ORIENTATION: landscape) { }`,
			line: 1,
			column: 41,
			message: messages.expected(`orientation`, `ORIENTATION`),
		},
		{
			description: `a lower-case feature name after a Less variable variable`,
			code: `@media @@smartphones /* comments */ and (orientation: landscape) { }`,
			fixed: `@media @@smartphones /* comments */ and (ORIENTATION: landscape) { }`,
			line: 1,
			column: 42,
			endLine: 1,
			endColumn: 53,
			message: messages.expected(`orientation`, `ORIENTATION`),
		},
	],
})
