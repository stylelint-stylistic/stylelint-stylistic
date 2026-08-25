import { messages, ruleName } from "./index.js"

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
			description: `a comment standing in front of the declaration as well, which the block is not sought from`,
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
			description: `the one declaration with a comment closing the block behind it, which leaves it the first node of the block and so the option's to ignore`,
			code: `a { color: pink /* keep me */ }`,
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
			// A comment in front of the one declaration makes it no longer the first node of the block, and the option counts nodes rather than declarations, so the block is checked. That reading is the option's own and older than #217, which neither opens the question nor settles it
			description: `the one declaration with a comment standing in front of it, which the option no longer counts as the block's only node`,
			code: `a { /* keep me */ color: pink }`,
			fixed: `a { /* keep me */ color: pink; }`,
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
	],

	reject: [
		{
			description: `a single-line block closing behind a semicolon`,
			code: `a { color: pink; }`,
			fixed: `a { color: pink }`,
			line: 1,
			column: 15,
			message: messages.rejected,
		},
		{
			description: `a block of two declarations, the last carrying a semicolon`,
			code: `a { background: orange; color: pink; }`,
			fixed: `a { background: orange; color: pink }`,
			line: 1,
			column: 35,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `a comment closing the block behind the declaration's semicolon, which is a node of its own and the last one, while the semicolon belongs to the declaration all the same`,
			code: `a { color: pink; /* keep me */ }`,
			fixed: `a { color: pink /* keep me */ }`,
			line: 1,
			column: 15,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `two comments closing the block one behind the other`,
			code: `a { color: pink; /* keep me */ /* and me */ }`,
			fixed: `a { color: pink /* keep me */ /* and me */ }`,
			line: 1,
			column: 15,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `a custom property with a comment closing the block behind its semicolon, which PostCSS writes back whatever the flag says, so the warning stands over code the fix leaves alone`,
			code: `a { --x: pink; /* keep me */ }`,
			fixed: `a { --x: pink; /* keep me */ }`,
			line: 1,
			column: 13,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `a bodiless at-rule in the same place, which PostCSS writes the semicolon back behind for the same reason`,
			code: `a { @include x; /* keep me */ }`,
			fixed: `a { @include x; /* keep me */ }`,
			line: 1,
			column: 14,
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
			// The column a declaration carrying an inline comment is measured at is what #139 is about, so this case asserts none
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
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/287
			// Where a declaration carrying an inline comment is measured is what #139 is about, and this syntax keeps the comment inside the value. The position is counted in what `node.toString()` prints, which is PostCSS's own stringifier rather than the syntax's, so the copy it reaches is the one holding a block comment two characters wider — wide enough to run off the end of the declaration's own line. Hence the third line here and no column at all; the twin below, whose break stands in a raw of its own, is measured on the second
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
			line: 3,
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
			line: 2,
			column: 11,
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
			line: 2,
			column: 25,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/335
			// Where the warning falls is #139 again, so this case asserts no column
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
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/336
			description: `the same nested property already carrying the semicolon the option asks for, which this syntax parses into the trailing raw of the block around it rather than into the flag the rule reads`,
			code: `a { font: 12px { family: serif; }; }`,
			fixed: `a { font: 12px { family: serif; }; }`,
			line: 1,
			column: 14,
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
	],

	reject: [
		{
			description: `a nested at-rule closing behind a semicolon`,
			code: `a { @includes foo; }`,
			fixed: `a { @includes foo }`,
			line: 1,
			column: 17,
			message: messages.rejected,
		},
		{
			description: `an at-rule holding a block whose declaration carries a semicolon`,
			code: `a { @foo { color: pink; } }`,
			fixed: `a { @foo { color: pink } }`,
			line: 1,
			column: 22,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/87
			description: `a comment standing between the at-rule and the semicolon`,
			code: `a { @includes foo /* keep me */; }`,
			fixed: `a { @includes foo /* keep me */ }`,
			line: 1,
			column: 31,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `a comment closing the block behind a declaration's semicolon, which this syntax reads with the same parser plain CSS is read with`,
			code: `a { color: pink; /* keep me */ }`,
			fixed: `a { color: pink /* keep me */ }`,
			line: 1,
			column: 15,
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
			column: 14,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			// The column a declaration carrying an inline comment is measured at is what #139 is about, so this case asserts none
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
			message: messages.rejected,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/232
			// The column a declaration carrying an inline comment is measured at is what #139 is about, so none of the cases carrying one asserts a column
			description: `an inline comment behind the value, which this syntax keeps inside it: the semicolon cannot leave the comment's line, so the code is left alone and the warning stands`,
			code: `
				a {
					color: pink // keep me
				}
			`,
			fixed: `
				a {
					color: pink // keep me
				}
			`,
			line: 2,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/232
			description: `the same comment standing behind the flag, whose raw the guard reads along with the value`,
			code: `
				a {
					color: pink !important // keep me
				}
			`,
			fixed: `
				a {
					color: pink !important // keep me
				}
			`,
			line: 2,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/232
			description: `a flag standing in the text of the comment, which Less reads as comment text while the parser reads it as the flag`,
			code: `
				a {
					color: red // c !important
				}
			`,
			fixed: `
				a {
					color: red // c !important
				}
			`,
			line: 2,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/232
			description: `a bodiless at-rule whose parameters this syntax keeps the comment inside, rather than the raw standing where the closing brace would be`,
			code: `
				a {
					@include x // keep me
				}
			`,
			fixed: `
				a {
					@include x // keep me
				}
			`,
			line: 2,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/232
			description: `a custom property on one line, whose value the comment runs to the end of: no line break closes that comment, so the semicolon has nowhere of its own to stand and the warning stands instead`,
			code: `a { --x: pink // keep me }`,
			fixed: `a { --x: pink // keep me }`,
			line: 1,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/287
			description: `the same custom property broken across lines, whose value swallows the line break as well: the semicolon lands past the comment rather than inside it, so the fix goes through and the closing brace takes its line`,
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
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/287
			description: `the same custom property carrying a flag, which this syntax reads no flag out of at all, so the comment and the line break behind it stay inside the value`,
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
			message: messages.expected,
		},
		{
			description: `a carriage return ends the comment, so the semicolon does not join its line and the fix goes through`,
			code: `a { color: red // keep me\rblue }`,
			fixed: `a { color: red // keep me\rblue; }`,
			line: 1,
			message: messages.expected,
		},
		{
			description: `a block comment behind the parameters of a bodiless at-rule, which this syntax keeps in the raw standing where the closing brace would be, and which nothing of depends on a line break`,
			code: `
				a {
					@include x /* keep me */
				}
			`,
			fixed: `
				a {
					@include x /* keep me */;
				}
			`,
			line: 2,
			column: 25,
			message: messages.expected,
		},
		{
			description: `a double slash standing inside a string, which opens no comment, so the fix goes through`,
			code: `
				a {
					content: "//"
				}
			`,
			fixed: `
				a {
					content: "//";
				}
			`,
			line: 2,
			column: 14,
			message: messages.expected,
		},
		{
			description: `a double slash belonging to an address, which opens no comment, so the fix goes through`,
			code: `
				a {
					background: url(//a/b.png)
				}
			`,
			fixed: `
				a {
					background: url(//a/b.png);
				}
			`,
			line: 2,
			column: 27,
			message: messages.expected,
		},
		{
			description: `a value of whitespace alone, which ends in no comment either`,
			code: `a { --x:   }`,
			fixed: `a { --x:   ;}`,
			line: 1,
			column: 8,
			message: messages.expected,
		},
		{
			description: `an ordinary property left with no value at all, whose whitespace this syntax files behind the declaration rather than inside it`,
			code: `a { color:   }`,
			fixed: `a { color:;   }`,
			line: 1,
			column: 10,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/232
			// The column a declaration carrying an inline comment is measured at is what #139 is about, so this case asserts none. The code is spelled with escapes rather than as an indented block because the line the semicolon leaves behind holds a tab and nothing else, which a block would leave to whatever trims the file
			description: `an inline comment behind the value, with the semicolon on the line under it: this option takes the semicolon away rather than writing one, so it has nowhere to write and the fix goes through`,
			code: `a {\n\tcolor: pink // keep me\n\t;\n}\n`,
			fixed: `a {\n\tcolor: pink // keep me\n\t\n}\n`,
			line: 2,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/217
			description: `the same comment standing behind the semicolon instead, where this syntax reads it as a node of its own rather than as part of the value`,
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
			message: messages.rejected,
		},
	],
})
