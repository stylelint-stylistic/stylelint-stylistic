import { testRule } from "stylelint-test-rule-node"
import plugins from "../../index.js"
import { ruleName, messages } from "./index.js"
import { stripIndent } from "common-tags"

/**
 * Default options
 */
testRule({
	plugins,
	ruleName,
	config: [true],
	fix: true,

	accept: [
		{
			description: `No value yet`,
			code: `a { grid-template-areas: }`,
		},
		{
			description: `Weirdly formatted property name`,
			code: `a { GrId-TeMpLaTe-ArEaS: }`,
		},
		{
			description: `With literal value`,
			code: `a { grid-template-areas: none; }`,
		},
		{
			description: `With literal value and comment`,
			code: `a { grid-template-areas: /* "comment" */none; }`,
		},
		{
			description: `Empty value`,
			code: `a { grid-template-areas: ''; }`,
		},
		{
			description: `Minimal example`,
			code: `a { grid-template-areas: 'a a a'; }`,
		},
		{
			description: `Basic example`,
			code: `a { grid-template-areas: 'a a a' 'b b b'; }`,
		},
		{
			description: `Basic example with different cell lengths`,
			code: stripIndent(`
				a {
					grid-template-areas:
						'a aa aaa aaaa'
						'b b  b   b';
				}
			`),
		},
		{
			description: `Invalid but properly aligned value (1)`,
			code: stripIndent(`
				a {
					grid-template-areas:
						'a aa aaa b'
						'b b  b   b';
				}
			`),
		},
		{
			description: `Invalid but properly aligned value (2)`,
			code: stripIndent(`
				a {
					grid-template-areas: 'aaa aaa'
					                     'b   b   b b'
															 'c';
				}
			`),
		},
		{
			description: `With weird linebreaks and tabs`,
			code: stripIndent(`
				a

				{ grid-template-areas:
							'a aa aaa aaaa'
							'b b  b   b'

							'c cc ccc c'
				}
			`),
		},
		{
			description: `With linebreaks and comments`,
			code: stripIndent(`
				a {
					grid-template-areas:

						'a aa aaa aaaa'
						/* example comment with "double", 'single' brackets or \`backticks\` */
						'b b  b   b'
						'c cc ccc c' }
			`),
		},
	],

	reject: [
		{
			description: `Not aligned columns`,
			code: stripIndent(`
				a {
					grid-template-areas:
						'   a a a'
						'bb bb bb'
				}
			`),
			fixed: stripIndent(`
				a {
					grid-template-areas:
						'a  a  a'
						'bb bb bb'
				}
			`),
			message: messages.expected(),
			line: 3, column: 3,
			endLine: 4, endColumn: 12,
		},
		{
			description: `Not aligned columns using different cell lengths, whitespaces, quotes and comments`,
			code: stripIndent(`
				a {
					grid-template-areas:
						'a a a'
						/* comment */
						'bb bbbb bb'
								/*"another" comment*/
						"cccc ccc cc"
				}
			`),
			fixed: stripIndent(`
				a {
					grid-template-areas:
						'a    a    a'
						/* comment */
						'bb   bbbb bb'
								/*"another" comment*/
						"cccc ccc  cc"
				}
			`),
			line: 3, column: 3,
			endLine: 7, endColumn: 15,
			message: messages.expected(),
		},
		{
			description: `Not aligned columns with missed cells`,
			code: stripIndent(`
				a {
					grid-template-areas:
						'a'
						'bb bbbb bb'
						'cccc ccc'
				}
			`),
			fixed: stripIndent(`
				a {
					grid-template-areas:
						'a'
						'bb   bbbb bb'
						'cccc ccc'
				}
			`),
			line: 3, column: 3,
			endLine: 5, endColumn: 12,
			message: messages.expected(),
		},
		{
			description: `With SASS-style comment`,
			code: stripIndent(`
				a {
					grid-template-areas:
						'a  a            a' // inline SASS-style comment
						// some comment
						'b     b b'
						  /* and a CSS one with extra spaces */
				}
			`),
			fixed: stripIndent(`
				a {
					grid-template-areas:
						'a a a' // inline SASS-style comment
						// some comment
						'b b b'
						  /* and a CSS one with extra spaces */
				}
			`),
			line: 3, column: 3,
			endLine: 5, endColumn: 13,
			message: messages.expected(),
		},
	],
})

/**
 * Report ranges using various (sometimes even weird) formatting
 */
testRule({
	plugins,
	ruleName,
	config: [true],

	reject: [
		{
			description: `Single-line formatting`,
			code: `a { grid-template-areas: 'a  a  a' }`,
			message: messages.expected(),
			line: 1, column: 26,
			endLine: 1, endColumn: 34,
		},
		{
			description: `Single-line formatting with extra linebreaks and mixed tab and space characters`,
			code: stripIndent(`
				a {


					grid-template-areas:

									   'a  a  a'
				}
			`),
			message: messages.expected(),
			line: 6, column: 9,
			endLine: 6, endColumn: 17,
		},
		{
			description: `Multi-line formatting starting on the same line`,
			code: stripIndent(`
				a {
					grid-template-areas: 'a  a  a'
					                     'bb  bb  bb'
					                     'ccc  ccc  ccc'
				}
			`),
			message: messages.expected(),
			line: 2, column: 23,
			endLine: 4, endColumn: 37,
		},
		{
			description: `Multi-line formatting starting on the same line with no alignment`,
			code: stripIndent(`
				a {
					grid-template-areas: 'a  a  a'
					   'bb  bb  bb'
					        'ccc  ccc  ccc'
				}
			`),
			message: messages.expected(),
			line: 2, column: 23,
			endLine: 4, endColumn: 24,
		},
		{
			description: `Multi-line formatting starting on different lines`,
			code: stripIndent(`
				a {
					grid-template-areas:
						'a  a  a'
						'bb  bb  bb'
						'ccc  ccc  ccc'
				}
			`),
			message: messages.expected(),
			line: 3, column: 3,
			endLine: 5, endColumn: 17,
		},
		{
			description: `Multi-line formatting starting on different lines using extra linebreaks, comments and mixed tabs/spaces`,
			code: stripIndent(`
				a {
					grid-template-areas:

						  'a  a  a' /* comment */
						'bb  bb  bb'
						/* comment */
						'ccc  ccc  ccc     '
				}
			`),
			message: messages.expected(),
			line: 4, column: 5,
			endLine: 7, endColumn: 22,
		},
		{
			description: `Declaration within at-rule`,
			code: stripIndent(`
				@media (width >= 320px) {
					a {
						grid-template-areas:
							'a  a  a'
							'bb  bb  bb'
							'ccc  ccc  ccc'
					}
				}
			`),
			message: messages.expected(),
			line: 4, column: 4,
			endLine: 6, endColumn: 18,
		},
		{
			description: `Nested declaration within at-rule with extra indentation`,
			code: stripIndent(`
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
			`),
			message: messages.expected(),
			line: 5, column: 7,
			endLine: 7, endColumn: 21,
		},
	],
})

/**
 * Custom `gap`
 */
testRule({
	plugins,
	ruleName,
	config: [true, { gap: 2 }],
	fix: true,

	accept: [
		{
			description: `Minimal example using custom 'gap'`,
			code: `a { grid-template-areas: 'a  a  a'; }`,
		},
		{
			description: `Basic example using custom 'gap'`,
			code: stripIndent(`
				a {
					grid-template-areas:
					'a  a  a'
					'b  b  b';
				}
			`),
		},
		{
			description: `Basic example using custom 'gap' with different cell lengths`,
			code: stripIndent(`
				a {
					grid-template-areas:
						'a  aa  aaa  aaaa'
						'b  b   b    b';
				}
			`),
		},
		{
			description: `With linebreaks, tabs and three rows using custom 'gap'`,
			code: stripIndent(`
				a {
					grid-template-areas:
					'a  aa  aaa  aaaa'
						'b  b   b    b'
					'c  cc  ccc  c'
				}
			`),
		},
	],

	reject: [
		{
			description: `Wrong number of spaces`,
			code: `a { grid-template-areas: 'a a a' }`,
			fixed: `a { grid-template-areas: 'a  a  a' }`,
			message: messages.expected(),
			line: 1, column: 26,
			endLine: 1, endColumn: 32,
		},
		{
			description: `Not aligned columns using custom 'gap'`,
			code: stripIndent(`
				a {
					grid-template-areas:
						'a a a'
						'bb bb bb'
				}
			`),
			fixed: stripIndent(`
				a {
					grid-template-areas:
						'a   a   a'
						'bb  bb  bb'
				}
			`),
			message: messages.expected(),
			line: 3, column: 3,
			endLine: 4, endColumn: 12,
		},
		{
			description: `Not aligned columns using different cell lengths, whitespaces, quotes and comments with custom 'gap'`,
			code: stripIndent(`
				a {
					grid-template-areas:
						'a a a'
						'bb bbbb bb'
							/* comment */
						"cccc ccc cc"  }
			`),
			fixed: stripIndent(`
				a {
					grid-template-areas:
						'a     a     a'
						'bb    bbbb  bb'
							/* comment */
						"cccc  ccc   cc"  }
			`),
			message: messages.expected(),
			line: 3, column: 3,
			endLine: 6, endColumn: 15,
		},
		{
			description: `Not aligned columns with missed cells`,
			code: stripIndent(`
				a {
					grid-template-areas:
					'a'
					'bb bbbb bb'
					'cccc ccc'
				}
			`),
			fixed: stripIndent(`
				a {
					grid-template-areas:
					'a'
					'bb    bbbb  bb'
					'cccc  ccc'
				}
			`),
			message: messages.expected(),
			line: 3, column: 2,
			endLine: 5, endColumn: 11,
		},
	],
})

/**
 * `alignQuotes` set to `true`
 */
testRule({
	plugins,
	ruleName,
	config: [true, { alignQuotes: true }],
	fix: true,

	accept: [
		{
			description: `Basic example using 'alignQuotes' with different cell lengths`,
			code: stripIndent(`
				a {
					grid-template-areas:
						'a aa aaa aaaa'
						'b b  b   b   ';
				}
			`),
		},
		{
			description: `With linebreaks/tabs, three rows and 'alignQuotes'`,
			code: stripIndent(`
				a {
				grid-template-areas:

						'a aa aaa aaaa'
						 'b b  b   b   '
						'c cc ccc c   '
				}
			`),
		},
	],

	reject: [
		{
			description: `Not aligned ending quotes using 'alignQuotes: true'`,
			code: stripIndent(`
				a {
					grid-template-areas:
						'a   a   a'
						'bbb bbb bbb'
					}
			`),
			fixed: stripIndent(`
				a {
					grid-template-areas:
						'a   a   a  '
						'bbb bbb bbb'
					}
			`),
			line: 3, column: 3,
			endLine: 4, endColumn: 15,
			message: messages.expected(),
		},
		{
			description: `Not aligned columns using different cell lengths, whitespaces, quotes and comments with 'alignQuotes'`,
			code: stripIndent(`
				a {
					grid-template-areas:
						'a    a    a'
						'bb   bbbb bbbb'
						/* comment */
						"cccc ccc  cc"/* ending comment */
				}
			`),
			fixed: stripIndent(`
				a {
					grid-template-areas:
						'a    a    a   '
						'bb   bbbb bbbb'
						/* comment */
						"cccc ccc  cc  "/* ending comment */
				}
			`),
			line: 3, column: 3,
			endLine: 6, endColumn: 16,
			message: messages.expected(),
		},
		{
			description: `Not aligned columns with missed cells using 'alignQuotes'`,
			code: stripIndent(`
				a {
					grid-template-areas:
						'a'
						'bb   bbbb bb'
						'cccc ccc'
					}
			`),
			fixed: stripIndent(`
				a {
					grid-template-areas:
						'a           '
						'bb   bbbb bb'
						'cccc ccc    '
					}
			`),
			line: 3, column: 3,
			endLine: 5, endColumn: 12,
			message: messages.expected(),
		},
	],
})

/**
 * `alignQuotes` set to `true` and custom `gap`
 */
testRule({
	plugins,
	ruleName,
	config: [true, { gap: 3, alignQuotes: true }],
	fix: true,

	accept: [
		{
			description: `Basic example using custom settings with different cell lengths`,
			code: stripIndent(`
				a {
					grid-template-areas:
						'a   aa   aaa   aaaa'
						'b   b    b     b   ';
					}
			`),
		},
		{
			description: `With linebreaks/tabs, three rows using custom 'gap'`,
			code: stripIndent(`
				a {
					grid-template-areas:
						'a   aa   aaa   aaaa'
						'b   b    b     b   '

						'c   cc   ccc   c   '}
			`),
		},
	],

	reject: [
		{
			description: `Not aligned columns using 'alignQuotes' and custom 'gap'`,
			code: stripIndent(`
				a {
					grid-template-areas:
						'a a aaaa'
						'bb bb bb'
					}
			`),
			fixed: stripIndent(`
				a {
					grid-template-areas:
						'a    a    aaaa'
						'bb   bb   bb  '
					}
			`),
			line: 3, column: 3,
			endLine: 4, endColumn: 12,
			message: messages.expected(),
		},
		{
			description: `Not aligned columns using different cell lengths, whitespaces, quotes and comments with 'alignQuotes' and custom 'gap'`,
			code: stripIndent(`
				a {
					grid-template-areas:
						'a a a'
						'bb bbbb bb'
						/* comment */
						"cccc ccc cc";
				}
			`),
			fixed: stripIndent(`
				a {
					grid-template-areas:
						'a      a      a '
						'bb     bbbb   bb'
						/* comment */
						"cccc   ccc    cc";
				}
			`),
			line: 3, column: 3,
			endLine: 6, endColumn: 16,
			message: messages.expected(),
		},
		{
			description: `Not aligned columns with missed cells using 'alignQuotes' and custom 'gap'`,
			code: stripIndent(`
				a {
					grid-template-areas:
						'a'
						'bb bbbb bb'
						'cccc ccc';
				}
			`),
			fixed: stripIndent(`
				a {
					grid-template-areas:
						'a               '
						'bb     bbbb   bb'
						'cccc   ccc      ';
				}
			`),
			line: 3, column: 3,
			endLine: 5, endColumn: 13,
			message: messages.expected(),
		},
	],
})
