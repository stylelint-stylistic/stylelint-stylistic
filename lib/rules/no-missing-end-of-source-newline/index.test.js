import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName, autoStripIndent: false })

testRule({
	ruleName,
	config: [true],

	accept: [
		{
			description: `an empty stylesheet`,
			code: ``,
		},
		{
			description: `a stylesheet holding a single newline`,
			code: `\n`,
		},
		{
			description: `a rule closed by a newline`,
			code: `a { color: pink; }\n`,
		},
		{
			description: `a rule closed by a carriage-return line break`,
			code: `a { color: pink; }\r\n`,
		},
		{
			description: `a rule closed by three newlines`,
			code: `a { color: pink; }\n\n\n`,
		},
		{
			description: `a rule closed by three carriage-return line breaks`,
			code: `a { color: pink; }\r\n\r\n\r\n`,
		},
		{
			description: `a rule closed by a bare carriage return`,
			code: `a { color: pink; }\r`,
		},
		{
			description: `a rule closed by three bare carriage returns`,
			code: `a { color: pink; }\r\r\r`,
		},
		{
			description: `a rule closed by a form feed`,
			code: `a { color: pink; }\f`,
		},
		{
			description: `a rule closed by three form feeds`,
			code: `a { color: pink; }\f\f\f`,
		},
	],

	reject: [
		{
			description: `a rule with no newline behind it`,
			code: `a { color: pink; }`,
			fixed: `a { color: pink; }\n`,
			line: 1,
			column: 18,
			message: messages.rejected,
		},
		{
			description: `two rules, the last of them with no newline behind it`,
			code: `a { color: pink; }\n\n\nb{ color: orange; }`,
			fixed: `a { color: pink; }\n\n\nb{ color: orange; }\n`,
			line: 4,
			column: 19,
			message: messages.rejected,
		},
		{
			description: `the same written with carriage-return line breaks`,
			code: `a { color: pink; }\r\n\r\n\r\nb{ color: orange; }`,
			fixed: `a { color: pink; }\r\n\r\n\r\nb{ color: orange; }\r\n`,
			line: 4,
			column: 19,
			message: messages.rejected,
		},
		{
			description: `the same written with bare carriage returns`,
			code: `a { color: pink; }\r\r\rb{ color: orange; }`,
			fixed: `a { color: pink; }\r\r\rb{ color: orange; }\r`,
			line: 1,
			column: 40,
			message: messages.rejected,
		},
		{
			description: `the same written with form feeds`,
			code: `a { color: pink; }\f\f\fb{ color: orange; }`,
			fixed: `a { color: pink; }\f\f\fb{ color: orange; }\f`,
			line: 1,
			column: 40,
			message: messages.rejected,
		},
		{
			description: `a rule closed by a bare carriage return with spaces behind it, which end the file on no line break at all`,
			code: `a { color: pink; }\r   `,
			fixed: `a { color: pink; }\r`,
			line: 1,
			column: 22,
			message: messages.rejected,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/369
		{
			description: `two free semicolons standing behind the block that ends the stylesheet`,
			code: `a { color: pink; };;`,
			fixed: `a { color: pink; };;\n`,
			line: 1,
			column: 20,
			message: messages.rejected,
		},
		{
			description: `the same written wider, each semicolon standing in a run of spaces`,
			code: `a { color: pink; }  ;  ;  `,
			fixed: `a { color: pink; }  ;  ;  \n`,
			line: 1,
			column: 26,
			message: messages.rejected,
		},
		{
			description: `a rule closed by spaces alone, which end the file on no line break at all`,
			code: `a { color: pink; }   `,
			fixed: `a { color: pink; }   \n`,
			line: 1,
			column: 21,
			message: messages.rejected,
		},
		{
			description: `a rule closed by two line breaks with spaces behind them, which end the file on no line break at all`,
			code: `a { color: pink; }\n\n   `,
			fixed: `a { color: pink; }\n\n`,
			line: 3,
			column: 3,
			message: messages.rejected,
		},
		{
			description: `a stylesheet holding nothing but two free semicolons, the whole of which stands in the raw the fix writes into`,
			code: `;;`,
			fixed: `;;\n`,
			line: 1,
			column: 2,
			message: messages.rejected,
		},
		{
			description: `a rule whose only line break stands inside a comment, which says nothing about how the file spells its lines`,
			code: `a { color:/*\r*/pink; }`,
			fixed: `a { color:/*\r*/pink; }\n`,
			line: 1,
			column: 22,
			message: messages.rejected,
		},
		{
			description: `a nested rule with no newline behind it`,
			code: `&.active {\n    top:\n    .tab {}\n}`,
			fixed: `&.active {\n    top:\n    .tab {}\n}\n`,
			line: 4,
			column: 1,
			message: messages.rejected,
		},
		{
			description: `the same written with carriage-return line breaks`,
			code: `&.active {\r\n    top:\r\n    .tab {}\r\n}`,
			fixed: `&.active {\r\n    top:\r\n    .tab {}\r\n}\r\n`,
			line: 4,
			column: 1,
			message: messages.rejected,
		},
	],
})

// The run of spaces and tabs a file ends on comes off only where the root's trailing raw is what holds it. Under `postcss-less` a bare carriage return or a form feed behind an end-of-line comment is swallowed into that comment along with the whitespace after it, so the raw is empty and there is nothing there to take off — the file is closed with a break instead. Under `postcss-scss` the same file parks that whitespace in the raw, and the run comes off as it does in plain CSS.
testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `an end-of-line comment ending in a bare carriage return with spaces behind it, which the syntax reads as part of that comment`,
			code: `a {}\n// c\r   `,
			fixed: `a {}\n// c\r   \n`,
			line: 2,
			column: 8,
			message: messages.rejected,
		},
		{
			description: `the same written with a form feed`,
			code: `a {}\n// c\f   `,
			fixed: `a {}\n// c\f   \n`,
			line: 2,
			column: 8,
			message: messages.rejected,
		},
	],
})

testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `an end-of-line comment ending in a bare carriage return with spaces behind it, which this syntax leaves in the root's trailing raw`,
			code: `a {}\n// c\r   `,
			fixed: `a {}\n// c\r`,
			line: 2,
			column: 8,
			message: messages.rejected,
		},
	],
})

testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-html`,

	accept: [
		{
			description: `an embedded stylesheet closed by a newline`,
			code: `<div>
<style>
a {
  color: red;
}
</style>

</div>`,
		},
		{
			description: `a style attribute, which carries no source of its own to close`,
			code: `<a style="color: red;"></a>`,
		},
		{
			description: `an embedded stylesheet closed by a bare carriage return`,
			code: `<div>\r<style>\ra {\r  color: red;\r}\r</style>\r\r</div>`,
		},
	],

	reject: [
		{
			description: `an embedded stylesheet with no newline at its end`,
			code: `<div>
<style>a {
  color: red;
}</style>

</div>`,
			line: 4,
			column: 1,
			message: messages.rejected,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/369
		{
			description: `an embedded stylesheet whose last block two free semicolons stand behind`,
			code: `<div>
<style>a {
  color: red;
};;</style>

</div>`,
			fixed: `<div>
<style>a {
  color: red;
};;
</style>

</div>`,
			line: 4,
			column: 3,
			message: messages.rejected,
		},
		{
			description: `the same with the embedded stylesheet written in bare carriage returns and the page around it in newlines, the break being read off the stylesheet`,
			code: `<div>\n<style>a {\r  color: red;\r}</style>\n\n</div>`,
			fixed: `<div>\n<style>a {\r  color: red;\r}\r</style>\n\n</div>`,
			line: 2,
			column: 26,
			message: messages.rejected,
		},
	],
})
