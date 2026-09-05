import { createRule } from "../../../../rules/indentation/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`tab`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/237
			description: `the same query read as Sass, which asks the same of it as plain CSS does`,
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
	],
})
testRule({
	ruleName,
	config: [2],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
			description: `a value whose line behind an inline comment already stands at its level`,
			code: `
				a {
				  b: 1px // c
				    2px;
				}
			`,
		},
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
			description: `a block comment behind the brace that opens an interpolation, which the brace must not be read past`,
			code: `
				@a {
				  b: map(
				    c: #{ /* x */
				    d}
				  );
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
			description: `a block comment in front of the brace that closes an interpolation, which the brace must not be read past`,
			code: `
				@a {
				  b: map(
				    c: #{
				      d
				      /* x */}
				    );
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
			description: `a line holding nothing but an inline comment inside a value`,
			code: `
				a {
				  b: 1px
				  // c
				    2px;
				}
			`,
			fixed: `
				a {
				  b: 1px
				    // c
				    2px;
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`4 spaces`),
		},
	],
})
testRule({
	ruleName,
	config: [`tab`],
	customSyntax: `postcss-scss`,

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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/375
			description: `an inline comment standing behind an at-rule with neither a block nor a semicolon, which the parser files into that at-rule's whitespace rather than into a node of its own`,
			code: `
				a {
					@extend .b
					// c
				}
			`,
			fixed: `
				a {
					@extend .b
						// c
				}
			`,
			line: 3,
			column: 2,
			message: messages.expected(`2 tabs`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/452
			description: `a declaration whose indentation opens with a bare carriage return, whitespace to the parser and part of the run the fix writes over`,
			code: `a {\n\r\t\tcolor: pink;\n}`,
			fixed: `a {\n\tcolor: pink;\n}`,
			line: 2,
			column: 4,
			message: messages.expected(`1 tab`),
		},
	],
})

// Config: [2], customSyntax: postcss-scss
testRule({
	ruleName,
	config: [2],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/74
			description: `an interpolation standing first in a selector list`,
			code: `
				#{$foo},
				:where(
				  .bar
				) {
				  margin-top: 0;
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/74
			description: `a multi-line pseudo-class standing behind another selector inside a nesting block`,
			code: `
				.parent {
				  .foo,
				  :where(
				    .bar,
				    .baz
				  ) {
				    margin-top: 0;
				  }
				}
			`,
		},
	],
})
testRule({
	ruleName,
	config: [`tab`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/64
			description: `every line of a "with" block is indented`,
			code: `
				@use './button' with (
				  $button-color: red,
				  $button-bg: yellow,
				  $button-border-width: 1px,
				);

				.something_else {
				  color: red;
				}
			`,
			fixed: `
				@use './button' with (
					$button-color: red,
					$button-bg: yellow,
					$button-border-width: 1px,
				);

				.something_else {
					color: red;
				}
			`,
			warnings: [
				{ line: 2, column: 3, message: messages.expected(`1 tab`) },
				{ line: 3, column: 3, message: messages.expected(`1 tab`) },
				{ line: 4, column: 3, message: messages.expected(`1 tab`) },
				{ line: 8, column: 3, message: messages.expected(`1 tab`) },
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/65
			description: `comments within a "with" block are kept`,
			code: `
				@use './button' with ( /* Some comment */
				  /* Another comment */
				  $button-color: blue /* Yet another */
				);
			`,
			fixed: `
				@use './button' with ( /* Some comment */
					/* Another comment */
					$button-color: blue /* Yet another */
				);
			`,
			warnings: [
				{ line: 2, column: 3, message: messages.expected(`1 tab`) },
				{ line: 3, column: 3, message: messages.expected(`1 tab`) },
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/62
			description: `comments within a map literal are kept`,
			code: `
				$somevar: ( /* some comment */
				  /* another comment here */
				  'a_property': 0 /* Don't forget this one! */
				)
			`,
			fixed: `
				$somevar: ( /* some comment */
					/* another comment here */
					'a_property': 0 /* Don't forget this one! */
				)
			`,
			warnings: [
				{ line: 2, column: 3, message: messages.expected(`1 tab`) },
				{ line: 3, column: 3, message: messages.expected(`1 tab`) },
			],
		},
	],
})
testRule({
	ruleName,
	config: [2],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/194
			description: `a selector carrying an inline comment, every line at its level`,
			code: `a {
  b // c
  .d {
    e: f;
  }
}`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/194
			description: `a mis-indented line behind the inline comment of a selector, raised with the comment left standing`,
			code: `a {
  b // c
.d {
    e: f;
  }
}`,
			fixed: `a {
  b // c
  .d {
    e: f;
  }
}`,
			line: 3,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same with a block comment, whose selector the fix used to strip too`,
			code: `a {
  b /* c */
.d {
    e: f;
  }
}`,
			fixed: `a {
  b /* c */
  .d {
    e: f;
  }
}`,
			line: 3,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
	],
})
testRule({
	ruleName,
	config: [`tab`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/237
			description: `the closing parenthesis of an at-root in the first column, the params of that at-rule standing at its own level rather than one above it`,
			code: `
				@at-root (without: media
				) {
					a { color: pink; }
				}
			`,
		},
		{
			description: `the same at-root with its parenthesis opened at the end of a line, which indents the line inside it`,
			code: `
				@at-root (
					without: media
				) {
					a { color: pink; }
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/237
			description: `an interpolation opened at the end of a line, whose brace does indent the line inside it`,
			code: `
				a {
					b: map($c: #{
						$d
					});
				}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/237
			description: `that closing parenthesis indented by a tab`,
			code: `
				@at-root (without: media
					) {
					a { color: pink; }
				}
			`,
			fixed: `
				@at-root (without: media
				) {
					a { color: pink; }
				}
			`,
			line: 2,
			column: 2,
			message: messages.expected(`0 tabs`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/237
			description: `the brace closing an interpolation the params opened in the middle of a line, indented by a tab`,
			code: `
				@media (min-width: #{$a
					}) { c { color: pink; } }
			`,
			fixed: `
				@media (min-width: #{$a
				}) { c { color: pink; } }
			`,
			line: 2,
			column: 2,
			message: messages.expected(`0 tabs`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/237
			description: `the same brace in a value, whose outermost level is the level of the declaration`,
			code: `
				a {
					b: map($c: #{$d
							});
				}
			`,
			fixed: `
				a {
					b: map($c: #{$d
					});
				}
			`,
			line: 3,
			column: 4,
			message: messages.expected(`1 tab`),
		},
	],
})

testRule({
	ruleName,
	config: [`tab`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/509
			description: `the closing brace of a block whose last statement is an include carrying neither a block nor a semicolon, standing at the level the block does`,
			code: `
				a {
					@include m
				}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/509
			description: `that closing brace indented a level in, the run in front of it standing in the include's whitespace rather than in the block's own`,
			code: `
				a {
					@include m
						}
			`,
			fixed: `
				a {
					@include m
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `the same block whose include swallowed an inline comment as well, which Sass reads to the end of its line`,
			code: `
				a {
					@include m
					// c
						}
			`,
			fixed: `
				a {
					@include m
						// c
				}
			`,
			warnings: [
				{ line: 4, column: 3, message: messages.expected(`0 tabs`) },
				{ line: 3, column: 2, message: messages.expected(`2 tabs`) },
			],
		},
	],
})
