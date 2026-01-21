import { testRule } from "stylelint-test-rule-node"

import plugins from "../../index.js"

import { messages, ruleName } from "./index.js"

testRule({
	plugins,
	ruleName,
	config: [true],
	fix: true,

	accept: [
		{
			code: ``,
		},
		{
			code: `\n`,
		},
		{
			code: `a { color: pink; }\n`,
		},
		{
			code: `a { color: pink; }\r\n`,
		},
		{
			code: `a { color: pink; }\n\n\n`,
		},
		{
			code: `a { color: pink; }\r\n\r\n\r\n`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }`,
			fixed: `a { color: pink; }\n`,
			message: messages.rejected,
			line: 1,
			column: 18,
		},
		{
			code: `a { color: pink; }\n\n\nb{ color: orange; }`,
			fixed: `a { color: pink; }\n\n\nb{ color: orange; }\n`,
			message: messages.rejected,
			line: 4,
			column: 19,
		},
		{
			code: `a { color: pink; }\r\n\r\n\r\nb{ color: orange; }`,
			fixed: `a { color: pink; }\r\n\r\n\r\nb{ color: orange; }\r\n`,
			message: messages.rejected,
			line: 4,
			column: 19,
		},
		{
			code: `&.active {\n    top:\n    .tab {}\n}`,
			fixed: `&.active {\n    top:\n    .tab {}\n}\n`,
			message: messages.rejected,
			line: 4,
			column: 1,
		},
		{
			code: `&.active {\r\n    top:\r\n    .tab {}\r\n}`,
			fixed: `&.active {\r\n    top:\r\n    .tab {}\r\n}\r\n`,
			message: messages.rejected,
			line: 4,
			column: 1,
		},
	],
})

testRule({
	plugins,
	ruleName,
	config: [true],
	customSyntax: `postcss-html`,

	accept: [
		{
			code: `<div>
<style>
a {
  color: red;
}
</style>

</div>`,
		},
		{
			code: `<a style="color: red;"></a>`,
		},
	],

	reject: [
		{
			code: `<div>
<style>a {
  color: red;
}</style>

</div>`,
			message: messages.rejected,
			line: 4,
			column: 1,
		},
	],
})
