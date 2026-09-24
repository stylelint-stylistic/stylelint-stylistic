import { createRule } from "../../../../rules/indentation/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [1],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `a Less at-variable keeps the fix written to its params`,
			code: `
				@foo: (
						'a'
				);
			`,
			fixed: `
				@foo: (
				 'a'
				);
			`,
			line: 2,
			column: 3,
			message: messages.expected(`1 space`),
		},
		{
			description: `a Less at-variable keeps every fix written to its params`,
			code: `
				@foo: (
							'a',
							'b'
				);
			`,
			fixed: `
				@foo: (
				 'a',
				 'b'
				);
			`,
			warnings: [
				{
					line: 2,
					column: 4,
					message: messages.expected(`1 space`),
				},
				{
					line: 3,
					column: 4,
					message: messages.expected(`1 space`),
				},
			],
		},
	],
})
testRule({
	ruleName,
	config: [`tab`],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `the same query read as Less`,
			code: `
				@media (min-width: 100px
					) { a { color: pink; } }
			`,
			fixed: `
				@media (min-width: 100px
				) { a { color: pink; } }
			`,
			line: 2,
			column: 2,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `a comment standing behind an at-rule with neither a block nor a semicolon, which the parser files into that at-rule's whitespace rather than into a node of its own, indented a level past the block it is a line of`,
			code: `
				a {
					@extend .b
						/* c */
				}
			`,
			fixed: `
				a {
					@extend .b
					/* c */
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`1 tab`),
		},
		{
			autoStripIndent: false,
			description: `a stylesheet whose first node stands behind a bare carriage return and a tab, whitespace to the parser and no line`,
			code: `\r\ta{}`,
			fixed: `a{}`,
			line: 1,
			column: 3,
			message: messages.expected(`0 tabs`),
		},
	],
})
testRule({
	ruleName,
	config: [2],
	customSyntax: `postcss-less`,
	// fix: true,

	accept: [
		{
			description: `a Less mixin call whose arguments each stand a level deeper`,
			code:
				`.foo {\n  .mixin(\n    @foo,\n    @bar,\n    @baz\n  );\n}`,
		},
		{
			description: `the same call written with carriage-return line breaks`,
			code:
				`.foo {\r\n  .mixin(\r\n    @foo,\r\n    @bar,\r\n    @baz\r\n  );\r\n}`,
		},
		{
			description: `a Less mixin call taking a block for one of its arguments`,
			code:
				`.foo {\r\n  .mixin(\r\n    {\r\n      @baz\r\n    }\r\n  );\r\n}`,
		},
		{
			description: `the same call with the block opening on the line of the call`,
			code: `.foo {\r\n  .mixin(@foo, {\r\n    @baz\r\n  });\r\n}`,
		},
		{
			description: `a Less mixin call at the root whose first argument is a block`,
			code: `.mixin({\r\n  @foo\r\n}, @bar);`,
		},
	],
})
testRule({
	ruleName,
	config: [2],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `a value whose closing line carries the inline comment`,
			code: `
				a {
				  b: translate(
				    1px,
				    2px
				  ) // c
				}
			`,
		},
	],

	reject: [
		{
			description: `a value continued on the line behind an inline comment`,
			code: `
				a {
				  b: 1px // c
				  2px;
				}
			`,
			fixed: `
				a {
				  b: 1px // c
				    2px;
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`4 spaces`),
		},
		{
			description: `the closing parenthesis of a function on the line behind an inline comment`,
			code: `
				a {
				  b: translate(1px, 2px // c
				    );
				}
			`,
			fixed: `
				a {
				  b: translate(1px, 2px // c
				  );
				}
			`,
			line: 3,
			column: 5,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `a function's arguments opening on the line behind an inline comment, whose parenthesis the comment must not hide`,
			code: `
				a {
				  b: translate( // c
				  1px);
				}
			`,
			fixed: `
				a {
				  b: translate( // c
				    1px);
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`4 spaces`),
		},
		{
			description: `a value carrying two inline comments, every line behind one of them measured`,
			code: `
				a {
				  b: 1px // c
				  2px // c
				  3px;
				}
			`,
			fixed: `
				a {
				  b: 1px // c
				    2px // c
				    3px;
				}
			`,
			warnings: [
				{ line: 3, column: 3, message: messages.expected(`4 spaces`) },
				{ line: 4, column: 3, message: messages.expected(`4 spaces`) },
			],
		},
		{
			description: `a selector line holding nothing but an inline comment`,
			code: `
				x {
				  a,
				// c
				  b { d: e; }
				}
			`,
			fixed: `
				x {
				  a,
				  // c
				  b { d: e; }
				}
			`,
			line: 3,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `an at-rule's parameters continued on the line behind an inline comment`,
			code: `
				@media screen // c
				and (min-width: 100px) {
				  a {
				    b: c;
				  }
				}
			`,
			fixed: `
				@media screen // c
				  and (min-width: 100px) {
				  a {
				    b: c;
				  }
				}
			`,
			line: 2,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `a line holding nothing but an inline comment inside a set of parameters`,
			code: `
				@media screen,
				// c
				print {
				  a { b: c; }
				}
			`,
			fixed: `
				@media screen,
				  // c
				  print {
				  a { b: c; }
				}
			`,
			warnings: [
				{ line: 2, column: 1, message: messages.expected(`2 spaces`) },
				{ line: 3, column: 1, message: messages.expected(`2 spaces`) },
			],
		},
	],
})
testRule({
	ruleName,
	config: [`tab`],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `a value continued on the line behind an inline comment, measured in tabs`,
			code: `
				a {
					b: 1px // c
					2px;
				}
			`,
			fixed: `
				a {
					b: 1px // c
						2px;
				}
			`,
			line: 3,
			column: 2,
			message: messages.expected(`2 tabs`),
		},
	],
})

testRule({
	ruleName,
	config: [
		`tab`,
		{
			baseIndentLevel: 1,
		},
	],
	customSyntax: `postcss-html`,
	autoStripIndent: false,

	accept: [
		{
			description: `a stylesheet indented one level, which the base level asks for`,
			code: `
<style>
\ta {
\t\tdisplay:block;
\t}
</style>`,
		},
		{
			description: `an indented style element whose stylesheet follows it a level deeper`,
			code: `
\t<style>
\t\ta {
\t\t\tdisplay:block;
\t\t}
\t</style>`,
		},
		{
			description: `a style element carrying a language and a nonce`,
			code: `
<style lang="less" nonce="1">
\ta {
\t\tdisplay:block;
\t}
</style>`,
		},
		{
			description: `the same attributes each on a line of its own`,
			code: `
<style
\tlang="less"
\tnonce="1">
\ta {
\t\tdisplay:block;
\t}
</style>`,
		},
		{
			description: `the same attributes indented deeper, the closing bracket on its own line`,
			code: `
<style
\t\tlang="less"
\t\tnonce="1"
>
\ta {
\t\tdisplay:block;
\t}
</style>`,
		},
		{
			description: `the same element indented, its attributes deeper still`,
			code: `
\t<style
\t\tlang="less"
\t\tnonce="1"
\t>
\t\ta {
\t\t\tdisplay:block;
\t\t}
</style>`,
		},
		{
			description: `the same attributes indented unevenly`,
			code: `
<style
\tlang="less"
\t\tnonce="1">
\ta {
\t\tdisplay:block;
\t}
</style>`,
		},
	],
	reject: [
		{
			description: `a stylesheet at the left margin where the base level asks for one`,
			code: `
<style>
a {
\tdisplay:block;
}
</style>`,
			fixed: `
<style>
\ta {
\t\tdisplay:block;
\t}
</style>`,
			warnings: [
				{
					line: 3,
					column: 1,
					message: messages.expected(`1 tab`),
				},
				{
					line: 5,
					column: 1,
					message: messages.expected(`1 tab`),
				},
				{
					line: 4,
					column: 2,
					message: messages.expected(`2 tabs`),
				},
			],
		},
		{
			description: `an indented style element whose stylesheet is level with it`,
			code: `
\t<style>
\ta {
\t\tdisplay:block;
\t}
\t</style>`,
			fixed: `
\t<style>
\t\ta {
\t\t\tdisplay:block;
\t\t}
\t</style>`,
			warnings: [
				{
					line: 3,
					column: 2,
					message: messages.expected(`2 tabs`),
				},
				{
					line: 5,
					column: 2,
					message: messages.expected(`2 tabs`),
				},
				{
					line: 4,
					column: 3,
					message: messages.expected(`3 tabs`),
				},
			],
		},
	],
})
testRule({
	ruleName,
	config: [
		2,
		{
			baseIndentLevel: 1,
		},
	],
	customSyntax: `postcss-html`,
	autoStripIndent: false,

	accept: [
		{
			description: `a stylesheet indented two spaces, which the base level asks for`,
			code: `
<style>
  a {
    display:block;
  }
</style>`,
		},
		{
			description: `an indented style element whose stylesheet follows it a level deeper`,
			code: `
  <style>
    a {
      display:block;
    }
  </style>`,
		},
		{
			description: `a style element carrying a language and a nonce`,
			code: `
<style lang="less" nonce="1">
  a {
    display:block;
  }
</style>`,
		},
		{
			description: `the same attributes each on a line of its own`,
			code: `
<style
  lang="less"
  nonce="1">
  a {
    display:block;
  }
</style>`,
		},
		{
			description: `the same attributes indented deeper, the closing bracket on its own line`,
			code: `
<style
    lang="less"
    nonce="1"
>
  a {
    display:block;
  }
</style>`,
		},
		{
			description: `the same element indented, its attributes deeper still`,
			code: `
  <style
    lang="less"
    nonce="1"
  >
    a {
      display:block;
    }
</style>`,
		},
		{
			description: `the same attributes indented unevenly`,
			code: `
<style
  lang="less"
    nonce="1">
  a {
    display:block;
  }
</style>`,
		},
	],
	reject: [
		{
			description: `a stylesheet at the left margin where the base level asks for one`,
			code: `
<style>
a {
  display:block;
}
</style>`,
			fixed: `
<style>
  a {
    display:block;
  }
</style>`,
			warnings: [
				{
					line: 3,
					column: 1,
					message: messages.expected(`2 spaces`),
				},
				{
					line: 5,
					column: 1,
					message: messages.expected(`2 spaces`),
				},
				{
					line: 4,
					column: 3,
					message: messages.expected(`4 spaces`),
				},
			],
		},
		{
			description: `an indented style element whose stylesheet stands two levels too deep`,
			code: `
  <style
    lang="less">
      a {
        display:block;
      }
  </style>`,
			fixed: `
  <style
    lang="less">
    a {
      display:block;
    }
  </style>`,
			warnings: [
				{
					line: 4,
					column: 7,
					message: messages.expected(`4 spaces`),
				},
				{
					line: 6,
					column: 7,
					message: messages.expected(`4 spaces`),
				},
				{
					line: 5,
					column: 9,
					message: messages.expected(`6 spaces`),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`tab`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `the closing brace of a block whose last statement is a mixin call carrying no semicolon, standing at the level the block does`,
			code: `
				a {
					.m()
				}
			`,
		},
		{
			description: `a comment such a call swallowed, standing at the level of the block it is a line of`,
			code: `
				a {
					.m()
					/* c */
				}
			`,
		},
		{
			description: `an important flag such a call spells on a line of its own, which is measured no more than with a semicolon behind the call`,
			code: `
				a {
					.m()
				!important
				}
			`,
		},
		{
			description: `the same flag at the call's level with a comment behind it on its line, which is the flag's line as well`,
			code: `
				a {
					.m()
					!important /* c */
				}
			`,
		},
	],

	reject: [
		{
			description: `a comment such a call swallowed, indented a level past the block it is a line of`,
			code: `
				a {
					.m()
						/* c */
				}
			`,
			fixed: `
				a {
					.m()
					/* c */
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`1 tab`),
		},
		{
			description: `that closing brace indented a level in, the run in front of it standing in the mixin call's whitespace rather than in the block's own`,
			code: `
				a {
					.m()
						}
			`,
			fixed: `
				a {
					.m()
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `the same brace behind a call carrying a bang flag, whose whitespace the parser collects from both sides of that flag`,
			code: `
				a {
					.m() !important
						}
			`,
			fixed: `
				a {
					.m() !important
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `a comment such a call swallowed behind a bang flag, indented a level past the block it is a line of`,
			code: `
				a {
					.m() !important
						/* c */
				}
			`,
			fixed: `
				a {
					.m() !important
					/* c */
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`1 tab`),
		},
	],
})

testRule({
	ruleName,
	config: [`tab`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `a semicolon alone on its line behind a mixin call, at the call's level`,
			code: `a {\n\t.m()\n\t;\n}\n`,
		},
		{
			// The rest of the flag's line is the flag's wherever the parser files it
			description: `an important flag the stylesheet's last mixin call spells on a line of its own, indented, with a comment behind it`,
			code: `
				a {}
				.m()
					!important /* c */
			`,
		},
	],

	reject: [
		{
			description: `a semicolon alone on its line, indented two levels past the mixin call it closes`,
			code: `a {\n\t.m()\n\t\t\t;\n}\n`,
			fixed: `a {\n\t.m()\n\t;\n}\n`,
			line: 3,
			column: 4,
			message: messages.expected(`1 tab`),
		},
		{
			description: `the same line behind a variable declaration, which Less reads as an at-rule`,
			code: `a {\n\t@v: 1\n;\n}\n`,
			fixed: `a {\n\t@v: 1\n\t;\n}\n`,
			line: 3,
			column: 1,
			message: messages.expected(`1 tab`),
		},
		{
			description: `the same line behind a detached ruleset call`,
			code: `a {\n\t@r()\n\t\t\t;\n}\n`,
			fixed: `a {\n\t@r()\n\t;\n}\n`,
			line: 3,
			column: 4,
			message: messages.expected(`1 tab`),
		},
		{
			description: `the same line behind a mixin call carrying an important flag, whose run the parser gathers in front of the flag`,
			code: `a {\n\t.m() !important\n\t\t\t;\n}\n`,
			fixed: `a {\n\t.m() !important\n\t;\n}\n`,
			line: 3,
			column: 4,
			message: messages.expected(`1 tab`),
		},
		{
			description: `a comment behind the stylesheet's last mixin call, which has neither a block nor a semicolon, indented a level past the call`,
			code: `
				a {}
				.m()
					/* c */
			`,
			fixed: `
				a {}
				.m()
				/* c */
			`,
			line: 3,
			column: 2,
			message: messages.expected(`0 tabs`),
		},
		{
			// The run in front of the flag is the call's, so the comment's line is where the file has it
			description: `the same comment behind such a call carrying an important flag`,
			code: `
				a {}
				.m() !important
					/* c */
			`,
			fixed: `
				a {}
				.m() !important
				/* c */
			`,
			line: 3,
			column: 2,
			message: messages.expected(`0 tabs`),
		},
	],
})

testRule({
	ruleName,
	config: [`tab`],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `a value opening on the line behind its colon, read as Less`,
			code: `a {\n\tb:\n1px;\n}\n`,
			fixed: `a {\n\tb:\n\t\t1px;\n}\n`,
			line: 3,
			column: 1,
			message: messages.expected(`2 tabs`),
		},
	],
})

testRule({
	ruleName,
	config: [`tab`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `an inline comment on its own line behind a mixin call carrying no semicolon, which the parser keeps in the call's params and Less reads to the end of its line, standing at the level of the block it is a line of`,
			code: `
				a {
					.m()
					// c
				}
			`,
		},
		{
			description: `the same comment holding a semicolon, on which the parser closes the call`,
			code: `
				a {
					.m()
					// c;
				}
			`,
		},
		{
			description: `such a comment under one on the call's own line, which opens no line to measure, so the line under it is the block's`,
			code: `
				a {
					.m() // c
					// d
				}
			`,
		},
		{
			description: `such a comment behind a call whose params span lines, each of which is the call's`,
			code: `
				a {
					.m(
						1
					)
					// c
				}
			`,
		},
		{
			description: `such a comment behind a call written without parentheses, whose params the parser makes of the comment alone, the break in front of them filed behind the name`,
			code: `
				a {
					.m
					// c
				}
			`,
		},
		{
			description: `an inline comment between a query's params and its opening brace, a line of the params rather than of the block, as it is where the parser files it in front of the brace`,
			code: `
				@media (min-width: 1px)
					// c
				{
					a { color: pink; }
				}
			`,
		},
	],

	reject: [
		{
			description: `an inline comment on its own line behind a mixin call carrying no semicolon, indented a level past the block it is a line of`,
			code: `
				a {
					.m()
						// c
				}
			`,
			fixed: `
				a {
					.m()
					// c
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`1 tab`),
		},
		{
			description: `two such comments, each a line of the block`,
			code: `
				a {
					.m()
						// c
						// d
				}
			`,
			fixed: `
				a {
					.m()
					// c
					// d
				}
			`,
			warnings: [
				{
					line: 3,
					column: 3,
					message: messages.expected(`1 tab`),
				},
				{
					line: 4,
					column: 3,
					message: messages.expected(`1 tab`),
				},
			],
		},
		{
			description: `the same comment written with a Windows line break`,
			code: `a {\r\n\t.m()\r\n\t\t// c\r\n}\r\n`,
			fixed: `a {\r\n\t.m()\r\n\t// c\r\n}\r\n`,
			line: 3,
			column: 3,
			message: messages.expected(`1 tab`),
		},
		{
			description: `such a comment behind a call whose params span lines, the comment's line the block's and the params' line the call's, so that both fixes land in the params`,
			code: `
				a {
					.m(
					1
					)
						// c
				}
			`,
			fixed: `
				a {
					.m(
						1
					)
					// c
				}
			`,
			warnings: [
				{
					line: 5,
					column: 3,
					message: messages.expected(`1 tab`),
				},
				{
					line: 3,
					column: 2,
					message: messages.expected(`2 tabs`),
				},
			],
		},
		{
			description: `such a comment behind a call written without parentheses, the fix written into the break the parser filed behind the name`,
			code: `
				a {
					.m
						// c
				}
			`,
			fixed: `
				a {
					.m
					// c
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`1 tab`),
		},
		{
			description: `such a comment behind a detached ruleset call, a line of the block as behind a mixin call`,
			code: `
				a {
					@r()
						// c
				}
			`,
			fixed: `
				a {
					@r()
					// c
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`1 tab`),
		},
	],
})

testRule({
	ruleName,
	config: [`tab`, { ignore: [`param`] }],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `an inline comment on its own line behind a mixin call carrying no semicolon, indented a level past the block it is a line of, which the option, being about params, has no say over`,
			code: `
				a {
					.m()
						// c
				}
			`,
			fixed: `
				a {
					.m()
					// c
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`1 tab`),
		},
	],
})

testRule({
	ruleName,
	config: [`tab`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `a mixin definition whose guard stands on a line of its own, a level deeper, as a line continuing an at-rule's parameters does`,
			code: `
				.m(@a; @b)
					when (@a > 0) { c: d; }
			`,
		},
		{
			description: `a mixin definition whose parameter list, opened in the middle of the first line, goes on at the rule's own level, as a mixin call's arguments do`,
			code: `
				.m(@a: 1px;
				@b: 2px) { c: d; }
			`,
		},
	],

	reject: [
		{
			description: `a mixin definition whose guard stands on a line of its own at the rule's level`,
			code: `
				.m(@a; @b)
				when (@a > 0) { c: d; }
			`,
			fixed: `
				.m(@a; @b)
					when (@a > 0) { c: d; }
			`,
			line: 2,
			column: 1,
			message: messages.expected(`1 tab`),
		},
		{
			description: `the parameter list of the issue, a line inside it indented a level deeper than the parentheses opened in the middle of the first line ask`,
			code: `
				.m(@a: 1px;
					@b: 2px) { c: d; }
			`,
			fixed: `
				.m(@a: 1px;
				@b: 2px) { c: d; }
			`,
			line: 2,
			column: 2,
			message: messages.expected(`0 tabs`),
		},
	],
})

testRule({
	ruleName,
	config: [`tab`, { except: [`param`] }],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `a mixin definition whose guard stands on a line of its own at the rule's level, as an at-rule's parameters do under this option`,
			code: `
				.m(@a; @b)
				when (@a > 0) { c: d; }
			`,
		},
	],
})

testRule({
	ruleName,
	config: [`tab`, { ignore: [`param`] }],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `a mixin definition whose head goes on over lines at any level, as an at-rule's parameters do under this option`,
			code: `
				.m(@a;
						@b)
				when (@a > 0) { c: d; }
			`,
		},
	],
})
