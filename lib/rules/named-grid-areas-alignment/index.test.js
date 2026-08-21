import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName })

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
