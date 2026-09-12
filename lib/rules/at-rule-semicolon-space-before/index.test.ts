import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		// See #703
		{
			description: `an encoding declaration, whose semicolon the specification puts on the closing quotation mark`,
			code: `@charset "UTF-8";`,
		},
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
			// See #395
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
		// See #703
		{
			description: `a charset rule whose single quotes declare no encoding, so the warning stands while a neighbour may still make it one`,
			code: `@charset 'UTF-8';`,
			fixed: `@charset 'UTF-8';`,
			line: 1,
			column: 16,
			message: messages.expectedBefore(),
		},
		{
			description: `the same rule with its name in upper case, which the at-rule name case rule under lower recases in the very same run`,
			code: `@CHARSET "UTF-8";`,
			fixed: `@CHARSET "UTF-8";`,
			line: 1,
			column: 16,
			message: messages.expectedBefore(),
		},
		{
			description: `the same rule spelled with two spaces, which declares none either`,
			code: `@charset  "UTF-8";`,
			fixed: `@charset  "UTF-8";`,
			line: 1,
			column: 17,
			message: messages.expectedBefore(),
		},
		{
			// See #357
			description: `an at-rule spelled without a space in front of its options, which the parser gives the shape of a call to a Less detached ruleset`,
			code: `@layer(l);`,
			fixed: `@layer(l) ;`,
			line: 1,
			column: 9,
			message: messages.expectedBefore(),
		},
		{
			// See #697
			description: `a block comment in front of the semicolon, behind which the space goes`,
			code: `@import "x" /* c */;`,
			fixed: `@import "x" /* c */ ;`,
			line: 1,
			column: 19,
			message: messages.expectedBefore(),
		},
		{
			description: `the same comment abutting the params`,
			code: `@import "x"/* c */;`,
			fixed: `@import "x"/* c */ ;`,
			line: 1,
			column: 18,
			message: messages.expectedBefore(),
		},
		{
			description: `a semicolon abutting the params`,
			code: `@import "styles/mystyle";`,
			fixed: `@import "styles/mystyle" ;`,
			line: 1,
			column: 24,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces where one belongs`,
			code: `@import "styles/mystyle"  ;`,
			fixed: `@import "styles/mystyle" ;`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab where the space belongs`,
			code: `@import "styles/mystyle"\t;`,
			fixed: `@import "styles/mystyle" ;`,
			line: 1,
			column: 25,
			message: messages.expectedBefore(),
		},
		{
			description: `a break where the space belongs`,
			code: `@import "styles/mystyle"\n;`,
			fixed: `@import "styles/mystyle" ;`,
			line: 1,
			column: 25,
			message: messages.expectedBefore(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `@import "styles/mystyle"\r\n;`,
			fixed: `@import "styles/mystyle" ;`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
		{
			description: `params broken over three lines, with the semicolon abutting them`,
			code: `@import\nurl('landscape.css')\nprojection;`,
			fixed: `@import\nurl('landscape.css')\nprojection ;`,
			line: 3,
			column: 10,
			message: messages.expectedBefore(),
		},
		{
			// See #545
			description: `a semicolon abutting the params of an at-rule indented inside a block, which the block does spell`,
			code: `
				a {
					@import "styles/mystyle";
				}
			`,
			fixed: `
				a {
					@import "styles/mystyle" ;
				}
			`,
			line: 2,
			column: 25,
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
			fixed: `
				a {
					@import "styles/mystyle" ;
					color: pink
				}
			`,
			line: 2,
			column: 25,
			message: messages.expectedBefore(),
		},
		{
			description: `the same at-rule with a blank line in front of it, whose leading raw is wide enough to carry a position onto the line below`,
			code: `
				a {

					@import "styles/mystyle";
				}
			`,
			fixed: `
				a {

					@import "styles/mystyle" ;
				}
			`,
			line: 3,
			column: 25,
			message: messages.expectedBefore(),
		},
		{
			description: `the same at-rule behind a carriage-return pair, whose leading raw is a character wider than a line feed`,
			code: `@import "a" ;\r\n@import "b";`,
			fixed: `@import "a" ;\r\n@import "b" ;`,
			line: 2,
			column: 11,
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
			// See #395
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
			fixed: `@import "styles/mystyle";`,
			line: 1,
			column: 25,
			message: messages.rejectedBefore(),
		},
		{
			// See #697
			description: `a space in front of the semicolon of a charset rule, which the specification reads no whitespace in front of either`,
			code: `@charset "UTF-8" ;`,
			fixed: `@charset "UTF-8";`,
			line: 1,
			column: 17,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space between a block comment and the semicolon`,
			code: `@import "x" /* c */ ;`,
			fixed: `@import "x" /* c */;`,
			line: 1,
			column: 20,
			message: messages.rejectedBefore(),
		},
		{
			description: `two spaces in front of the semicolon`,
			code: `@import "styles/mystyle"  ;`,
			fixed: `@import "styles/mystyle";`,
			line: 1,
			column: 26,
			message: messages.rejectedBefore(),
		},
		{
			description: `a tab in front of the semicolon`,
			code: `@import "styles/mystyle"\t;`,
			fixed: `@import "styles/mystyle";`,
			line: 1,
			column: 25,
			message: messages.rejectedBefore(),
		},
		{
			description: `a break in front of the semicolon`,
			code: `@import "styles/mystyle"\n;`,
			fixed: `@import "styles/mystyle";`,
			line: 1,
			column: 25,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `@import "styles/mystyle"\r\n;`,
			fixed: `@import "styles/mystyle";`,
			line: 1,
			column: 26,
			message: messages.rejectedBefore(),
		},
		{
			description: `params broken over three lines, with a space in front of the semicolon`,
			code: `@import\nurl('landscape.css')\nprojection ;`,
			fixed: `@import\nurl('landscape.css')\nprojection;`,
			line: 3,
			column: 11,
			message: messages.rejectedBefore(),
		},
		{
			// See #545
			description: `a space in front of the semicolon of an at-rule indented inside a block, which the block does spell`,
			code: `
				a {
					@import "styles/mystyle" ;
				}
			`,
			fixed: `
				a {
					@import "styles/mystyle";
				}
			`,
			line: 2,
			column: 26,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same at-rule with a blank line in front of it, whose leading raw is wide enough to carry a position onto the line below`,
			code: `
				a {

					@import "styles/mystyle" ;
				}
			`,
			fixed: `
				a {

					@import "styles/mystyle";
				}
			`,
			line: 3,
			column: 26,
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
			// See #395
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
			fixed: `<div style="@import 'x' ;">x</div>`,
			line: 1,
			column: 23,
			message: messages.expectedBefore(),
		},
		{
			// See #545
			description: `a style block whose at-rule abuts the semicolon the declaration block does spell`,
			code: `<style>\n\ta {\n\t\t@import "x";\n\t}\n</style>`,
			fixed: `<style>\n\ta {\n\t\t@import "x" ;\n\t}\n</style>`,
			line: 3,
			column: 13,
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
			// See #395
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
			fixed: `<div style="@import 'x';">x</div>`,
			line: 1,
			column: 24,
			message: messages.rejectedBefore(),
		},
		{
			// See #545
			description: `a style block with a space in front of the semicolon the declaration block does spell`,
			code: `<style>\n\ta {\n\t\t@import "x" ;\n\t}\n</style>`,
			fixed: `<style>\n\ta {\n\t\t@import "x";\n\t}\n</style>`,
			line: 3,
			column: 14,
			message: messages.rejectedBefore(),
		},
	],
})
