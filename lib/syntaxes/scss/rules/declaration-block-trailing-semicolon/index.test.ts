import { createRule } from "../../../../rules/declaration-block-trailing-semicolon/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

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
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/309
			// The Less half of the page this case once carried is the less namespace's, and the Sass half here is this one's: a page holding both languages splits its rules between the namespaces
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
