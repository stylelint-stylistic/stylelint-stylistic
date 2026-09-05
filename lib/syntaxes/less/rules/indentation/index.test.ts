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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/237
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/375
			description: `a comment standing behind an at-rule with neither a block nor a semicolon, which the parser files into that at-rule's whitespace rather than into a node of its own`,
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
			column: 2,
			message: messages.expected(`2 tabs`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/452
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/509
			description: `the closing brace of a block whose last statement is a mixin call carrying no semicolon, standing at the level the block does`,
			code: `
				a {
					.m()
				}
			`,
		},
		{
			description: `the same call carrying a bang flag, whose whitespace the parser collects from both sides of that flag and the stringifier writes on one, so the run in front of the brace is the block's raw no more than the call's`,
			code: `
				a {
					.m() !important
						}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/509
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
	],
})
