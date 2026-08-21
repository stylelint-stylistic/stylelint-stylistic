import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `an empty stylesheet carrying a byte order mark`,
			code: `\uFEFF`,
		},
		{
			description: `a stylesheet opening with a byte order mark`,
			code: `\uFEFFa{}`,
		},
	],

	reject: [
		{
			description: `an empty stylesheet with no byte order mark`,
			code: ``,
			message: messages.expected,
		},
		{
			description: `a stylesheet with no byte order mark`,
			code: `a{}`,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `an empty stylesheet with no byte order mark`,
			code: ``,
		},
		{
			description: `a stylesheet with no byte order mark`,
			code: `a{}`,
		},
	],

	reject: [
		{
			description: `an empty stylesheet carrying a byte order mark`,
			code: `\uFEFF`,
			message: messages.rejected,
		},
		{
			description: `a stylesheet opening with a byte order mark`,
			code: `\uFEFFa{}`,
			message: messages.rejected,
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-html`,
	config: [`always`],

	accept: [
		{
			description: `a style attribute inside a document, which the rule passes over`,
			code: `<a style="color: red;"></a>`,
		},
		{
			description: `a mark inside a style attribute, passed over for the same reason`,
			code: `<a style="\uFEFFcolor: red;"></a>`,
		},
		{
			description: `an embedded stylesheet inside a document`,
			code: `<style>a{}</style>`,
		},
		{
			description: `a mark inside an embedded stylesheet`,
			code: `<style>\uFEFFa{}</style>`,
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-html`,
	config: [`never`],

	accept: [
		{
			description: `a style attribute inside a document, which the rule passes over`,
			code: `<a style="color: red;"></a>`,
		},
		{
			description: `a mark inside a style attribute, passed over for the same reason`,
			code: `<a style="\uFEFFcolor: red;"></a>`,
		},
		{
			description: `an embedded stylesheet inside a document`,
			code: `<style>a{}</style>`,
		},
		{
			description: `a mark inside an embedded stylesheet`,
			code: `<style>\uFEFFa{}</style>`,
		},
	],
})
