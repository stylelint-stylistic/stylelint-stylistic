import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `\uFEFF`,
			description: `an empty stylesheet carrying a byte order mark`,
		},
		{
			code: `\uFEFFa{}`,
			description: `a stylesheet opening with a byte order mark`,
		},
	],

	reject: [
		{
			code: ``,
			description: `an empty stylesheet with no byte order mark`,
			message: messages.expected,
		},
		{
			code: `a{}`,
			description: `a stylesheet with no byte order mark`,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: ``,
			description: `an empty stylesheet with no byte order mark`,
		},
		{
			code: `a{}`,
			description: `a stylesheet with no byte order mark`,
		},
	],

	reject: [
		{
			code: `\uFEFF`,
			description: `an empty stylesheet carrying a byte order mark`,
			message: messages.rejected,
		},
		{
			code: `\uFEFFa{}`,
			description: `a stylesheet opening with a byte order mark`,
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
			code: `<a style="color: red;"></a>`,
			description: `a style attribute inside a document, which the rule passes over`,
		},
		{
			code: `<a style="\uFEFFcolor: red;"></a>`,
			description: `a mark inside a style attribute, passed over for the same reason`,
		},
		{
			code: `<style>a{}</style>`,
			description: `an embedded stylesheet inside a document`,
		},
		{
			code: `<style>\uFEFFa{}</style>`,
			description: `a mark inside an embedded stylesheet`,
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-html`,
	config: [`never`],

	accept: [
		{
			code: `<a style="color: red;"></a>`,
			description: `a style attribute inside a document, which the rule passes over`,
		},
		{
			code: `<a style="\uFEFFcolor: red;"></a>`,
			description: `a mark inside a style attribute, passed over for the same reason`,
		},
		{
			code: `<style>a{}</style>`,
			description: `an embedded stylesheet inside a document`,
		},
		{
			code: `<style>\uFEFFa{}</style>`,
			description: `a mark inside an embedded stylesheet`,
		},
	],
})
