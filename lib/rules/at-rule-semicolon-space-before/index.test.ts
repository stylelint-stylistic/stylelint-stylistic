import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a space in front of the semicolon`,
			code: `@import "styles/mystyle" ;`,
		},
		{
			description: `a declaration block, whose own semicolons this rule says nothing about`,
			code: `
				@font-face {
				 font-family: "MyFont"; src: url("myfont.woff2") format("woff2");
				}
			`,
		},
		{
			description: `an at-rule carrying a block and a stray semicolon behind it`,
			code: `
				@font-face {
				 font-family: "MyFont"; src: url("myfont.woff2") format("woff2");
				};
			`,
		},
		{
			description: `a Less variable in a value, which is no at-rule`,
			code: `a { color: @brand-primary; }`,
		},
		{
			description: `a semicolon standing in a string, which closes nothing`,
			code: `@myatrule "valuehassemicolon;" ;`,
		},
		{
			description: `a semicolon standing in a URL, which closes nothing`,
			code: `@import url(http://www.example.com/location;withsemicolon) ;`,
		},
		{
			description: `a semicolon standing in a comment, which closes nothing`,
			code: `@import /*my styles;*/ "styles/mystyle" ;`,
		},
		{
			description: `params broken over three lines, with the space in front of the semicolon`,
			code: `@import\nurl('landscape.css')\nprojection ;`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/395
			description: `a bodiless at-rule closing its block, which the file spells no semicolon behind`,
			code: `
				a {
					@import "styles/mystyle"
				}
			`,
		},
		{
			description: `the same at-rule with a comment behind it, which the parser swallows into the at-rule rather than into a node of its own`,
			code: `
				a {
					@import "styles/mystyle"
					/* c */
				}
			`,
		},
		{
			description: `a bodiless at-rule closing the file, which the file spells no semicolon behind`,
			code: `@import "styles/mystyle"`,
		},
		{
			description: `an at-rule carrying neither parameters nor a semicolon, which PostCSS gives no source end`,
			code: `
				a {
					@content
				}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/357
			description: `an at-rule spelled without a space in front of its options, which the parser gives the shape of a call to a Less detached ruleset`,
			code: `@layer(l);`,
			line: 1,
			column: 9,
			message: messages.expectedBefore(),
		},
		{
			description: `a semicolon abutting the params`,
			code: `@import "styles/mystyle";`,
			line: 1,
			column: 24,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces where one belongs`,
			code: `@import "styles/mystyle"  ;`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab where the space belongs`,
			code: `@import "styles/mystyle"\t;`,
			line: 1,
			column: 25,
			message: messages.expectedBefore(),
		},
		{
			description: `a break where the space belongs`,
			code: `@import "styles/mystyle"\n;`,
			line: 1,
			column: 25,
			message: messages.expectedBefore(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `@import "styles/mystyle"\r\n;`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
		{
			description: `params broken over three lines, with the semicolon abutting them`,
			code: `@import\nurl('landscape.css')\nprojection;`,
			line: 3,
			column: 10,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/545
			description: `a semicolon abutting the params of an at-rule closing its block, which the block does spell, whose column stands two past the mark, displaced by the leading raw of the at-rule`,
			code: `
				a {
					@import "styles/mystyle";
				}
			`,
			line: 2,
			column: 27,
			message: messages.expectedBefore(),
		},
		{
			description: `the same semicolon with a declaration standing behind it`,
			code: `
				a {
					@import "styles/mystyle";
					color: pink
				}
			`,
			line: 2,
			column: 27,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a semicolon abutting the params`,
			code: `@import "styles/mystyle";`,
		},
		{
			description: `a declaration block, whose own spacing this rule says nothing about`,
			code: `
				@font-face {
				 font-family: "MyFont" ; src: url("myfont.woff2") format("woff2") ;
				}
			`,
		},
		{
			description: `an at-rule carrying a block, whose stray semicolon carries a space`,
			code: `
				@font-face {
				 font-family: "MyFont" ; src: url("myfont.woff2") format("woff2") ;
				} ;
			`,
		},
		{
			description: `a Less variable in a value, which is no at-rule`,
			code: `a { color: @brand-primary ; }`,
		},
		{
			description: `a semicolon standing in a string, which closes nothing`,
			code: `@myatrule "valuehassemicolon ;";`,
		},
		{
			description: `a semicolon standing in a URL, which closes nothing`,
			code: `@import url(http://www.example.com/location+;withsemicolon);`,
		},
		{
			description: `a semicolon standing in a comment, which closes nothing`,
			code: `@import /*my styles ;*/ "styles/mystyle";`,
		},
		{
			description: `params broken over three lines, with the semicolon abutting them`,
			code: `@import\nurl('landscape.css')\nprojection;`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/395
			description: `a bodiless at-rule closing its block on the block's own line, which the file spells no semicolon behind`,
			code: `a { @import "styles/mystyle" }`,
		},
		{
			description: `the same at-rule with the closing brace on a line of its own`,
			code: `
				a {
					@import "styles/mystyle"
				}
			`,
		},
		{
			description: `the same at-rule with a comment behind it, which the parser swallows into the at-rule rather than into a node of its own`,
			code: `
				a {
					@import "styles/mystyle"
					/* c */
				}
			`,
		},
		{
			description: `an at-rule carrying neither parameters nor a semicolon, which PostCSS gives no source end`,
			code: `
				a {
					@content
				}
			`,
		},
	],

	reject: [
		{
			description: `a space in front of the semicolon`,
			code: `@import "styles/mystyle" ;`,
			line: 1,
			column: 25,
			message: messages.rejectedBefore(),
		},
		{
			description: `two spaces in front of the semicolon`,
			code: `@import "styles/mystyle"  ;`,
			line: 1,
			column: 26,
			message: messages.rejectedBefore(),
		},
		{
			description: `a tab in front of the semicolon`,
			code: `@import "styles/mystyle"\t;`,
			line: 1,
			column: 25,
			message: messages.rejectedBefore(),
		},
		{
			description: `a break in front of the semicolon`,
			code: `@import "styles/mystyle"\n;`,
			line: 1,
			column: 25,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `@import "styles/mystyle"\r\n;`,
			line: 1,
			column: 26,
			message: messages.rejectedBefore(),
		},
		{
			description: `params broken over three lines, with a space in front of the semicolon`,
			code: `@import\nurl('landscape.css')\nprojection ;`,
			line: 3,
			column: 11,
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/545
			description: `a space in front of the semicolon of an at-rule closing its block, which the block does spell, whose column stands two past the mark, displaced by the leading raw of the at-rule`,
			code: `
				a {
					@import "styles/mystyle" ;
				}
			`,
			line: 2,
			column: 28,
			message: messages.rejectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-html`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/395
			description: `a style attribute holding an at-rule the file spells no semicolon behind`,
			code: `<div style="@import 'x'">x</div>`,
		},
		{
			description: `a style block whose at-rule closes the block itself`,
			code: `<style>\n\t@import "x"\n</style>`,
		},
		{
			description: `a style block whose at-rule closes a declaration block inside it`,
			code: `<style>\n\ta {\n\t\t@import "x"\n\t}\n</style>`,
		},
	],

	reject: [
		{
			description: `a style attribute whose at-rule abuts the semicolon it does spell`,
			code: `<div style="@import 'x';">x</div>`,
			line: 1,
			column: 23,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/545
			description: `a style block whose at-rule abuts the semicolon the declaration block does spell, whose warning falls on the line of the closing brace, displaced by the at-rule's leading raw`,
			code: `<style>\n\ta {\n\t\t@import "x";\n\t}\n</style>`,
			line: 4,
			column: 1,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-html`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/395
			description: `a style block whose at-rule closes a declaration block, the closing brace standing on a line of its own`,
			code: `<style>\n\ta {\n\t\t@import "x"\n\t}\n</style>`,
		},
		{
			description: `the same at-rule with the closing brace on the at-rule's line`,
			code: `<style>\n\ta { @import "x" }\n</style>`,
		},
	],

	reject: [
		{
			description: `a style attribute with a space in front of the semicolon it does spell`,
			code: `<div style="@import 'x' ;">x</div>`,
			line: 1,
			column: 24,
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/545
			description: `a style block with a space in front of the semicolon the declaration block does spell, whose warning falls on the line of the closing brace, displaced by the at-rule's leading raw`,
			code: `<style>\n\ta {\n\t\t@import "x" ;\n\t}\n</style>`,
			line: 4,
			column: 1,
			message: messages.rejectedBefore(),
		},
	],
})
