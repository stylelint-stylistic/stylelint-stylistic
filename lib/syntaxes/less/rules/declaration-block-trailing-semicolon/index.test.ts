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
			// See #326
			description: `a Less variable standing on the root of the file, which this syntax reads as an at-rule and the walk over at-rules has always let stand`,
			code: `@var: pink`,
		},
		{
			// See #359
			description: `a semicolon in the text of an inline comment behind the value, with a semicolon of code on the line under it, which closes the declaration`,
			code: `
				a {
					color: pink // ;
					;
				}
			`,
		},
		{
			// See #359
			description: `the same comment behind the parameters of an extend at-rule, which Less reads to the semicolon with a reader that knows no double slash, so the semicolon is code`,
			code: `
				a {
					@extend .b // c;
				}
			`,
		},
		{
			// See #359
			description: `the same comment behind a custom property carrying an important flag, which Less reads the same way`,
			code: `
				a {
					--x: pink !important // ;
				}
			`,
		},
		{
			// See #721
			description: `a semicolon behind a bare carriage return ending an inline comment, which Less reads as a line feed, so the semicolon is code`,
			code: `a {\n\tcolor: pink // c\r;\n}\n`,
		},
		{
			// See #721
			description: `the same break behind a semicolon in the text of the comment, which this syntax reads as the one closing the declaration`,
			code: `a {\n\tcolor: pink // ;\r\t;\n}\n`,
		},
		{
			// Pins that a semicolon Less reads in the text of a comment behind the one the flag stands for closes the declaration
			description: `a semicolon in the text of an inline comment behind the value, with a second comment on the line holding a semicolon behind a bare carriage return, which Less reads as the one closing the declaration`,
			code: `a {\n\tcolor: pink // x; // c\r;\n}\n`,
		},
	],

	reject: [
		{
			// See #359
			description: `a semicolon in the text of an inline comment behind the value, which this syntax reads as the semicolon closing the declaration and Less as the text of the comment: no semicolon closes it, and the comment is left alone`,
			code: `
				a {
					color: pink // ;
				}
			`,
			fixed: `
				a {
					color: pink // ;
				}
			`,
			line: 2,
			column: 15,
			message: messages.expected,
		},
		{
			// See #359
			description: `the same comment behind a mixin call, which Less reads with the same reader`,
			code: `
				a {
					.m() // ;
				}
			`,
			fixed: `
				a {
					.m() // ;
				}
			`,
			line: 2,
			column: 8,
			message: messages.expected,
		},
		{
			// See #232
			description: `an inline comment behind the value, which this syntax keeps inside it: the semicolon closes the code in front of the comment, which moves behind it with its run`,
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
			column: 23,
			message: messages.expected,
		},
		{
			// See #232
			description: `the same comment standing behind the flag, which this syntax reads as a word of the value, so the semicolon closes the flag`,
			code: `
				a {
					color: pink !important // keep me
				}
			`,
			fixed: `
				a {
					color: pink !important; // keep me
				}
			`,
			line: 2,
			column: 34,
			message: messages.expected,
		},
		{
			// See #423
			description: `an inline comment on its own line behind the value, which this syntax swallows into the value along with the break in front of it: the semicolon closes the value on its own line and the comment keeps its line`,
			code: `
				a {
					color: pink
					// c
				}
			`,
			fixed: `
				a {
					color: pink;
					// c
				}
			`,
			line: 3,
			column: 5,
			message: messages.expected,
		},
		{
			// See #423
			description: `an extend at-rule with an inline comment behind its params, which Less refuses without the semicolon and compiles with it in front of the comment`,
			code: `
				a {
					@extend .b // c
				}
			`,
			fixed: `
				a {
					@extend .b; // c
				}
			`,
			line: 2,
			column: 16,
			message: messages.expected,
		},
		{
			// See #423
			description: `the same at-rule with the comment on its own line, swallowed into the params with the break in front of it`,
			code: `
				a {
					@extend .b
					// c
				}
			`,
			fixed: `
				a {
					@extend .b;
					// c
				}
			`,
			line: 3,
			column: 5,
			message: messages.expected,
		},
		{
			description: `a mixin call with an inline comment behind it, kept in its params`,
			code: `
				a {
					.m() // c
				}
			`,
			fixed: `
				a {
					.m(); // c
				}
			`,
			line: 2,
			column: 10,
			message: messages.expected,
		},
		{
			description: `a mixin call written without parentheses and a comment on the line under it, which the parser makes the whole of the params, the break in front of them filed behind the name: the semicolon closes the name`,
			code: `
				a {
					.m
					// c
				}
			`,
			fixed: `
				a {
					.m;
					// c
				}
			`,
			line: 3,
			column: 5,
			message: messages.expected,
		},
		{
			description: `a variable with an inline comment behind its value, which the parser keeps in the params and prints from a second copy the write keeps in step`,
			code: `
				a {
					@v: 1 // c
				}
			`,
			fixed: `
				a {
					@v: 1; // c
				}
			`,
			line: 2,
			column: 11,
			message: messages.expected,
		},
		{
			description: `two inline comments behind the value, each on its line, which move together`,
			code: `
				a {
					color: pink // c
					// d
				}
			`,
			fixed: `
				a {
					color: pink; // c
					// d
				}
			`,
			line: 3,
			column: 5,
			message: messages.expected,
		},
		{
			description: `a block comment in front of the inline one, which stays with the code in front of the semicolon, where Less prints it`,
			code: `
				a {
					color: pink /* b */ // c
				}
			`,
			fixed: `
				a {
					color: pink /* b */; // c
				}
			`,
			line: 2,
			column: 25,
			message: messages.expected,
		},
		{
			description: `the run of spaces in front of the comment, which moves behind the semicolon with it`,
			code: `
				a {
					color: pink   // c
				}
			`,
			fixed: `
				a {
					color: pink;   // c
				}
			`,
			line: 2,
			column: 19,
			message: messages.expected,
		},
		{
			description: `the same comment behind a Windows line break, which closes it as a line feed does`,
			code: `a {\r\n\tcolor: pink // c\r\n}\r\n`,
			fixed: `a {\r\n\tcolor: pink; // c\r\n}\r\n`,
			line: 2,
			column: 17,
			message: messages.expected,
		},
		{
			description: `a block on one line whose value ends in an inline comment, which no break closes in front of the brace, so the semicolon has nowhere to stand and the code is left alone; Less refuses the file either way`,
			code: `a { color: pink // c }`,
			fixed: `a { color: pink // c }`,
			line: 1,
			column: 20,
			message: messages.expected,
		},
		{
			description: `a block comment behind the inline one on its line, which the parser files in front of the brace and Less reads as the inline comment's text: the run moves whole, the semicolon in front of both`,
			code: `
				a {
					@extend .b // c /* d */
				}
			`,
			fixed: `
				a {
					@extend .b; // c /* d */
				}
			`,
			line: 2,
			column: 24,
			message: messages.expected,
		},
		{
			description: `the same two comments behind a value, the block one a node of its own a space in front of, so no break closes the inline comment in front of it and the code is left alone`,
			code: `
				a {
					color: pink // c /* d */
				}
			`,
			fixed: `
				a {
					color: pink // c /* d */
				}
			`,
			line: 2,
			column: 17,
			message: messages.expected,
		},
		{
			description: `the same comment closed by a bare carriage return, which Less reads as a line feed and this syntax does not, so the code is left alone`,
			code: `a {\n\tcolor: pink // c\r}\n`,
			fixed: `a {\n\tcolor: pink // c\r}\n`,
			line: 2,
			column: 17,
			message: messages.expected,
		},
		{
			// See #232
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
			// See #232
			description: `a bodiless at-rule whose parameters this syntax keeps the comment inside, so the semicolon closes the parameters in front of it`,
			code: `
				a {
					@include x // keep me
				}
			`,
			fixed: `
				a {
					@include x; // keep me
				}
			`,
			line: 2,
			column: 22,
			message: messages.expected,
		},
		{
			// See #232
			description: `a custom property on one line, whose value the comment runs to the end of: no line break closes that comment, so the semicolon has nowhere of its own to stand and the warning stands instead`,
			code: `a { --x: pink // keep me }`,
			fixed: `a { --x: pink // keep me }`,
			line: 1,
			message: messages.expected,
		},
		{
			// See #287
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
			// See #287
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
		{
			// See #374
			description: `a mixin call carrying an important flag and closing a multi-line block, whose semicolon goes behind the flag with the space in front of the flag and the break in front of the brace left as they stand`,
			code: `
				a {
					.m() !important
				}
			`,
			fixed: `
				a {
					.m() !important;
				}
			`,
			line: 2,
			column: 16,
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
			// See #326
			description: `a Less variable standing on the root of the file, which this syntax reads as an at-rule and the walk over at-rules has always let stand`,
			code: `@var: pink;`,
		},
		{
			// See #630
			description: `a Less variable closing a block with no value and no semicolon, which the parser hands over with no source end`,
			code: `a { @v: }`,
		},
		{
			// See #630
			description: `the same name with no colon behind it, which the parser reads as an at-rule of that name`,
			code: `a { @v }`,
		},
		{
			// See #359
			description: `a semicolon in the text of an inline comment behind the value, which this syntax reads as the semicolon closing the declaration and Less as the text of the comment`,
			code: `
				a {
					color: pink // ;
				}
			`,
		},
		{
			// See #359
			description: `the same comment behind an important flag`,
			code: `
				a {
					color: pink !important // ;
				}
			`,
		},
		{
			// See #722
			description: `a semicolon in the text of an inline comment behind a custom property's bare value, which Less's comment-and-entity loop consumes together with the comment`,
			code: `
				a {
					--x: pink // ;
				}
			`,
		},
		{
			// See #722
			description: `the same comment behind a custom property's value written as a bracketed group, another entity that loop consumes whole`,
			code: `
				a {
					--x: [a] // ;
				}
			`,
		},
		{
			// See #359
			description: `the same comment behind a mixin call`,
			code: `
				a {
					.m() // ;
				}
			`,
		},
		{
			// See #359
			description: `the same comment behind a call to a detached ruleset`,
			code: `
				a {
					@dr() // ;
				}
			`,
		},
		{
			// See #359
			description: `a second semicolon in the same comment, which this syntax files in the raw ending the block`,
			code: `
				a {
					color: pink // ;;
				}
			`,
		},
		{
			// See #359
			description: `a block comment and a semicolon behind it in the same comment, which run on to the line break as its text`,
			code: `
				a {
					color: pink // ; /* c */ ;
				}
			`,
		},
		{
			// Pins that a node Less reads in the text of a comment, not the one PostCSS hangs the flag on, closes the block
			description: `a declaration behind a bare carriage return in an inline comment behind the semicolon, which this syntax keeps as the text of the comment and Less reads as the declaration closing the block`,
			code: `a {\n\tcolor: pink; // c\r top: 0;\n}\n`,
		},
		{
			// Pins the same reading for a comment on a line of its own and a declaration with no semicolon behind it
			description: `the same comment on a line of its own, the declaration behind the carriage return closing the block with no semicolon`,
			code: `a {\n\tb: c;\n\t// x\r\td: e\n}\n`,
		},
		{
			// Pins the same reading for the walk over at-rules
			description: `the same comment behind an extend at-rule`,
			code: `a {\n\t@extend .b; // c\r top: 0;\n}\n`,
		},
		{
			// Pins that a break with nothing in front of it in the comment is read as well
			description: `the same comment holding no text in front of the carriage return, which this syntax keeps in the raw in front of the text`,
			code: `a {\n\tcolor: pink; // \r top: 0;\n}\n`,
		},
		{
			// Pins that a comment behind the break does not hide a declaration behind the next break
			description: `the same comment holding a second inline comment behind the carriage return and a declaration behind a second one`,
			code: `a {\n\tcolor: pink; // c\r // d\r top: 0;\n}\n`,
		},
	],

	reject: [
		{
			// A real value keeps the semicolon under Less now (#688), so this stray one, formerly taken with the comment's, is left standing along with the file's warning
			description: `a semicolon behind a bare carriage return in an inline comment behind the semicolon closing the declaration, which this syntax keeps as the text of the comment and Less reads as code`,
			code: `a {\n\tcolor: pink; // c\r;\n}\n`,
			fixed: `a {\n\tcolor: pink; // c\r;\n}\n`,
			line: 2,
			column: 20,
			message: messages.rejected,
		},
		{
			// A real value keeps the semicolon under Less now (#688); formerly the same reading with the comment holding no text in front of the carriage return
			description: `the same semicolon in a comment holding no text in front of the carriage return`,
			code: `a {\n\tcolor: pink; // \r;\n}\n`,
			fixed: `a {\n\tcolor: pink; // \r;\n}\n`,
			line: 2,
			column: 19,
			message: messages.rejected,
		},
		{
			// A real value keeps the semicolon under Less now (#688); formerly pinned that a comment Less reads behind the carriage return is no node closing the block
			description: `a second inline comment behind the carriage return, which Less reads as a comment, so the declaration closes the block`,
			code: `a {\n\tcolor: pink; // c\r // d\n}\n`,
			fixed: `a {\n\tcolor: pink; // c\r // d\n}\n`,
			line: 2,
			column: 13,
			message: messages.rejected,
		},
		{
			// A real value keeps the semicolon under Less now (#688); formerly pinned that a semicolon in such a comment stays while the one in front of it is taken away
			description: `a semicolon behind the carriage return with a second inline comment holding one behind it`,
			code: `a {\n\tcolor: pink; // c\r; // d;\n}\n`,
			fixed: `a {\n\tcolor: pink; // c\r; // d;\n}\n`,
			line: 2,
			column: 20,
			message: messages.rejected,
		},
		{
			// A real value keeps the semicolon under Less now (#688); formerly pinned that the semicolon behind a flag set by the text of a comment is found in a comment behind it
			description: `a semicolon in the text of an inline comment behind the value, with a second comment on the line holding a semicolon behind a bare carriage return, which Less reads as the one closing the declaration`,
			code: `a {\n\tcolor: pink // x; // c\r;\n}\n`,
			fixed: `a {\n\tcolor: pink // x; // c\r;\n}\n`,
			line: 2,
			column: 25,
			message: messages.rejected,
		},
		{
			// A real value keeps the semicolon under Less now (#688), so there is nothing left for the fix to write. Spelled with escapes because the line the semicolon leaves behind holds a tab and nothing else, which an indented block would leave to whatever trims the file. See #232
			description: `an inline comment behind the value, with the semicolon on the line under it`,
			code: `a {\n\tcolor: pink // keep me\n\t;\n}\n`,
			fixed: `a {\n\tcolor: pink // keep me\n\t;\n}\n`,
			line: 3,
			column: 2,
			message: messages.rejected,
		},
		{
			// A real value keeps the semicolon under Less now (#688); formerly a case for #721, where Less reads a bare carriage return ending an inline comment as a line feed, so the semicolon is code
			description: `a semicolon behind a bare carriage return ending an inline comment, which Less reads as a line feed, so the semicolon is code`,
			code: `a {\n\tcolor: pink // c\r;\n}\n`,
			fixed: `a {\n\tcolor: pink // c\r;\n}\n`,
			line: 2,
			column: 19,
			message: messages.rejected,
		},
		{
			// A real value keeps the semicolon under Less now (#688); formerly a case for #721, on the same break behind a semicolon in the text of the comment
			description: `the same break behind a semicolon in the text of the comment, which this syntax reads as the one closing the declaration and Less as the text of the comment`,
			code: `a {\n\tcolor: pink // ;\r\t;\n}\n`,
			fixed: `a {\n\tcolor: pink // ;\r\t;\n}\n`,
			line: 2,
			column: 20,
			message: messages.rejected,
		},
		{
			// A real value keeps the semicolon under Less now (#688); formerly a case for #217, on the comment standing behind the semicolon instead
			description: `the same comment standing behind the semicolon instead, where this syntax reads it as a node of its own rather than as part of the value`,
			code: `
				a {
					color: pink; // keep me
				}
			`,
			fixed: `
				a {
					color: pink; // keep me
				}
			`,
			line: 2,
			column: 13,
			message: messages.rejected,
		},
		{
			// A real value keeps the semicolon under Less now (#688). Spelled with escapes for the line holding a tab alone, as above. See #359
			description: `a semicolon of code on the line under an inline comment whose text holds two`,
			code: `a {\n\tcolor: pink // ;;\n\t;\n}\n`,
			fixed: `a {\n\tcolor: pink // ;;\n\t;\n}\n`,
			line: 3,
			column: 2,
			message: messages.rejected,
		},
		{
			// A real value keeps the semicolon under Less now (#688); formerly a case for #325, on a second semicolon standing behind the one that closes the declaration
			description: `a second semicolon standing behind the one that closes the declaration, which this syntax keeps in the same raw plain CSS keeps it in`,
			code: `a { color: pink;; }`,
			fixed: `a { color: pink;; }`,
			line: 1,
			column: 17,
			message: messages.rejected,
		},
		{
			// See #309
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
			// See #309
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
			// See #309
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
			// See #309
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
			// See #309
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
			// See #309
			description: `a Less variable closing the block, which Less does read as a declaration and this rule does not, so the semicolon is reported and left where it stands`,
			code: `a { @v: pink; }`,
			fixed: `a { @v: pink; }`,
			line: 1,
			column: 13,
			message: messages.rejected,
		},
		{
			// See #309
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
			// See #357
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
			// See #309
			description: `a mixin call closing the block, which this syntax hands over as an at-rule named for the class and Less reads as a call`,
			code: `a { .b(); }`,
			fixed: `a { .b() }`,
			line: 1,
			column: 9,
			message: messages.rejected,
		},
		{
			// See #309
			description: `a value Less itself refuses in a declaration, which is what telling a declaration from an at-rule would have to catch and what this rule declines to read`,
			code: `a { @v: pink !IMPORTANT; }`,
			fixed: `a { @v: pink !IMPORTANT; }`,
			line: 1,
			column: 24,
			message: messages.rejected,
		},
		{
			// See #688
			description: `an ordinary declaration whose value Less itself refuses without the semicolon, which telling apart from a value it reads costs Less's own expression grammar, so this option leaves every such declaration's semicolon in place`,
			code: `a { color: pink !IMPORTANT; }`,
			fixed: `a { color: pink !IMPORTANT; }`,
			line: 1,
			column: 27,
			message: messages.rejected,
		},
		{
			// See #309
			description: `a Less variable spelling no value, which Less reads as a directive rather than as a declaration and asks the semicolon of`,
			code: `a { @v:; }`,
			fixed: `a { @v:; }`,
			line: 1,
			column: 8,
			message: messages.rejected,
		},
		{
			// See #358
			description: `a declaration spelling no value, which Less reads to its semicolon as it reads a bodiless at-rule, so the problem is reported and the file left alone`,
			code: `a { color:; }`,
			fixed: `a { color:; }`,
			line: 1,
			column: 11,
			message: messages.rejected,
		},
		{
			// See #358
			description: `the same declaration with a block comment behind the colon, which is no more of a value to Less than the whitespace is`,
			code: `a { color: /* c */; }`,
			fixed: `a { color: /* c */; }`,
			line: 1,
			column: 19,
			message: messages.rejected,
		},
		{
			// See #358
			description: `a declaration spelling nothing but an important flag, which Less reads no value in either`,
			code: `a { color: !important; }`,
			fixed: `a { color: !important; }`,
			line: 1,
			column: 22,
			message: messages.rejected,
		},
		{
			// See #358
			description: `a custom property spelling no value, which this syntax hands over the same way and Less asks the semicolon of just as readily`,
			code: `a { --x:; }`,
			fixed: `a { --x:; }`,
			line: 1,
			column: 9,
			message: messages.rejected,
		},
		{
			// See #358
			description: `a custom property spelling nothing but that flag, which such a property takes literally as its value, so the semicolon goes`,
			code: `a { --x: !important; }`,
			fixed: `a { --x: !important }`,
			line: 1,
			column: 20,
			message: messages.rejected,
		},
		{
			// Spelled with escapes because the fix leaves nothing but a trailing space behind the comment, which an indented block would leave to whatever trims the file. See #722
			description: `a semicolon in the text of an inline comment behind a custom property's bare parenthesised group, which is no call and no entity that loop consumes whole, so the flag is believed as it was before this option had a bare entity to tell it from`,
			code: `a {\n\t--x: (a) // ;\n}\n`,
			fixed: `a {\n\t--x: (a) // \n}\n`,
			line: 2,
			column: 14,
			message: messages.rejected,
		},
		{
			// See #374
			description: `a space between a mixin call's important flag and its semicolon, which the parser collects into the call's raw along with the space in front of the flag`,
			code: `
				a {
					.m() !important ;
				}
			`,
			fixed: `
				a {
					.m() !important
				}
			`,
			line: 2,
			column: 18,
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
			// See #327
			description: `a mixin call alone in its block with a comment standing in front of it, which this syntax reads as a bodiless at-rule`,
			code: `a { /* keep me */ .mixin() }`,
		},
		{
			// See #327
			description: `the same call with an inline comment standing in front of it`,
			code: `
				a {
					// keep me
					.mixin()
				}
			`,
		},
		{
			// See #327
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
			// The Sass half of the page this case once shared stays with the core: a style element carries the syntax of its own block, and Less keeps the semicolon behind an at-rule without a block, so the warning stands over code the fix leaves alone. See #309
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
			// A real value keeps the semicolon under Less now (#688); formerly a case for #479, on an inline comment ending the declaration
			description: `an inline comment ending the declaration, whose closing break stands in front of the semicolon`,
			code: `a { b: c // x\n; }`,
			fixed: `a { b: c // x\n; }`,
			line: 2,
			column: 1,
			endLine: 2,
			endColumn: 2,
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
			// See #723
			description: `a declaration a semicolon in the text of its inline comment closed, a declaration standing in the rest of that text, the rest of whose line Less reads as the comment: no semicolon closes the block, and the comment is left alone`,
			code: `
				a {
					color: pink // ; top: 0
				}
			`,
			fixed: `
				a {
					color: pink // ; top: 0
				}
			`,
			line: 2,
			column: 15,
			message: messages.expected,
		},
		{
			// See #723
			description: `the same comment holding a rule in place of the declaration`,
			code: `
				a {
					color: pink // ; .b { c: d }
				}
			`,
			fixed: `
				a {
					color: pink // ; .b { c: d }
				}
			`,
			line: 2,
			column: 15,
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
			// See #723
			description: `a declaration a semicolon in the text of its inline comment closed, a declaration closed by a semicolon standing in the rest of that text`,
			code: `
				a {
					color: pink // ; top: 0;
				}
			`,
		},
		{
			// See #723
			description: `the same comment holding a mixin call closed by a semicolon`,
			code: `
				a {
					color: pink // ; .m();
				}
			`,
		},
	],
})
