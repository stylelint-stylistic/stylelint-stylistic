import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [true],

	accept: [
		{
			code: ``,
			description: `an empty stylesheet`,
		},
		{
			code: `\n`,
			description: `a stylesheet holding a single newline`,
		},
		{
			code: `a { color: pink; }\n`,
			description: `a rule closed by a newline`,
		},
		{
			code: `a { color: pink; }\r\n`,
			description: `a rule closed by a carriage-return line break`,
		},
		{
			code: `a { color: pink; }\n\n\n`,
			description: `a rule closed by three newlines`,
		},
		{
			code: `a { color: pink; }\r\n\r\n\r\n`,
			description: `a rule closed by three carriage-return line breaks`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }`,
			fixed: `a { color: pink; }\n`,
			description: `a rule with no newline behind it`,
			message: messages.rejected,
			line: 1,
			column: 18,
		},
		{
			code: `a { color: pink; }\n\n\nb{ color: orange; }`,
			fixed: `a { color: pink; }\n\n\nb{ color: orange; }\n`,
			description: `two rules, the last of them with no newline behind it`,
			message: messages.rejected,
			line: 4,
			column: 19,
		},
		{
			code: `a { color: pink; }\r\n\r\n\r\nb{ color: orange; }`,
			fixed: `a { color: pink; }\r\n\r\n\r\nb{ color: orange; }\r\n`,
			description: `the same written with carriage-return line breaks`,
			message: messages.rejected,
			line: 4,
			column: 19,
		},
		{
			code: `&.active {\n    top:\n    .tab {}\n}`,
			fixed: `&.active {\n    top:\n    .tab {}\n}\n`,
			description: `a nested rule with no newline behind it`,
			message: messages.rejected,
			line: 4,
			column: 1,
		},
		{
			code: `&.active {\r\n    top:\r\n    .tab {}\r\n}`,
			fixed: `&.active {\r\n    top:\r\n    .tab {}\r\n}\r\n`,
			description: `the same written with carriage-return line breaks`,
			message: messages.rejected,
			line: 4,
			column: 1,
		},
	],
})

testRule({
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
			description: `an embedded stylesheet closed by a newline`,
		},
		{
			code: `<a style="color: red;"></a>`,
			description: `a style attribute, which carries no source of its own to close`,
		},
	],

	reject: [
		{
			code: `<div>
<style>a {
  color: red;
}</style>

</div>`,
			description: `an embedded stylesheet with no newline at its end`,
			message: messages.rejected,
			line: 4,
			column: 1,
		},
	],
})
