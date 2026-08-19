import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName, autoStripIndent: true })

// Config: [2]
testRule({
	ruleName,
	config: [2],

	accept: [
		{
			description: `Simple multiline pseudo`,
			code: `
				a:has(
				  .foo
				) {}
			`,
		},
		{
			description: `Mixed single-line and multiline pseudo`,
			code: `
				.foo:is(a):has(
				  .foo
				) {}
			`,
		},
		{
			description: `Multiple multiline pseudos`,
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
			description: `Multiline pseudo as the second selector of a selector list`,
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
			description: `Multiline pseudo as the first selector of a selector list`,
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
			description: `Multiline pseudo as the last selector of a selector list`,
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
			description: `Nested parentheses inside the pseudo of a selector list`,
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
			description: `Multiline pseudo in the middle of a selector list`,
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
			description: `Multiple indentation issues`,
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
			description: `Mis-indented multiline pseudo in a selector list is still reported`,
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
			description: `A line inside parentheses that other code opened is level with its rule`,
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
			message: messages.expected(`2 spaces`),
			line: 3,
			column: 1,
		},
	],
})

// Config: ['tab']
testRule({
	ruleName,
	config: [`tab`],

	accept: [
		{
			description: `Simple multiline pseudo`,
			code: `
				a:has(
					.foo
				) {}
			`,
		},
		{
			description: `Multiple multiline pseudos`,
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
			description: `Multiline pseudo as the second selector of a selector list`,
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
	],

	reject: [
		{
			description: `Multiple indentation issues`,
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

// Config: ['tab', { indentInsideParens: 'twice }]
testRule({
	ruleName,
	config: [`tab`, { indentInsideParens: `twice` }],

	accept: [
		{
			description: `Simple multiline pseudo`,
			code: `
				a:has(
						.foo
					) {}
			`,
		},
		{
			description: `Multiple multiline pseudos`,
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
			description: `Multiple indentation issues`,
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
			description: `Interpolation as the first selector of a selector list`,
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
			description: `Multiline pseudo after another selector inside a nesting block`,
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
