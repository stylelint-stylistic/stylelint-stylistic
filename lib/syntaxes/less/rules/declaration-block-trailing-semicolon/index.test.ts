import { createRule } from "../../../../rules/declaration-block-trailing-semicolon/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `a Less variable standing on the root of the file, which this syntax reads as an at-rule and the walk over at-rules has always let stand`,
			code: `@var: pink`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/232
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
			column: 23,
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
			column: 34,
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
			column: 27,
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
			column: 22,
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
			column: 21,
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
			column: 32,
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

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/326
			description: `a Less variable standing on the root of the file, which this syntax reads as an at-rule and the walk over at-rules has always let stand`,
			code: `@var: pink;`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/232
			// The code is spelled with escapes rather than as an indented block because the line the semicolon leaves behind holds a tab and nothing else, which a block would leave to whatever trims the file
			description: `an inline comment behind the value, with the semicolon on the line under it: this option takes the semicolon away rather than writing one, so it has nowhere to write and the fix goes through`,
			code: `a {\n\tcolor: pink // keep me\n\t;\n}\n`,
			fixed: `a {\n\tcolor: pink // keep me\n\t\n}\n`,
			line: 3,
			column: 2,
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
			column: 13,
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/309
			description: `an extend at-rule closing the block, whose semicolon Less reads as the end of the at-rule rather than as the separator this option takes away, so the problem is reported and the file left alone`,
			code: `
				a {
					@extend .b;
				}
			`,
			fixed: `
				a {
					@extend .b;
				}
			`,
			line: 2,
			column: 12,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/309
			description: `the same at-rule standing behind a declaration, which is no closer to being able to part with its semicolon`,
			code: `
				a {
					color: pink;
					@extend .b;
				}
			`,
			fixed: `
				a {
					color: pink;
					@extend .b;
				}
			`,
			line: 3,
			column: 12,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/309
			description: `a layer at-rule closing the block, which is plain CSS and holds Less to the same reading as its own at-rules`,
			code: `
				a {
					@layer l;
				}
			`,
			fixed: `
				a {
					@layer l;
				}
			`,
			line: 2,
			column: 10,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/309
			description: `an at-rule whose options open with a parenthesis and no space, which this parser files the way it files a call to a detached ruleset while Less reads it as the at-rule it is`,
			code: `
				a {
					@import(reference) "x";
				}
			`,
			fixed: `
				a {
					@import(reference) "x";
				}
			`,
			line: 2,
			column: 24,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/309
			description: `the extend at-rule with an inline comment behind its parameters, which this syntax keeps inside them and Less compiles as readily as the bare at-rule`,
			code: `
				a {
					@extend .b // c;
				}
			`,
			fixed: `
				a {
					@extend .b // c;
				}
			`,
			line: 2,
			column: 17,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/309
			description: `a Less variable closing the block, which Less does read as a declaration and this rule does not, so the semicolon is reported and left where it stands`,
			code: `a { @v: pink; }`,
			fixed: `a { @v: pink; }`,
			line: 1,
			column: 13,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/309
			description: `a call to a detached ruleset closing the block, which Less reads as a call rather than as an at-rule and parts with just as readily`,
			code: `
				@dr: { color: pink }
				a { @dr(); }
			`,
			fixed: `
				@dr: { color: pink }
				a { @dr() }
			`,
			line: 2,
			column: 10,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/357
			description: `the same call carrying a lookup, which Less inlines just as it inlines the bare one`,
			code: `
				@dr: { color: pink }
				a { @dr()[color]; }
			`,
			fixed: `
				@dr: { color: pink }
				a { @dr()[color] }
			`,
			line: 2,
			column: 17,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/309
			description: `a mixin call closing the block, which this syntax hands over as an at-rule named for the class and Less reads as a call`,
			code: `a { .b(); }`,
			fixed: `a { .b() }`,
			line: 1,
			column: 9,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/309
			description: `a value Less itself refuses in a declaration, which is what telling a declaration from an at-rule would have to catch and what this rule declines to read`,
			code: `a { @v: pink !IMPORTANT; }`,
			fixed: `a { @v: pink !IMPORTANT; }`,
			line: 1,
			column: 24,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/309
			description: `a Less variable spelling no value, which Less reads as a directive rather than as a declaration and asks the semicolon of`,
			code: `a { @v:; }`,
			fixed: `a { @v:; }`,
			line: 1,
			column: 8,
			message: messages.rejected,
		},
	],
})
testRule({
	ruleName,
	config: [`always`, { ignore: [`single-declaration`] }],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `a mixin call alone in its block with a comment standing in front of it, which this syntax reads as a bodiless at-rule`,
			code: `a { /* keep me */ .mixin() }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `the same call with an inline comment standing in front of it`,
			code: `
				a {
					// keep me
					.mixin()
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/327
			description: `a Less variable alone in its block with a comment standing in front of it, which this syntax also reads as a bodiless at-rule`,
			code: `a { /* keep me */ @var: pink }`,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-html`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/309
			// The Sass half of the page this case once shared a fixture with stays with the core: a style element carries the syntax of its own block, and Less will not part with the semicolon behind an at-rule without a block, so the warning stands over code the fix leaves alone
			description: `an at-rule closing a block of a Less style element, whose semicolon the language keeps`,
			code: `<style lang="less">a { @extend .b; }</style>`,
			fixed: `<style lang="less">a { @extend .b; }</style>`,
			line: 1,
			column: 34,
			message: messages.rejected,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/479
			description: `an inline comment ending the declaration, whose closing break the strip leaves where it stands, taking the semicolon alone`,
			code: `a { b: c // x\n; }`,
			fixed: `a { b: c // x\n }`,
			line: 2,
			column: 1,
			endLine: 2,
			endColumn: 2,
			message: messages.rejected,
		},
	],
})
