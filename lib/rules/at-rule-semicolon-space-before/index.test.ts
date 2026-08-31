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
	],

	reject: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/357
		{
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
	],
})
