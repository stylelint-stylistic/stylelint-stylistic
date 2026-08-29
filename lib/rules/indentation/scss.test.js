import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

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
