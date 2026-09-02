import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

// A no-break space, which is a word to the tokenizer, a character of a cell's name to lightningcss and whitespace to JavaScript.
const N = `\u00A0`

/** Default options */
testRule({
	ruleName,
	config: [true],

	accept: [
		{
			description: `a property with no value yet`,
			code: `a { grid-template-areas: }`,
		},
		{
			description: `the same property name written in mixed case`,
			code: `a { GrId-TeMpLaTe-ArEaS: }`,
		},
		{
			description: `a keyword for a value`,
			code: `a { grid-template-areas: none; }`,
		},
		{
			description: `a keyword standing behind a comment`,
			code: `a { grid-template-areas: /* "comment" */none; }`,
		},
		{
			description: `an empty string for a value`,
			code: `a { grid-template-areas: ''; }`,
		},
		{
			description: `two rows holding no cell at all`,
			code: `a { grid-template-areas: '' ''; }`,
		},
		{
			description: `a row holding no cell in front of two rows already aligned`,
			code: `a { grid-template-areas: '' 'a a' 'b b'; }`,
		},
		{
			description: `a single row of three cells`,
			code: `a { grid-template-areas: 'a a a'; }`,
		},
		{
			description: `two rows of three cells`,
			code: `a { grid-template-areas: 'a a a' 'b b b'; }`,
		},
		{
			description: `rows whose cells are of different lengths`,
			code: `
				a {
					grid-template-areas:
						'a aa aaa aaaa'
						'b b  b   b';
				}
			`,
		},
		{
			description: `rows of unequal cell counts, aligned all the same`,
			code: `
				a {
					grid-template-areas:
						'a aa aaa b'
						'b b  b   b';
				}
			`,
		},
		{
			description: `rows the parser can make no grid of, aligned all the same`,
			code: `
				a {
					grid-template-areas: 'aaa aaa'
					                     'b   b   b b'
															 'c';
				}
			`,
		},
		{
			description: `rows separated by odd line breaks and tabs`,
			code: `
				a

				{ grid-template-areas:
							'a aa aaa aaaa'
							'b b  b   b'

							'c cc ccc c'
				}
			`,
		},
		{
			description: `rows separated by line breaks and comments`,
			code: `
				a {
					grid-template-areas:

						'a aa aaa aaaa'
						/* example comment with "double", 'single' brackets or \`backticks\` */
						'b b  b   b'
						'c cc ccc c' }
			`,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/367
		{
			description: `a call standing between two rows that are aligned to each other`,
			code: `
				a {
					grid-template-areas: "a a" var(--x) "b b";
				}
			`,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/401
		{
			description: `a row ending on a cell named with a no-break space alone, which is a cell of the row and no trailing whitespace`,
			code: `a { grid-template-areas: "a ${N}" "bb b"; }`,
		},
	],

	reject: [
		{
			description: `columns that do not line up`,
			code: `
				a {
					grid-template-areas:
						'   a a a'
						'bb bb bb'
				}
			`,
			fixed: `
				a {
					grid-template-areas:
						'a  a  a'
						'bb bb bb'
				}
			`,
			line: 3,
			column: 3,
			endLine: 4,
			endColumn: 12,
			message: messages.expected(),
		},
		{
			description: `columns that do not line up, with cells, spaces, quotes and comments of every width`,
			code: `
				a {
					grid-template-areas:
						'a a a'
						/* comment */
						'bb bbbb bb'
								/*"another" comment*/
						"cccc ccc cc"
				}
			`,
			fixed: `
				a {
					grid-template-areas:
						'a    a    a'
						/* comment */
						'bb   bbbb bb'
								/*"another" comment*/
						"cccc ccc  cc"
				}
			`,
			line: 3,
			column: 3,
			endLine: 7,
			endColumn: 15,
			message: messages.expected(),
		},
		{
			description: `uneven spacing between cells written on one line`,
			code: `
				a {
					grid-template-areas: 'a  a  a' 'bb bb bb';
				}
			`,
			fixed: `
				a {
					grid-template-areas: 'a a a' 'bb bb bb';
				}
			`,
			line: 2,
			column: 23,
			endLine: 2,
			endColumn: 43,
			message: messages.expected(),
		},
		{
			description: `even spacing but aligned quotes, written on one line`,
			code: `
				a {
					grid-template-areas: 'a a a   ' 'bb bb bb';
				}
			`,
			fixed: `
				a {
					grid-template-areas: 'a a a' 'bb bb bb';
				}
			`,
			line: 2,
			column: 23,
			endLine: 2,
			endColumn: 44,
			message: messages.expected(),
		},
		{
			description: `columns that do not line up, one row short of a cell`,
			code: `
				a {
					grid-template-areas:
						'a'
						'bb bbbb bb'
						'cccc ccc'
				}
			`,
			fixed: `
				a {
					grid-template-areas:
						'a'
						'bb   bbbb bb'
						'cccc ccc'
				}
			`,
			line: 3,
			column: 3,
			endLine: 5,
			endColumn: 12,
			message: messages.expected(),
		},
		{
			description: `a row followed by an end-of-line comment`,
			code: `
				a {
					grid-template-areas:
						'a  a            a' // inline SASS-style comment
						// some comment
						'b     b b'
						  /* and a CSS one with extra spaces */
				}
			`,
			fixed: `
				a {
					grid-template-areas:
						'a a a' // inline SASS-style comment
						// some comment
						'b b b'
						  /* and a CSS one with extra spaces */
				}
			`,
			line: 3,
			column: 3,
			endLine: 5,
			endColumn: 13,
			message: messages.expected(),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/322
		{
			description: `a row spelled behind a double slash, which plain CSS spells no comment with, so it is a row like any other`,
			code: `
				a {
					grid-template-areas: "a  a" // "x   x"
						"b b";
				}
			`,
			fixed: `
				a {
					grid-template-areas: "a a" // "x x"
						"b b";
				}
			`,
			line: 2,
			column: 23,
			endLine: 3,
			endColumn: 8,
			message: messages.expected(),
		},
		{
			description: `a row spelled inside a block comment, which the parser has a node of its own for`,
			code: `
				a {
					grid-template-areas: "a  a" /* "x   x" */ "b b";
				}
			`,
			fixed: `
				a {
					grid-template-areas: "a a" /* "x   x" */ "b b";
				}
			`,
			line: 2,
			column: 23,
			endLine: 2,
			endColumn: 49,
			message: messages.expected(),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/367
		{
			description: `a call opening the value, whose rows behind it are not aligned`,
			code: `
				a {
					grid-template-areas: var(--x) "a  a" "b b";
				}
			`,
			fixed: `
				a {
					grid-template-areas: var(--x) "a a" "b b";
				}
			`,
			line: 2,
			column: 23,
			endLine: 2,
			endColumn: 44,
			message: messages.expected(),
		},
		{
			description: `a call carrying an argument, standing between the rows`,
			code: `
				a {
					grid-template-areas: "a  a" f(1) "b b";
				}
			`,
			fixed: `
				a {
					grid-template-areas: "a a" f(1) "b b";
				}
			`,
			line: 2,
			column: 23,
			endLine: 2,
			endColumn: 40,
			message: messages.expected(),
		},
		{
			description: `a call whose parentheses hold whitespace of their own`,
			code: `
				a {
					grid-template-areas: "a  a" f( 1 , 2 ) "b b";
				}
			`,
			fixed: `
				a {
					grid-template-areas: "a a" f( 1 , 2 ) "b b";
				}
			`,
			line: 2,
			column: 23,
			endLine: 2,
			endColumn: 46,
			message: messages.expected(),
		},
		{
			description: `a call holding another call`,
			code: `
				a {
					grid-template-areas: "a  a" f(g(1), h(2)) "b b";
				}
			`,
			fixed: `
				a {
					grid-template-areas: "a a" f(g(1), h(2)) "b b";
				}
			`,
			line: 2,
			column: 23,
			endLine: 2,
			endColumn: 49,
			message: messages.expected(),
		},
		{
			description: `a call holding a string, which is a row of no grid and keeps the spacing the file gives it`,
			code: `
				a {
					grid-template-areas: "a  a" f("x  y") "b b";
				}
			`,
			fixed: `
				a {
					grid-template-areas: "a a" f("x  y") "b b";
				}
			`,
			line: 2,
			column: 23,
			endLine: 2,
			endColumn: 45,
			message: messages.expected(),
		},
		{
			description: `a call holding a block comment`,
			code: `
				a {
					grid-template-areas: "a  a" f(/* c */1) "b b";
				}
			`,
			fixed: `
				a {
					grid-template-areas: "a a" f(/* c */1) "b b";
				}
			`,
			line: 2,
			column: 23,
			endLine: 2,
			endColumn: 47,
			message: messages.expected(),
		},
		{
			description: `a call with nothing between its parentheses`,
			code: `
				a {
					grid-template-areas: "a  a" f() "b b";
				}
			`,
			fixed: `
				a {
					grid-template-areas: "a a" f() "b b";
				}
			`,
			line: 2,
			column: 23,
			endLine: 2,
			endColumn: 39,
			message: messages.expected(),
		},
		{
			description: `a keyword standing between the rows, which is spelled the same whether it is printed or taken from the file`,
			code: `
				a {
					grid-template-areas: "a  a" none "b b";
				}
			`,
			fixed: `
				a {
					grid-template-areas: "a a" none "b b";
				}
			`,
			line: 2,
			column: 23,
			endLine: 2,
			endColumn: 40,
			message: messages.expected(),
		},
		{
			description: `a comma standing between the rows with a space on each side, which the parser files inside the divider rather than beside it`,
			code: `
				a {
					grid-template-areas: "a  a" , "b b";
				}
			`,
			fixed: `
				a {
					grid-template-areas: "a a" , "b b";
				}
			`,
			line: 2,
			column: 23,
			endLine: 2,
			endColumn: 37,
			message: messages.expected(),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/368
		{
			description: `a row holding no cell in front of two rows whose cells do not line up`,
			code: `
				a {
					grid-template-areas: '' 'a  a' 'b b';
				}
			`,
			fixed: `
				a {
					grid-template-areas: '' 'a a' 'b b';
				}
			`,
			line: 2,
			column: 23,
			endLine: 2,
			endColumn: 38,
			message: messages.expected(),
		},
		{
			description: `the same row standing between the two others`,
			code: `
				a {
					grid-template-areas: 'a  a' '' 'b b';
				}
			`,
			fixed: `
				a {
					grid-template-areas: 'a a' '' 'b b';
				}
			`,
			line: 2,
			column: 23,
			endLine: 2,
			endColumn: 38,
			message: messages.expected(),
		},
		{
			description: `the same row standing behind them`,
			code: `
				a {
					grid-template-areas: 'a  a' 'b b' '';
				}
			`,
			fixed: `
				a {
					grid-template-areas: 'a a' 'b b' '';
				}
			`,
			line: 2,
			column: 23,
			endLine: 2,
			endColumn: 38,
			message: messages.expected(),
		},
		{
			description: `a row holding nothing but whitespace, which the fix leaves with nothing between its quotation marks`,
			code: `
				a {
					grid-template-areas: '   ' 'a  a' 'b b';
				}
			`,
			fixed: `
				a {
					grid-template-areas: '' 'a a' 'b b';
				}
			`,
			line: 2,
			column: 23,
			endLine: 2,
			endColumn: 41,
			message: messages.expected(),
		},
		{
			description: `the same row with nothing else in the value at all`,
			code: `
				a {
					grid-template-areas: '   ';
				}
			`,
			fixed: `
				a {
					grid-template-areas: '';
				}
			`,
			line: 2,
			column: 23,
			endLine: 2,
			endColumn: 28,
			message: messages.expected(),
		},
		{
			description: `a comment standing between a row holding no cell and a row whose cells do not line up`,
			code: `
				a {
					grid-template-areas: '' /* c */ 'a  a';
				}
			`,
			fixed: `
				a {
					grid-template-areas: '' /* c */ 'a a';
				}
			`,
			line: 2,
			column: 23,
			endLine: 2,
			endColumn: 40,
			message: messages.expected(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/378
			description: `a row standing inside a comment opening with a solidus, a star and a solidus, which the value parser hands back as a string and which is no row of the grid`,
			code: `a { grid-template-areas: "c   c" /*/ "a  a" */ "b b"; }`,
			fixed: `a { grid-template-areas: "c c" /*/ "a  a" */ "b b"; }`,
			line: 1,
			column: 26,
			endLine: 1,
			endColumn: 53,
			message: messages.expected(),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/504
		{
			description: `a quotation mark standing inside such a comment, which the value parser pairs with the opening mark of the row behind it, so that the rows behind the comment are cut at the wrong places`,
			code: `a { grid-template-areas: "c   c" /*/ " */ "a  a" "b b"; }`,
			fixed: `a { grid-template-areas: "c c" /*/ " */ "a a" "b b"; }`,
			line: 1,
			column: 26,
			endLine: 1,
			endColumn: 55,
			message: messages.expected(),
		},
		{
			description: `an apostrophe standing inside such a comment, which the value parser opens a string on that no mark of the value closes, so that every row behind the comment is its text to the parser`,
			code: `a { grid-template-areas: "c   c" /*/ ' */ "a  a" "b b"; }`,
			fixed: `a { grid-template-areas: "c c" /*/ ' */ "a a" "b b"; }`,
			line: 1,
			column: 26,
			endLine: 1,
			endColumn: 55,
			message: messages.expected(),
		},
		{
			description: `a quotation mark inside a bare address in front of the rows, which is a character of the address to every tokenizer, so that the marks behind the address pair as the file pairs them and a slash and a star inside one of the rows open no comment`,
			code: `a { grid-template-areas: url(a"b)c"/*" "d  d"; }`,
			fixed: `a { grid-template-areas: url(a"b)c"/*" "d d"; }`,
			line: 1,
			column: 26,
			endLine: 1,
			endColumn: 46,
			message: messages.expected(),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/401
		{
			description: `a row whose cells are named with a no-break space, which is a word to the tokenizer and whitespace to JavaScript, over a row whose cells do not line up`,
			code: `a { grid-template-areas: "${N} ${N}" "b  b"; }`,
			fixed: `a { grid-template-areas: "${N} ${N}" "b b"; }`,
			line: 1,
			column: 26,
			endLine: 1,
			endColumn: 38,
			message: messages.expected(),
		},
		{
			description: `a cell named with a no-break space inside the name, which is one cell of the row and not two`,
			code: `a { grid-template-areas: "a${N}b c" "d   e"; }`,
			fixed: `a { grid-template-areas: "a${N}b c" "d e"; }`,
			line: 1,
			column: 26,
			endLine: 1,
			endColumn: 41,
			message: messages.expected(),
		},
		{
			description: `a cell named with a vertical tab inside the name, which is a word to the tokenizer and no whitespace of the row`,
			code: `a { grid-template-areas: "a\vb c" "d   e"; }`,
			fixed: `a { grid-template-areas: "a\vb c" "d e"; }`,
			line: 1,
			column: 26,
			endLine: 1,
			endColumn: 41,
			message: messages.expected(),
		},
		{
			description: `a tab and a form feed between the cells of a row, which are whitespace to the tokenizer and collapse to a space`,
			code: `a { grid-template-areas: "a\tb\fc" "d   e"; }`,
			fixed: `a { grid-template-areas: "a b c" "d e"; }`,
			line: 1,
			column: 26,
			endLine: 1,
			endColumn: 41,
			message: messages.expected(),
		},
	],
})

/** Report ranges using various, sometimes even weird, formatting */
testRule({
	ruleName,
	config: [true],

	reject: [
		{
			description: `two spaces between cells written on one line`,
			code: `a { grid-template-areas: 'a  a  a' }`,
			line: 1,
			column: 26,
			endLine: 1,
			endColumn: 34,
			message: messages.expected(),
		},
		{
			description: `the same on one line, with extra line breaks and mixed tabs and spaces`,
			code: `
				a {


					grid-template-areas:

									   'a  a  a'
				}
			`,
			line: 6,
			column: 9,
			endLine: 6,
			endColumn: 17,
			message: messages.expected(),
		},
		{
			description: `rows opening on the line of the property`,
			code: `
				a {
					grid-template-areas: 'a  a  a'
					                     'bb  bb  bb'
					                     'ccc  ccc  ccc'
				}
			`,
			line: 2,
			column: 23,
			endLine: 4,
			endColumn: 37,
			message: messages.expected(),
		},
		{
			description: `the same rows with no alignment at all`,
			code: `
				a {
					grid-template-areas: 'a  a  a'
					   'bb  bb  bb'
					        'ccc  ccc  ccc'
				}
			`,
			line: 2,
			column: 23,
			endLine: 4,
			endColumn: 24,
			message: messages.expected(),
		},
		{
			description: `rows opening on the line below the property`,
			code: `
				a {
					grid-template-areas:
						'a  a  a'
						'bb  bb  bb'
						'ccc  ccc  ccc'
				}
			`,
			line: 3,
			column: 3,
			endLine: 5,
			endColumn: 17,
			message: messages.expected(),
		},
		{
			description: `the same rows with extra line breaks, comments and mixed tabs and spaces`,
			code: `
				a {
					grid-template-areas:

						  'a  a  a' /* comment */
						'bb  bb  bb'
						/* comment */
						'ccc  ccc  ccc     '
				}
			`,
			line: 4,
			column: 5,
			endLine: 7,
			endColumn: 22,
			message: messages.expected(),
		},
		{
			description: `a declaration inside a media query`,
			code: `
				@media (width >= 320px) {
					a {
						grid-template-areas:
							'a  a  a'
							'bb  bb  bb'
							'ccc  ccc  ccc'
					}
				}
			`,
			line: 4,
			column: 4,
			endLine: 6,
			endColumn: 18,
			message: messages.expected(),
		},
		{
			description: `the same declaration indented one level deeper`,
			code: `
				@media (width >= 320px) {
					a {
								a {
									grid-template-areas:
										'a  a  a'
										'bb  bb  bb'
										'ccc  ccc  ccc'
								}
					}
				}
			`,
			line: 5,
			column: 7,
			endLine: 7,
			endColumn: 21,
			message: messages.expected(),
		},
	],
})

/** Custom `gap` */
testRule({
	ruleName,
	config: [true, { gap: 2 }],

	accept: [
		{
			description: `two spaces between cells, which the gap option asks for`,
			code: `a { grid-template-areas: 'a  a  a'; }`,
		},
		{
			description: `the same spacing in rows written on one line`,
			code: `a { grid-template-areas: 'a  a  a' 'bb  bb  bb'; }`,
		},
		{
			description: `the same spacing in rows written on their own lines`,
			code: `
				a {
					grid-template-areas:
					'a  a  a'
					'b  b  b';
				}
			`,
		},
		{
			description: `the same spacing in rows whose cells are of different lengths`,
			code: `
				a {
					grid-template-areas:
						'a  aa  aaa  aaaa'
						'b  b   b    b';
				}
			`,
		},
		{
			description: `three rows separated by line breaks and tabs`,
			code: `
				a {
					grid-template-areas:
					'a  aa  aaa  aaaa'
						'b  b   b    b'
					'c  cc  ccc  c'
				}
			`,
		},
	],

	reject: [
		{
			description: `a single space between cells where the gap option asks for two`,
			code: `a { grid-template-areas: 'a a a' }`,
			fixed: `a { grid-template-areas: 'a  a  a' }`,
			line: 1,
			column: 26,
			endLine: 1,
			endColumn: 32,
			message: messages.expected(),
		},
		{
			description: `the same spacing in rows written on one line`,
			code: `a { grid-template-areas: 'a a a'   'bb bb bb' }`,
			fixed: `a { grid-template-areas: 'a  a  a'   'bb  bb  bb' }`,
			line: 1,
			column: 26,
			endLine: 1,
			endColumn: 45,
			message: messages.expected(),
		},
		{
			description: `columns that do not line up under the wider gap`,
			code: `
				a {
					grid-template-areas:
						'a a a'
						'bb bb bb'
				}
			`,
			fixed: `
				a {
					grid-template-areas:
						'a   a   a'
						'bb  bb  bb'
				}
			`,
			line: 3,
			column: 3,
			endLine: 4,
			endColumn: 12,
			message: messages.expected(),
		},
		{
			description: `the same, with cells, spaces, quotes and comments of every width`,
			code: `
				a {
					grid-template-areas:
						'a a a'
						'bb bbbb bb'
							/* comment */
						"cccc ccc cc"  }
			`,
			fixed: `
				a {
					grid-template-areas:
						'a     a     a'
						'bb    bbbb  bb'
							/* comment */
						"cccc  ccc   cc"  }
			`,
			line: 3,
			column: 3,
			endLine: 6,
			endColumn: 15,
			message: messages.expected(),
		},
		{
			description: `the same, one row short of a cell`,
			code: `
				a {
					grid-template-areas:
					'a'
					'bb bbbb bb'
					'cccc ccc'
				}
			`,
			fixed: `
				a {
					grid-template-areas:
					'a'
					'bb    bbbb  bb'
					'cccc  ccc'
				}
			`,
			line: 3,
			column: 2,
			endLine: 5,
			endColumn: 11,
			message: messages.expected(),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/368
		{
			description: `a row holding no cell between two rows, which widens neither the columns nor the gap between them`,
			code: `
				a {
					grid-template-areas:
						'a a'
						''
						'bb bb';
				}
			`,
			fixed: `
				a {
					grid-template-areas:
						'a   a'
						''
						'bb  bb';
				}
			`,
			line: 3,
			column: 3,
			endLine: 5,
			endColumn: 10,
			message: messages.expected(),
		},
	],
})

/** `alignQuotes` set to `true` */
testRule({
	ruleName,
	config: [true, { alignQuotes: true }],

	accept: [
		{
			description: `closing quotes lined up, as the option asks`,
			code: `
				a {
					grid-template-areas:
						'a aa aaa aaaa'
						'b b  b   b   ';
				}
			`,
		},
		{
			description: `three rows with their quotes lined up, separated by line breaks and tabs`,
			code: `
				a {
				grid-template-areas:

						'a aa aaa aaaa'
						 'b b  b   b   '
						'c cc ccc c   '
				}
			`,
		},
		{
			description: `rows written on one line, which the option leaves alone`,
			code: `
				a { grid-template-areas: 'a a a' 'bb bb bb' }
			`,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/368
		{
			description: `a row holding no cell, already as wide as the rows whose quotes it lines up with`,
			code: `
				a {
					grid-template-areas:
						'a  a '
						'     '
						'bb bb';
				}
			`,
		},
	],

	reject: [
		{
			description: `closing quotes that do not line up`,
			code: `
				a {
					grid-template-areas:
						'a   a   a'
						'bbb bbb bbb'
					}
			`,
			fixed: `
				a {
					grid-template-areas:
						'a   a   a  '
						'bbb bbb bbb'
					}
			`,
			line: 3,
			column: 3,
			endLine: 4,
			endColumn: 15,
			message: messages.expected(),
		},
		{
			description: `the same, with cells, spaces, quotes and comments of every width`,
			code: `
				a {
					grid-template-areas:
						'a    a    a'
						'bb   bbbb bbbb'
						/* comment */
						"cccc ccc  cc"/* ending comment */
				}
			`,
			fixed: `
				a {
					grid-template-areas:
						'a    a    a   '
						'bb   bbbb bbbb'
						/* comment */
						"cccc ccc  cc  "/* ending comment */
				}
			`,
			line: 3,
			column: 3,
			endLine: 6,
			endColumn: 16,
			message: messages.expected(),
		},
		{
			description: `the same, one row short of a cell`,
			code: `
				a {
					grid-template-areas:
						'a'
						'bb   bbbb bb'
						'cccc ccc'
					}
			`,
			fixed: `
				a {
					grid-template-areas:
						'a           '
						'bb   bbbb bb'
						'cccc ccc    '
					}
			`,
			line: 3,
			column: 3,
			endLine: 5,
			endColumn: 12,
			message: messages.expected(),
		},
		{
			description: `padding in front of a closing quote on one line, which the fix strips rather than keeping the quotes aligned`,
			code: `
				a {
					grid-template-areas: 'a a a   ' 'bb bb bb';
				}
			`,
			fixed: `
				a {
					grid-template-areas: 'a a a' 'bb bb bb';
				}
			`,
			line: 2,
			column: 23,
			endLine: 2,
			endColumn: 44,
			message: messages.expected(),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/368
		{
			description: `a row holding no cell between two rows, its closing quote lined up with theirs by the option`,
			code: `
				a {
					grid-template-areas:
						'a  a'
						''
						'bb bb';
				}
			`,
			fixed: `
				a {
					grid-template-areas:
						'a  a '
						'     '
						'bb bb';
				}
			`,
			line: 3,
			column: 3,
			endLine: 5,
			endColumn: 10,
			message: messages.expected(),
		},
		{
			description: `the same row where the others already line up, which is reported for its own quote alone`,
			code: `
				a {
					grid-template-areas:
						'a  a '
						''
						'bb bb';
				}
			`,
			fixed: `
				a {
					grid-template-areas:
						'a  a '
						'     '
						'bb bb';
				}
			`,
			line: 3,
			column: 3,
			endLine: 5,
			endColumn: 10,
			message: messages.expected(),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/401
		{
			description: `a row ending on a cell named with a no-break space alone, padded out to the width of the row below rather than emptied`,
			code: `
				a {
					grid-template-areas:
						"a ${N}"
						"bb  b";
				}
			`,
			fixed: `
				a {
					grid-template-areas:
						"a  ${N}"
						"bb b";
				}
			`,
			line: 3,
			column: 3,
			endLine: 4,
			endColumn: 10,
			message: messages.expected(),
		},
	],
})

/** `alignQuotes` set to `true` and custom `gap` */
testRule({
	ruleName,
	config: [true, { gap: 3, alignQuotes: true }],

	accept: [
		{
			description: `both options at once, in rows whose cells are of different lengths`,
			code: `
				a {
					grid-template-areas:
						'a   aa   aaa   aaaa'
						'b   b    b     b   ';
					}
			`,
		},
		{
			description: `rows on one line, where the gap applies and the quote alignment does not`,
			code: `
				a {
					grid-template-areas: 'a   a   a'  'bb   bb   bb';
					}
			`,
		},
		{
			description: `three rows separated by line breaks and tabs`,
			code: `
				a {
					grid-template-areas:
						'a   aa   aaa   aaaa'
						'b   b    b     b   '

						'c   cc   ccc   c   '}
			`,
		},
	],

	reject: [
		{
			description: `columns that do not line up under both options`,
			code: `
				a {
					grid-template-areas:
						'a a aaaa'
						'bb bb bb'
					}
			`,
			fixed: `
				a {
					grid-template-areas:
						'a    a    aaaa'
						'bb   bb   bb  '
					}
			`,
			line: 3,
			column: 3,
			endLine: 4,
			endColumn: 12,
			message: messages.expected(),
		},
		{
			description: `the same, with cells, spaces, quotes and comments of every width`,
			code: `
				a {
					grid-template-areas:
						'a a a'
						'bb bbbb bb'
						/* comment */
						"cccc ccc cc";
				}
			`,
			fixed: `
				a {
					grid-template-areas:
						'a      a      a '
						'bb     bbbb   bb'
						/* comment */
						"cccc   ccc    cc";
				}
			`,
			line: 3,
			column: 3,
			endLine: 6,
			endColumn: 16,
			message: messages.expected(),
		},
		{
			description: `the same, one row short of a cell`,
			code: `
				a {
					grid-template-areas:
						'a'
						'bb bbbb bb'
						'cccc ccc';
				}
			`,
			fixed: `
				a {
					grid-template-areas:
						'a               '
						'bb     bbbb   bb'
						'cccc   ccc      ';
				}
			`,
			line: 3,
			column: 3,
			endLine: 5,
			endColumn: 13,
			message: messages.expected(),
		},
		{
			description: `uneven spacing between cells written on one line`,
			code: `
				a {
					grid-template-areas: 'a            a  a' 'bb bb bb'
				}
			`,
			fixed: `
				a {
					grid-template-areas: 'a   a   a' 'bb   bb   bb'
				}
			`,
			line: 2,
			column: 23,
			endLine: 2,
			endColumn: 52,
			message: messages.expected(),
		},
		{
			description: `quotes lined up on one line, which the fix strips back to the gap the option asks for`,
			code: `
				a {
					grid-template-areas: 'a   a   a   ' 'bb   bb   bb'
				}
			`,
			fixed: `
				a {
					grid-template-areas: 'a   a   a' 'bb   bb   bb'
				}
			`,
			line: 2,
			column: 23,
			endLine: 2,
			endColumn: 51,
			message: messages.expected(),
		},
	],
})
