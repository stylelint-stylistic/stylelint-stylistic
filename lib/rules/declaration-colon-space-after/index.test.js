import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a { --a: ; }`,
			description: `space only empty custom property value after`,
		},
		{
			code: `a { --a: ; color: red; }`,
			description: `space only empty custom property value after with other declarations`,
		},
		{
			code: `a { color: pink }`,
			description: `space only after`,
		},
		{
			code: `a { color : pink }`,
			description: `space before and after`,
		},
		{
			code: `a { color\n: pink }`,
			description: `newline before and space after`,
		},
		{
			code: `a { color\r\n: pink }`,
			description: `CRLF before and space after`,
		},
		{
			code: `$map:(key:value)`,
			description: `SCSS map with no newlines`,
		},
		{
			code: `$list:('value1', 'value2')`,
			description: `SCSS lst with no newlines`,
		},
		{
			code: `a { background: url(data:application/font-woff;...); }`,
			description: `data URI`,
		},
	],

	reject: [
		{
			code: `a { --a:; }`,
			fixed: `a { --a: ; }`,
			description: `no space empty custom property value after`,
			message: messages.expectedAfter(),
			line: 1,
			column: 9,
		},
		{
			code: `a { --a:  ; }`,
			fixed: `a { --a: ; }`,
			description: `two spaces empty custom property value after`,
			message: messages.expectedAfter(),
			line: 1,
			column: 9,
		},
		{
			code: `a {\n\t--a:;\n}`,
			fixed: `a {\n\t--a: ;\n}`,
			description: `no space empty custom property value after`,
			message: messages.expectedAfter(),
			line: 2,
			column: 6,
		},
		{
			code: `a {\n\t--a:  ;\n}`,
			fixed: `a {\n\t--a: ;\n}`,
			description: `two spaces empty custom property value after`,
			message: messages.expectedAfter(),
			line: 2,
			column: 6,
		},
		{
			code: `a {\n\t--a:\n\t;\n}`,
			fixed: `a {\n\t--a: ;\n}`,
			description: `multi-line empty custom property value after`,
			message: messages.expectedAfter(),
			line: 2,
			column: 6,
		},
		{
			code: `a { color :pink; }`,
			fixed: `a { color : pink; }`,
			description: `no space after`,
			message: messages.expectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color :  pink; }`,
			fixed: `a { color : pink; }`,
			description: `two spaces after`,
			message: messages.expectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color :\tpink; }`,
			fixed: `a { color : pink; }`,
			description: `tab after`,
			message: messages.expectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color :\npink; }`,
			fixed: `a { color : pink; }`,
			description: `newline after`,
			message: messages.expectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color :\r\npink; }`,
			fixed: `a { color : pink; }`,
			description: `CRLF after`,
			message: messages.expectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color:pink; }`,
			fixed: `a { color: pink; }`,
			description: `no space after`,
			message: messages.expectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color/*comment*/:/*comment*/pink; }`,
			fixed: `a { color/*comment*/: /*comment*/pink; }`,
			description: `comment`,
			message: messages.expectedAfter(),
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
			code: `a { --a:; color:red; }`,
			description: `no space empty custom property value after`,
		},
		{
			code: `a { color:pink }`,
			description: `no space before and after`,
		},
		{
			code: `a { color :pink }`,
			description: `space before and no space after`,
		},
		{
			code: `a { color\n:pink }`,
			description: `newline before and no space after`,
		},
		{
			code: `a { color\r\n:pink }`,
			description: `CRLF before and no space after`,
		},
		{
			code: `$map: (key: value)`,
			description: `SCSS map with no newlines`,
		},
	],

	reject: [
		{
			code: `a { --a: ; color:red; }`,
			fixed: `a { --a:; color:red; }`,
			description: `spaced empty custom property value after`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 9,
		},
		{
			code: `a { color : pink; }`,
			fixed: `a { color :pink; }`,
			description: `space after`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color:  pink; }`,
			fixed: `a { color:pink; }`,
			description: `two spaces after`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color :\tpink; }`,
			fixed: `a { color :pink; }`,
			description: `tab after`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color :\npink; }`,
			fixed: `a { color :pink; }`,
			description: `newline after`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color :\r\npink; }`,
			fixed: `a { color :pink; }`,
			description: `CRLF after`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color/*comment*/ : /*comment*/pink; }`,
			fixed: `a { color/*comment*/ :/*comment*/pink; }`,
			description: `comment`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 11,
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			code: `a { --a: ; color: red; }`,
			description: `space only empty custom property value after single-line with other declarations`,
		},
		{
			code: `a { --a: ; }`,
			description: `space only empty custom property value after single-line`,
		},
		{
			code: `a { color: pink }`,
			description: `space only after single-line`,
		},
		{
			code: `a { transition: color 1s,\n\twidth 2s; }`,
			description: `space after mult-line`,
		},
		{
			code: `a { transition:color 1s,\n\twidth 2s; }`,
			description: `no space after mult-line`,
		},
		{
			code: `a { transition:color 1s,\r\n\twidth 2s; }`,
			description: `no space after mult-line CRLF`,
		},
		{
			code: `a { transition:\tcolor 1s,\n\twidth 2s; }`,
			description: `tab after mult-line`,
		},
	],

	reject: [
		{
			code: `a { --a:; }`,
			fixed: `a { --a: ; }`,
			description: `no space empty custom property value after single-line`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 9,
		},
		{
			code: `a { --a:  ; }`,
			fixed: `a { --a: ; }`,
			description: `two spaces empty custom property value after single-line`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 9,
		},
		{
			code: `a { --a:  ; color: red; }`,
			fixed: `a { --a: ; color: red; }`,
			description: `two spaces empty custom property value after single-line with other declarations`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 9,
		},
		{
			code: `a { color :pink; }`,
			fixed: `a { color : pink; }`,
			description: `no space after single-line`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color :  pink; }`,
			fixed: `a { color : pink; }`,
			description: `two spaces after single-line`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color :\tpink; }`,
			fixed: `a { color : pink; }`,
			description: `tab after single-line`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color :\npink; }`,
			fixed: `a { color : pink; }`,
			description: `newline after single-line`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color :\r\npink; }`,
			fixed: `a { color : pink; }`,
			description: `CRLF after single-line`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color:pink; }`,
			fixed: `a { color: pink; }`,
			description: `no space after`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 11,
		},
		{
			code: `a { color/*comment*/:/*comment*/pink; }`,
			fixed: `a { color/*comment*/: /*comment*/pink; }`,
			description: `comment`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 11,
		},
	],
})
