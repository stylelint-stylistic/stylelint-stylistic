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
