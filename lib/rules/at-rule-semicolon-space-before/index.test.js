import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `@import "styles/mystyle" ;`,
			description: `a space in front of the semicolon`,
		},
		{
			code: `@font-face {\n font-family: "MyFont"; src: url("myfont.woff2") format("woff2");\n}`,
			description: `a declaration block, whose own semicolons this rule says nothing about`,
		},
		{
			code: `@font-face {\n font-family: "MyFont"; src: url("myfont.woff2") format("woff2");\n};`,
			description: `an at-rule carrying a block and a stray semicolon behind it`,
		},
		{
			code: `a { color: @brand-primary; }`,
			description: `a Less variable in a value, which is no at-rule`,
		},
		{
			code: `@myatrule "valuehassemicolon;" ;`,
			description: `a semicolon standing in a string, which closes nothing`,
		},
		{
			code: `@import url(http://www.example.com/location;withsemicolon) ;`,
			description: `a semicolon standing in a URL, which closes nothing`,
		},
		{
			code: `@import /*my styles;*/ "styles/mystyle" ;`,
			description: `a semicolon standing in a comment, which closes nothing`,
		},
		{
			code: `@import\nurl('landscape.css')\nprojection ;`,
			description: `params broken over three lines, with the space in front of the semicolon`,
		},
	],

	reject: [
		{
			code: `@import "styles/mystyle";`,
			description: `a semicolon abutting the params`,
			message: messages.expectedBefore(),
			line: 1,
			column: 24,
		},
		{
			code: `@import "styles/mystyle"  ;`,
			description: `two spaces where one belongs`,
			message: messages.expectedBefore(),
			line: 1,
			column: 26,
		},
		{
			code: `@import "styles/mystyle"\t;`,
			description: `a tab where the space belongs`,
			message: messages.expectedBefore(),
			line: 1,
			column: 25,
		},
		{
			code: `@import "styles/mystyle"\n;`,
			description: `a break where the space belongs`,
			message: messages.expectedBefore(),
			line: 1,
			column: 25,
		},
		{
			code: `@import "styles/mystyle"\r\n;`,
			description: `the same break spelled with a carriage return`,
			message: messages.expectedBefore(),
			line: 1,
			column: 26,
		},
		{
			code: `@import\nurl('landscape.css')\nprojection;`,
			description: `params broken over three lines, with the semicolon abutting them`,
			message: messages.expectedBefore(),
			line: 3,
			column: 10,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `@import "styles/mystyle";`,
			description: `a semicolon abutting the params`,
		},
		{
			code: `@font-face {\n font-family: "MyFont" ; src: url("myfont.woff2") format("woff2") ;\n}`,
			description: `a declaration block, whose own spacing this rule says nothing about`,
		},
		{
			code: `@font-face {\n font-family: "MyFont" ; src: url("myfont.woff2") format("woff2") ;\n} ;`,
			description: `an at-rule carrying a block, whose stray semicolon carries a space`,
		},
		{
			code: `a { color: @brand-primary ; }`,
			description: `a Less variable in a value, which is no at-rule`,
		},
		{
			code: `@myatrule "valuehassemicolon ;";`,
			description: `a semicolon standing in a string, which closes nothing`,
		},
		{
			code: `@import url(http://www.example.com/location+;withsemicolon);`,
			description: `a semicolon standing in a URL, which closes nothing`,
		},
		{
			code: `@import /*my styles ;*/ "styles/mystyle";`,
			description: `a semicolon standing in a comment, which closes nothing`,
		},
		{
			code: `@import\nurl('landscape.css')\nprojection;`,
			description: `params broken over three lines, with the semicolon abutting them`,
		},
	],

	reject: [
		{
			code: `@import "styles/mystyle" ;`,
			description: `a space in front of the semicolon`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 25,
		},
		{
			code: `@import "styles/mystyle"  ;`,
			description: `two spaces in front of the semicolon`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 26,
		},
		{
			code: `@import "styles/mystyle"\t;`,
			description: `a tab in front of the semicolon`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 25,
		},
		{
			code: `@import "styles/mystyle"\n;`,
			description: `a break in front of the semicolon`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 25,
		},
		{
			code: `@import "styles/mystyle"\r\n;`,
			description: `the same break spelled with a carriage return`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 26,
		},
		{
			code: `@import\nurl('landscape.css')\nprojection ;`,
			description: `params broken over three lines, with a space in front of the semicolon`,
			message: messages.rejectedBefore(),
			line: 3,
			column: 11,
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`always`],

	accept: [
		{
			code: `
        .someMixin() { margin: 0; }
        span { .someMixin(); }
      `,
			description: `a Less mixin, whose parentheses are no at-rule`,
		},
		{
			code: `
        @myVariable: #f7f8f9;
        span { background-color: @myVariable; }
      `,
			description: `a Less variable, which the parser gives the shape of an at-rule`,
		},
	],
})
