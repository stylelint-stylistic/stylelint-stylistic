import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName })

// Config: [2]
testRule({
	ruleName,
	config: [2],

	accept: [
		{
			description: `a pseudo-class whose argument stands on a line of its own`,
			code: `
				a:has(
				  .foo
				) {}
			`,
		},
		{
			description: `a single-line pseudo-class standing in front of a multi-line one`,
			code: `
				.foo:is(a):has(
				  .foo
				) {}
			`,
		},
		{
			description: `three multi-line pseudo-classes nested one inside another`,
			code: `
				a:where(
				  :not(
				    .bar:has(
				      .foo, .baz,
				      .bar
				    ),
				    .baz:has(.foo)
				  )
				) {}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/74
			description: `a multi-line pseudo-class standing second in a selector list`,
			code: `
				.foo,
				:where(
				  .bar,
				  .baz
				) {
				  margin-top: 0;
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/74
			description: `the same pseudo-class standing first`,
			code: `
				:where(
				  .bar,
				  .baz
				),
				.foo {
				  margin-top: 0;
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/74
			description: `the same standing last`,
			code: `
				.foo,
				.baz,
				:where(
				  .bar
				) {
				  margin-top: 0;
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/74
			description: `nested parentheses inside a pseudo-class of a selector list`,
			code: `
				.foo,
				:not(:where(
				  .bar
				)) {
				  margin-top: 0;
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/74
			description: `a multi-line pseudo-class standing in the middle of a list`,
			code: `
				.foo,
				:where(
				  .bar
				),
				.baz {
				  margin-top: 0;
				}
			`,
		},
	],

	reject: [
		{
			description: `several lines of nested pseudo-classes indented wrongly`,
			code: `
				.foo:where(
						:not(
								  .bar,
								.baz
						)
				) {
						color: red
				}
			`,
			fixed: `
				.foo:where(
				  :not(
				    .bar,
				    .baz
				  )
				) {
				  color: red
				}
			`,
			warnings: [
				{ line: 2, column: 3, message: messages.expected(`2 spaces`) },
				{ line: 3, column: 7, message: messages.expected(`4 spaces`) },
				{ line: 4, column: 5, message: messages.expected(`4 spaces`) },
				{ line: 5, column: 3, message: messages.expected(`2 spaces`) },
				{ line: 7, column: 3, message: messages.expected(`2 spaces`) },
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/74
			description: `a mis-indented multi-line pseudo-class in a selector list`,
			code: `
				.foo,
				:where(
				.bar,
				    .baz
				) {
				  margin-top: 0;
				}
			`,
			fixed: `
				.foo,
				:where(
				  .bar,
				  .baz
				) {
				  margin-top: 0;
				}
			`,
			warnings: [
				{ line: 3, column: 1, message: messages.expected(`2 spaces`) },
				{ line: 4, column: 5, message: messages.expected(`2 spaces`) },
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/74
			description: `a line inside parentheses another rule opened, level with that rule`,
			code: `
				.parent {
				  a:has(.foo,
				.bar) {
				    color: red;
				  }
				}
			`,
			fixed: `
				.parent {
				  a:has(.foo,
				  .bar) {
				    color: red;
				  }
				}
			`,
			line: 3,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
	],
})

// Config: ['tab']
testRule({
	ruleName,
	config: [`tab`],

	accept: [
		{
			description: `a pseudo-class whose argument stands on a line of its own`,
			code: `
				a:has(
					.foo
				) {}
			`,
		},
		{
			description: `three multi-line pseudo-classes nested one inside another`,
			code: `
				a:where(
					:not(
						.bar:has(
							.foo, .baz,
							.bar
						),
						.baz:has(.foo)
					)
				) {}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/74
			description: `a multi-line pseudo-class standing second in a selector list`,
			code: `
				.foo,
				:where(
					.bar,
					.baz
				) {
					margin-top: 0;
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/237
			description: `a closing parenthesis standing alone in the first column, the pseudo-class it closes having been opened in the middle of the line above`,
			code: `
				a:not(.foo
				) {}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/237
			description: `that closing parenthesis indented by a tab, which asks for the level of the selector and not for one below it`,
			code: `
				a:not(.foo
					) {}
			`,
			fixed: `
				a:not(.foo
				) {}
			`,
			line: 2,
			column: 2,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `several lines of nested pseudo-classes indented wrongly`,
			code: `
				.foo:where(
						:not(
								  .bar,
								.baz
						)
				) {
						color: red
				}
			`,
			fixed: `
				.foo:where(
					:not(
						.bar,
						.baz
					)
				) {
					color: red
				}
			`,
			warnings: [
				{ line: 2, column: 3, message: messages.expected(`1 tab`) },
				{ line: 3, column: 7, message: messages.expected(`2 tabs`) },
				{ line: 4, column: 5, message: messages.expected(`2 tabs`) },
				{ line: 5, column: 3, message: messages.expected(`1 tab`) },
				{ line: 7, column: 3, message: messages.expected(`1 tab`) },
			],
		},
	],
})

// Config: ['tab', { indentInsideParens: 'twice' }]
testRule({
	ruleName,
	config: [`tab`, { indentInsideParens: `twice` }],

	accept: [
		{
			description: `a pseudo-class whose argument is indented twice, as the option asks`,
			code: `
				a:has(
						.foo
					) {}
			`,
		},
		{
			description: `three nested pseudo-classes, each argument indented twice`,
			code: `
				a:where(
						:not(
							.bar:has(
								.foo, .baz,
								.bar
							),
							.baz:has(.foo)
						)
					) {}
			`,
		},
	],

	reject: [
		{
			description: `several lines of nested pseudo-classes indented wrongly under that option`,
			code: `
				.foo:where(
						:not(
								  .bar,
								.baz
						)
				) {
						color: red
				}
			`,
			fixed: `
				.foo:where(
						:not(
							.bar,
							.baz
						)
					) {
					color: red
				}
			`,
			warnings: [
				{ line: 3, column: 7, message: messages.expected(`3 tabs`) },
				{ line: 4, column: 5, message: messages.expected(`3 tabs`) },
				{ line: 6, column: 1, message: messages.expected(`1 tab`) },
				{ line: 7, column: 3, message: messages.expected(`1 tab`) },
			],
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
