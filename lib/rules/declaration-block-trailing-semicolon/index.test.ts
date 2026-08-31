import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a block of one declaration, closing behind its semicolon`,
			code: `a { color: pink; }`,
		},
		{
			description: `a block of two declarations, the last closing behind its semicolon`,
			code: `a { background: orange; color: pink; }`,
		},
		{
			description: `a nested rule with no declaration of its own in front of it`,
			code: `a { &:hover { color: pink; }}`,
		},
		{
			description: `a nested rule standing behind a declaration`,
			code: `a { color: red; &:hover { color: pink; }}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `a comment closing the block behind the declaration's semicolon`,
			code: `a { color: pink; /* keep me */ }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `a comment as the only node of the block, which holds no declaration to close`,
			code: `a { /* keep me */ }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `a nested rule standing between the declaration and the comment closing the block, whose semicolon the flag speaks of rather than the declaration's`,
			code: `a { color: red; &:hover { color: pink; } /* keep me */ }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `a declaration standing on the root of the file, which closes no block at all`,
			code: `color: pink`,
		},
	],

	reject: [
		{
			description: `a block of one declaration with no semicolon behind it`,
			code: `a { color: pink }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 15,
			message: messages.expected,
		},
		{
			description: `a block of two declarations, the last carrying no semicolon`,
			code: `a { background: orange; color: pink }`,
			fixed: `a { background: orange; color: pink; }`,
			line: 1,
			column: 35,
			message: messages.expected,
		},
		{
			description: `a double slash, which plain CSS spells no comment with, so the semicolon is written behind it`,
			code: `a { color: pink // c }`,
			fixed: `a { color: pink // c; }`,
			line: 1,
			column: 20,
			message: messages.expected,
		},
		{
			description: `a nested rule whose own last declaration carries no semicolon`,
			code: `a { &:hover { color: pink }}`,
			fixed: `a { &:hover { color: pink; }}`,
			line: 1,
			column: 25,
			message: messages.expected,
		},
		{
			description: `the same nesting standing behind a declaration`,
			code: `a { color: red; &:hover { color: pink }}`,
			fixed: `a { color: red; &:hover { color: pink; }}`,
			line: 1,
			column: 37,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `a comment closing the block behind the declaration, which is a node of its own and the last one, while the semicolon belongs to the declaration all the same`,
			code: `a { color: pink /* keep me */ }`,
			fixed: `a { color: pink; /* keep me */ }`,
			line: 1,
			column: 15,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `two comments closing the block one behind the other`,
			code: `a { color: pink /* keep me */ /* and me */ }`,
			fixed: `a { color: pink; /* keep me */ /* and me */ }`,
			line: 1,
			column: 15,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `a comment standing in front of the declaration as well, which the walk for the closing node stops short of`,
			code: `a { /* keep me */ color: pink /* and me */ }`,
			fixed: `a { /* keep me */ color: pink; /* and me */ }`,
			line: 1,
			column: 29,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `a declaration left with no value at all, which the comment closing the block is no value of either`,
			code: `a { color: /* keep me */ }`,
			fixed: `a { color:; /* keep me */ }`,
			line: 1,
			column: 10,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignore: `single-declaration` }],

	accept: [
		{
			description: `a block of one declaration, which the option leaves to itself`,
			code: `a { color: pink }`,
		},
		{
			description: `the same block with the semicolon, which is left alone as readily`,
			code: `a { color: pink; }`,
		},
		{
			description: `blocks with and without the semicolon side by side, each holding one declaration`,
			code: `@keyframes foo { from { top: 0px } to { top: 1px; } }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `the one declaration with a comment closing the block behind it, the comment being no node the option counts`,
			code: `a { color: pink /* keep me */ }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `the one declaration with a comment standing in front of it, which the option counts no more than it counts one standing behind`,
			code: `a { /* keep me */ color: pink }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `the same declaration with a comment on either side of it`,
			code: `a { /* keep me */ color: pink /* keep me too */ }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `a bodiless at-rule alone in its block, which the option has counted a single node since the rule was written`,
			code: `a { @include foo }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `the same at-rule with a comment standing in front of it, an at-rule being a node the option counts like any other`,
			code: `a { /* keep me */ @include foo }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `a custom property with a comment standing in front of it, whose semicolon the fix used to write behind the trailing space such a value keeps`,
			code: `a { /* keep me */ --custom: pink }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `a declaration standing on the root of the file behind a comment, which the walk turns away before the option is asked at all`,
			code: `/* keep me */ color: pink`,
		},
	],

	reject: [
		{
			description: `a block of two declarations, which the option still checks`,
			code: `a { background: orange; color: pink }`,
			fixed: `a { background: orange; color: pink; }`,
			line: 1,
			column: 35,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `a block of two declarations with a comment standing in front of them, which leaves the option two nodes to count`,
			code: `a { /* keep me */ background: orange; color: pink }`,
			fixed: `a { /* keep me */ background: orange; color: pink; }`,
			line: 1,
			column: 49,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `a declaration standing behind a bodiless at-rule, which the option counts along with it`,
			code: `a { @include foo; color: pink }`,
			fixed: `a { @include foo; color: pink; }`,
			line: 1,
			column: 29,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `a bodiless at-rule standing behind a declaration, which the option counts along with it though the block holds a single declaration`,
			code: `a { color: pink; @include foo }`,
			fixed: `a { color: pink; @include foo; }`,
			line: 1,
			column: 29,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `a declaration standing behind a nested rule, which the option counts along with it though no semicolon of this rule's can stand behind a block`,
			code: `a { b { top: 0; } color: pink }`,
			fixed: `a { b { top: 0; } color: pink; }`,
			line: 1,
			column: 29,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName,
	config: [`never`, { ignore: [`single-declaration`] }],

	accept: [
		{
			description: `a block of one declaration, which the option leaves to itself`,
			code: `a { color: pink }`,
		},
		{
			description: `the same block with the semicolon, which is left alone as readily`,
			code: `a { color: pink; }`,
		},
		{
			description: `blocks with and without the semicolon side by side, each holding one declaration`,
			code: `@keyframes foo { from { top: 0px } to { top: 1px; } }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `the one declaration with its semicolon and a comment closing the block behind it`,
			code: `a { color: pink; /* keep me */ }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `the one declaration with its semicolon and a comment standing in front of it`,
			code: `a { /* keep me */ color: pink; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `the same declaration with a comment on either side of it`,
			code: `a { /* keep me */ color: pink; /* keep me too */ }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `a custom property with its semicolon and a comment standing in front of it`,
			code: `a { /* keep me */ --custom: pink; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `a declaration standing on the root of the file behind a comment, which the walk turns away before the option is asked at all`,
			code: `/* keep me */ color: pink;`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `a block of two declarations carrying the semicolon with a comment standing in front of them, which leaves the option two nodes to count`,
			code: `a { /* keep me */ background: orange; color: pink; }`,
			fixed: `a { /* keep me */ background: orange; color: pink }`,
			line: 1,
			column: 50,
			message: messages.rejected,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a single-line block closing against its declaration`,
			code: `a { color: pink }`,
		},
		{
			description: `a block of two declarations, the last carrying no semicolon`,
			code: `a { background: orange; color: pink }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `a comment closing the block behind a declaration that carries no semicolon`,
			code: `a { color: pink /* keep me */ }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `a nested rule standing between the declaration and the comment closing the block, whose semicolon the flag speaks of rather than the declaration's`,
			code: `a { color: red; &:hover { color: pink } /* keep me */ }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/325
			description: `a semicolon inside a comment standing behind the value, which closes no block and is text rather than code`,
			code: `a { color: pink /* ; */ }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `a declaration standing on the root of the file, whose semicolon closes no block either`,
			code: `color: pink;`,
		},
	],

	reject: [
		{
			description: `a single-line block closing behind a semicolon`,
			code: `a { color: pink; }`,
			fixed: `a { color: pink }`,
			line: 1,
			column: 16,
			message: messages.rejected,
		},
		{
			description: `a block of two declarations, the last carrying a semicolon`,
			code: `a { background: orange; color: pink; }`,
			fixed: `a { background: orange; color: pink }`,
			line: 1,
			column: 36,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `a comment closing the block behind the declaration's semicolon, which is a node of its own and the last one, while the semicolon belongs to the declaration all the same`,
			code: `a { color: pink; /* keep me */ }`,
			fixed: `a { color: pink /* keep me */ }`,
			line: 1,
			column: 16,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `two comments closing the block one behind the other`,
			code: `a { color: pink; /* keep me */ /* and me */ }`,
			fixed: `a { color: pink /* keep me */ /* and me */ }`,
			line: 1,
			column: 16,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `a custom property with a comment closing the block behind its semicolon, which PostCSS writes back whatever the flag says, so the warning stands over code the fix leaves alone`,
			code: `a { --x: pink; /* keep me */ }`,
			fixed: `a { --x: pink; /* keep me */ }`,
			line: 1,
			column: 14,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `a bodiless at-rule in the same place, which PostCSS writes the semicolon back behind for the same reason`,
			code: `a { @include x; /* keep me */ }`,
			fixed: `a { @include x; /* keep me */ }`,
			line: 1,
			column: 15,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/325
			description: `a second semicolon standing behind the one that closes the declaration, which the block's flag says nothing of`,
			code: `a { color: pink;; }`,
			fixed: `a { color: pink }`,
			line: 1,
			column: 17,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/325
			description: `the same pair with a space between the two, which is no semicolon and stays where the file puts it`,
			code: `a { color: pink; ; }`,
			fixed: `a { color: pink  }`,
			line: 1,
			column: 18,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/325
			description: `a second semicolon standing behind the comment that closes the block, which the parser keeps in the block's own trailing raw`,
			code: `a { color: pink; /* keep me */; }`,
			fixed: `a { color: pink /* keep me */ }`,
			line: 1,
			column: 31,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/325
			description: `the same pair standing in front of that comment, which the parser keeps in the comment's own leading raw`,
			code: `a { color: pink;; /* keep me */ }`,
			fixed: `a { color: pink /* keep me */ }`,
			line: 1,
			column: 17,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/325
			// The code is spelled with escapes rather than as an indented block because the line the semicolon leaves behind holds a tab and nothing else, which a block would leave to whatever trims the file
			description: `a semicolon standing on a line of its own, a line under the one that closes the declaration`,
			code: `a {\n\tcolor: pink;\n\t;\n}`,
			fixed: `a {\n\tcolor: pink\n\t\n}`,
			line: 3,
			column: 2,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/325
			description: `a custom property carrying such a pair with no comment behind it, so nothing keeps the semicolon PostCSS would write back and both go`,
			code: `a { --x: pink;; }`,
			fixed: `a { --x: pink }`,
			line: 1,
			column: 15,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/325
			description: `the same property with a comment closing the block, where the first of the two is written back whatever the flag says, so the warning stands over code the fix leaves alone`,
			code: `a { --x: pink;; /* keep me */ }`,
			fixed: `a { --x: pink;; /* keep me */ }`,
			line: 1,
			column: 15,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/325
			description: `a semicolon inside the comment closing the block, which is text and leaves the one behind that comment the last`,
			code: `a { color: pink; /* ; */; }`,
			fixed: `a { color: pink /* ; */ }`,
			line: 1,
			column: 25,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/325
			description: `a free semicolon written behind the closing brace of the nested rule the declaration stands in, which the parser puts in a raw of that rule and its end past`,
			code: `a { &:hover { color: pink;; }; }`,
			fixed: `a { &:hover { color: pink }; }`,
			line: 1,
			column: 27,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/309
			description: `a bodiless at-rule closing the block with nothing behind it, which plain CSS parts with the semicolon behind as readily as with a declaration's`,
			code: `a { @whatever x; }`,
			fixed: `a { @whatever x }`,
			line: 1,
			column: 16,
			message: messages.rejected,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a nested at-rule closing behind its semicolon`,
			code: `a { @includes foo; }`,
		},
		{
			description: `an at-rule holding a block, whose own declaration carries the semicolon`,
			code: `a { @foo { color: pink; } }`,
		},
		{
			description: `a comment behind a nested at-rule, with the semicolon behind the comment`,
			code: `a { @includes foo /* keep me */; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `a comment closing the block behind the declaration's semicolon`,
			code: `a { color: pink; /* keep me */ }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `a nested rule standing between the declaration and the comment closing the block, whose semicolon the flag speaks of rather than the declaration's`,
			code: `a { color: red; &:hover { color: pink; } /* keep me */ }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `a Sass variable standing on the root of the file, which is a statement of the file rather than the last declaration of a block`,
			code: `$var: pink`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `the same variable with a comment behind it, which the walk looks past and finds the root all the same`,
			code: `$var: pink /* keep me */`,
		},
	],

	reject: [
		{
			description: `a nested at-rule carrying no semicolon`,
			code: `a { @includes foo }`,
			fixed: `a { @includes foo; }`,
			line: 1,
			column: 17,
			message: messages.expected,
		},
		{
			description: `an at-rule holding a block whose declaration carries no semicolon`,
			code: `a { @foo { color: pink } }`,
			fixed: `a { @foo { color: pink; } }`,
			line: 1,
			column: 22,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/87
			description: `a comment standing between the at-rule and the closing brace`,
			code: `a { @includes foo /* keep me */ }`,
			fixed: `a { @includes foo /* keep me */; }`,
			line: 1,
			column: 31,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `a comment closing the block behind a declaration, which this syntax reads with the same parser plain CSS is read with`,
			code: `a { color: pink /* keep me */ }`,
			fixed: `a { color: pink; /* keep me */ }`,
			line: 1,
			column: 15,
			message: messages.expected,
		},
		{
			description: `the same comment holding an address, whose double slash opens none of its own`,
			code: `a { @includes foo /* https://foo.bar/ */ }`,
			fixed: `a { @includes foo /* https://foo.bar/ */; }`,
			line: 1,
			column: 40,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/87
			description: `a block broken across lines, whose closing brace keeps its line when the semicolon is written`,
			code: `
				a {
					@includes foo
				}
			`,
			fixed: `
				a {
					@includes foo;
				}
			`,
			line: 2,
			column: 14,
			message: messages.expected,
		},
		{
			description: `the same block with a comment behind the at-rule`,
			code: `
				a {
					@includes foo /* keep me */
				}
			`,
			fixed: `
				a {
					@includes foo /* keep me */;
				}
			`,
			line: 2,
			column: 28,
			message: messages.expected,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a {\r\n\t@includes foo\r\n}`,
			fixed: `a {\r\n\t@includes foo;\r\n}`,
			line: 2,
			column: 14,
			message: messages.expected,
		},
		{
			description: `inline comment: the semicolon cannot leave its line, so the code is left alone and the warning stands`,
			code: `
				a {
					@includes foo // keep me
				}
			`,
			fixed: `
				a {
					@includes foo // keep me
				}
			`,
			line: 2,
			column: 25,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `the twin of the Less case below: this syntax reads the inline comment as a node of its own, so the semicolon lands in front of the comment rather than inside it and the fix goes through`,
			code: `
				a {
					color: pink // keep me
				}
			`,
			fixed: `
				a {
					color: pink; // keep me
				}
			`,
			line: 2,
			column: 12,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/287
			description: `a custom property, whose value this syntax reads to the end of the line and takes the line break into: the semicolon lands past the comment rather than inside it, so the fix goes through and the closing brace takes its line`,
			code: `
				a {
					--x: pink // keep me
				}
			`,
			fixed: `
				a {
					--x: pink // keep me
				;}
			`,
			line: 2,
			column: 21,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/287
			description: `the same custom property carrying a flag, which this syntax files in a raw of its own, so the line break closing the comment stands there rather than in the value`,
			code: `
				a {
					--x: pink !important // keep me
				}
			`,
			fixed: `
				a {
					--x: pink !important // keep me
				;}
			`,
			line: 2,
			column: 32,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/335
			// This syntax is the only one that reads a nested property as a declaration at all: `postcss-less` and plain CSS read the same three lines as a rule whose selector is `font: 12px`, so neither reaches this rule with anything to say
			description: `a Sass nested property, which carries a block of its own: the stringifier drops the semicolon it is handed for such a declaration, so there is nothing the fix could write and the warning stands`,
			code: `
				a {
					font: 12px
					{ family: serif; }
				}
			`,
			fixed: `
				a {
					font: 12px
					{ family: serif; }
				}
			`,
			line: 3,
			column: 19,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/335
			description: `the same nested property with a block comment behind its value, which reaches the rule the same way and is refused the same way`,
			code: `
				a {
					font: 12px /* keep me */
					{ family: serif; }
				}
			`,
			fixed: `
				a {
					font: 12px /* keep me */
					{ family: serif; }
				}
			`,
			line: 3,
			column: 19,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/335
			description: `the same nested property carrying an inline comment, which the value takes the line break of and which changes nothing about the block standing behind it`,
			code: `
				a {
					font: 12px // keep me
					{ family: serif; }
				}
			`,
			fixed: `
				a {
					font: 12px // keep me
					{ family: serif; }
				}
			`,
			line: 3,
			column: 19,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/336
			description: `the same nested property already carrying the semicolon the option asks for, which this syntax parses into the trailing raw of the block around it rather than into the flag the rule reads`,
			code: `a { font: 12px { family: serif; }; }`,
			fixed: `a { font: 12px { family: serif; }; }`,
			line: 1,
			column: 33,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a nested at-rule closing against the brace`,
			code: `a { @includes foo }`,
		},
		{
			description: `an at-rule holding a block whose declaration carries no semicolon`,
			code: `a { @foo { color: pink } }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `a comment closing the block behind a declaration that carries no semicolon`,
			code: `a { color: pink /* keep me */ }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `a nested rule standing between the declaration and the comment closing the block, whose semicolon the flag speaks of rather than the declaration's`,
			code: `a { color: red; &:hover { color: pink } /* keep me */ }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `a Sass variable standing on the root of the file, whose semicolon closes no block and is as optional there as a block's trailing one`,
			code: `$var: pink;`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `the same variable with a comment behind it, which the walk looks past and finds the root all the same`,
			code: `$var: pink; /* keep me */`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `a Sass map written on the root of the file, which this parser reads as one declaration rather than as a container of its own`,
			code: `$m: (a: 1, b: 2);`,
		},
	],

	reject: [
		{
			description: `a nested at-rule closing behind a semicolon`,
			code: `a { @includes foo; }`,
			fixed: `a { @includes foo }`,
			line: 1,
			column: 18,
			message: messages.rejected,
		},
		{
			description: `an at-rule holding a block whose declaration carries a semicolon`,
			code: `a { @foo { color: pink; } }`,
			fixed: `a { @foo { color: pink } }`,
			line: 1,
			column: 23,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/87
			description: `a comment standing between the at-rule and the semicolon`,
			code: `a { @includes foo /* keep me */; }`,
			fixed: `a { @includes foo /* keep me */ }`,
			line: 1,
			column: 32,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `a comment closing the block behind a declaration's semicolon, which this syntax reads with the same parser plain CSS is read with`,
			code: `a { color: pink; /* keep me */ }`,
			fixed: `a { color: pink /* keep me */ }`,
			line: 1,
			column: 16,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `the same comment standing behind the semicolon instead, where it is a node of its own: PostCSS writes the semicolon behind a bodiless at-rule whatever the flag says, since without it the comment would be read as more of the parameters, so the warning stands over code the fix leaves alone`,
			code: `
				a {
					@includes foo;
					/* keep me */
				}
			`,
			fixed: `
				a {
					@includes foo;
					/* keep me */
				}
			`,
			line: 2,
			column: 15,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `an inline comment closing the block behind the declaration's semicolon, which this syntax reads as a node of its own`,
			code: `
				a {
					color: pink; // keep me
				}
			`,
			fixed: `
				a {
					color: pink // keep me
				}
			`,
			line: 2,
			column: 13,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `a block standing in front of a Sass variable on the root of the file, whose own trailing semicolon is reported while the variable's is left where it stands`,
			code: `
				a { color: pink; }
				$var: pink;
			`,
			fixed: `
				a { color: pink }
				$var: pink;
			`,
			line: 1,
			column: 16,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/325
			description: `a second semicolon standing behind the one that closes the declaration, which this syntax keeps in the same raw plain CSS keeps it in`,
			code: `a { color: pink;; }`,
			fixed: `a { color: pink }`,
			line: 1,
			column: 17,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/325
			description: `the same pair with an inline comment closing the block behind it`,
			code: `
				a {
					color: pink;; // keep me
				}
			`,
			fixed: `
				a {
					color: pink // keep me
				}
			`,
			line: 2,
			column: 14,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/325
			// The same semicolon under `always` is #336: the flag is unset there too, so a property already carrying one is asked for another
			description: `a Sass nested property carrying a semicolon behind its closing brace, which the parser keeps in the block's own trailing raw rather than in the flag, and the semicolon closing the nested block along with it`,
			code: `a { font: 12px { family: serif; }; }`,
			fixed: `a { font: 12px { family: serif } }`,
			warnings: [
				{
					line: 1,
					column: 34,
					message: messages.rejected,
				},
				{
					line: 1,
					column: 31,
					message: messages.rejected,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/309
			description: `an extend at-rule closing the block, which Sass parts with the semicolon behind, so the fix goes through where the Less reading of the same file holds it back`,
			code: `a { @extend .b; }`,
			fixed: `a { @extend .b }`,
			line: 1,
			column: 15,
			message: messages.rejected,
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignore: [`single-declaration`] }],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `the one declaration with an inline comment standing in front of it`,
			code: `
				a {
					// keep me
					color: pink
				}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `a block of two declarations with an inline comment standing in front of them, which leaves the option two nodes to count`,
			code: `
				a {
					// keep me
					background: orange;
					color: pink
				}
			`,
			fixed: `
				a {
					// keep me
					background: orange;
					color: pink;
				}
			`,
			line: 4,
			column: 12,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName,
	config: [`never`, { ignore: [`single-declaration`] }],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `the one declaration with its semicolon and an inline comment standing in front of it`,
			code: `
				a {
					// keep me
					color: pink;
				}
			`,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-html`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `a Sass variable standing on the root of a style element, which is a stylesheet of its own and closes no block`,
			code: `<style lang="scss">$var: pink</style>`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `an at-rule standing on the root of an inline style attribute, which holds declarations and nothing else, so the semicolon behind it is not this rule's to write`,
			code: `<div style="@import 'a'">x</div>`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `the same at-rule with a comment behind it, which this parser keeps in the root's own trailing raw rather than in the at-rule`,
			code: `<div style="@import 'a'  /* keep me */">x</div>`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `an at-rule carrying a block, which this parser reads as parameters holding braces rather than as a block of its own`,
			code: `<div style="@media x { a { color: red } }">x</div>`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `a declaration standing on the root of an inline style attribute, since the value of such an attribute is a declaration block and nothing else`,
			code: `<div style=" color: pink ">x</div>`,
			fixed: `<div style=" color: pink; ">x</div>`,
			line: 1,
			column: 24,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-html`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `a Sass variable standing on the root of a style element, which is a stylesheet of its own however the page carries it`,
			code: `<style lang="scss">$var: pink;</style>`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `an at-rule standing on the root of an inline style attribute, which holds declarations and nothing else, so the semicolon behind it is not this rule's to take away`,
			code: `<div style="@import 'a';">x</div>`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `the same at-rule with a comment behind its semicolon, which leaves the comment a node of the root rather than the root's trailing raw`,
			code: `<div style="@import 'a';  /* keep me */">x</div>`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `an at-rule carrying a block and a semicolon behind it, the block being what this parser reads as parameters holding braces rather than as a block of its own`,
			code: `<div style="@media x { a { color: red } };">x</div>`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `a declaration standing on the root of an inline style attribute, since the value of such an attribute is a declaration block and nothing else`,
			code: `<div style="color: pink;">x</div>`,
			fixed: `<div style="color: pink">x</div>`,
			line: 1,
			column: 24,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/325
			description: `a second semicolon behind that declaration, which stands in a block ending on the attribute's own end rather than on a closing brace`,
			code: `<div style="color: pink;;">x</div>`,
			fixed: `<div style="color: pink">x</div>`,
			line: 1,
			column: 25,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/309
			// The other half of this page, the Less block, is the less namespace's since the core turned Less away; a page holding both languages splits its rules between the namespaces the same way
			description: `an at-rule closing a block of a Sass style element, whose semicolon that syntax parts with`,
			code: `
				<style lang="scss">a { @extend .c; }</style>
			`,
			fixed: `
				<style lang="scss">a { @extend .c }</style>
			`,
			line: 1,
			column: 34,
			message: messages.rejected,
		},
	],
})

testRule({
	ruleName,
	config: [`always`, { ignore: [`single-declaration`] }],
	customSyntax: `postcss-html`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `the one declaration of an inline style attribute with a comment standing in front of it, the root of such an attribute being the one root this rule reads as a declaration block`,
			code: `<div style="/* keep me */ color: pink">x</div>`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `two declarations of an inline style attribute with a comment standing in front of them, which leaves the option two nodes to count`,
			code: `<div style="/* keep me */ background: orange; color: pink">x</div>`,
			fixed: `<div style="/* keep me */ background: orange; color: pink;">x</div>`,
			line: 1,
			column: 57,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName,
	config: [`never`, { ignore: [`single-declaration`] }],
	customSyntax: `postcss-html`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `the one declaration of an inline style attribute with its semicolon and a comment standing in front of it`,
			code: `<div style="/* keep me */ color: pink;">x</div>`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `two declarations of an inline style attribute carrying the semicolon with a comment standing in front of them, which leaves the option two nodes to count`,
			code: `<div style="/* keep me */ background: orange; color: pink;">x</div>`,
			fixed: `<div style="/* keep me */ background: orange; color: pink">x</div>`,
			line: 1,
			column: 58,
			message: messages.rejected,
		},
	],
})
