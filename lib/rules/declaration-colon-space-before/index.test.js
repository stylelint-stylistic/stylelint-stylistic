import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName, autoStripIndent: true })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a { color :pink }`,
			description: `space only before`,
		},
		{
			code: `a { color : pink }`,
			description: `space before and after`,
		},
		{
			code: `a { color :\npink }`,
			description: `space before and newline after`,
		},
		{
			code: `a { color :\r\npink }`,
			description: `space before and CRLF after`,
		},
		{
			code: `$map:(key:value)`,
			description: `SCSS map with no newlines`,
		},
		{
			code: `$list:('value1', 'value2')`,
			description: `SCSS list with no newlines`,
		},
		{
			code: `a { background : url(data:application/font-woff;...); }`,
			description: `data URI`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
			code: `a { color/* https://foo.bar/ */ :pink; }`,
			description: `comment with an URL, space before the declaration's own colon`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }`,
			fixed: `a { color : pink; }`,
			description: `no space before`,
			message: messages.expectedBefore(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color  : pink; }`,
			fixed: `a { color : pink; }`,
			description: `two spaces before`,
			message: messages.expectedBefore(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color\t: pink; }`,
			fixed: `a { color : pink; }`,
			description: `tab before`,
			message: messages.expectedBefore(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color\n: pink; }`,
			fixed: `a { color : pink; }`,
			description: `newline before`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { color\r\n: pink; }`,
			fixed: `a { color : pink; }`,
			description: `CRLF before`,
			message: messages.expectedBefore(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color/*comment*/:/*comment*/pink; }`,
			fixed: `a { color/*comment*/ :/*comment*/pink; }`,
			description: `comment`,
			message: messages.expectedBefore(),
			line: 1,
			column: 11,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/88
			code: `a { color/* keep // me */:/*comment*/pink; }`,
			fixed: `a { color/* keep // me */ :/*comment*/pink; }`,
			description: `comment holding a double slash`,
			message: messages.expectedBefore(),
			line: 1,
			column: 11,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
			code: `a { color/* https://foo.bar/ */:pink; }`,
			fixed: `a { color/* https://foo.bar/ */ :pink; }`,
			description: `comment with an URL`,
			message: messages.expectedBefore(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color/* a:b */:pink; }`,
			fixed: `a { color/* a:b */ :pink; }`,
			description: `comment holding a colon`,
			message: messages.expectedBefore(),
			line: 1,
			column: 11,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `a { color:pink }`,
			description: `no space before and after`,
		},
		{
			code: `a { color: pink }`,
			description: `no space before and space after`,
		},
		{
			code: `a { color:\npink }`,
			description: `no space before and newline after`,
		},
		{
			code: `a { color:\r\npink }`,
			description: `no space before and CRLF after`,
		},
		{
			code: `$map :(key :value)`,
			description: `SCSS map with no newlines`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
			code: `a { color/* https://foo.bar/ */:pink; }`,
			description: `comment with an URL, no space before the declaration's own colon`,
		},
	],

	reject: [
		{
			code: `a { color : pink; }`,
			fixed: `a { color: pink; }`,
			description: `space before`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color  : pink; }`,
			fixed: `a { color: pink; }`,
			description: `two spaces before`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color\t: pink; }`,
			fixed: `a { color: pink; }`,
			description: `tab before`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color\n: pink; }`,
			fixed: `a { color: pink; }`,
			description: `newline before`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a { color\r\n: pink; }`,
			fixed: `a { color: pink; }`,
			description: `CRLF before`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color/*comment*/ :/*comment*/pink; }`,
			fixed: `a { color/*comment*/:/*comment*/pink; }`,
			description: `comment`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 11,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/88
			code: `a { color/* keep // me */ :/*comment*/pink; }`,
			fixed: `a { color/* keep // me */:/*comment*/pink; }`,
			description: `comment holding a double slash`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 11,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92
			code: `a { color/* https://foo.bar/ */ :pink; }`,
			fixed: `a { color/* https://foo.bar/ */:pink; }`,
			description: `comment with an URL`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color/* a:b */ :pink; }`,
			fixed: `a { color/* a:b */:pink; }`,
			description: `comment holding a colon`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 11,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/88
			description: `inline comment before the colon: the colon cannot leave its line, so the code is left alone and the warning stands`,
			code: `
				a {
					color // keep me
					: pink;
				}
			`,
			fixed: `
				a {
					color // keep me
					: pink;
				}
			`,
			message: messages.expectedBefore(),
			line: 2,
			column: 8,
		},
		{
			code: `a { color // keep me\r\n: pink; }`,
			fixed: `a { color // keep me\r\n: pink; }`,
			description: `CRLF, inline comment: the line ending survives untouched`,
			message: messages.expectedBefore(),
			line: 1,
			column: 11,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/88
			description: `inline comment before the colon: the colon cannot leave its line, so the code is left alone and the warning stands`,
			code: `
				a {
					color // keep me
					: pink;
				}
			`,
			fixed: `
				a {
					color // keep me
					: pink;
				}
			`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 8,
		},
		{
			code: `a { color // keep me\r\n: pink; }`,
			fixed: `a { color // keep me\r\n: pink; }`,
			description: `CRLF, inline comment: the line ending survives untouched`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 11,
		},
	],
})
