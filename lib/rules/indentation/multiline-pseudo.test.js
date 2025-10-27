import { testRule } from "stylelint-test-rule-node"

import plugins from "../../index.js"
import { messages, ruleName } from "./index.js"
import { stripIndent } from "common-tags"

// Config: [2]
testRule({
	plugins,
	ruleName,
	config: [2],
	fix: true,

	accept: [
		{
			description: `Simple multiline pseudo`,
			code: stripIndent(`
				a:has(
				  .foo
				) {}
			`),
		},
		{
			description: `Mixed single-line and multiline pseudo`,
			code: stripIndent(`
				.foo:is(a):has(
				  .foo
				) {}
			`),
		},
		{
			description: `Multiple multiline pseudos`,
			code: stripIndent(`
				a:where(
				  :not(
				    .bar:has(
				      .foo, .baz,
				      .bar
				    ),
				    .baz:has(.foo)
				  )
				) {}
			`),
		},
	],

	reject: [
		{
			description: `Multiple indentation issues`,
			code: stripIndent(`
				.foo:where(
						:not(
								  .bar,
								.baz
						)
				) {
						color: red
				}
			`),
			fixed: stripIndent(`
				.foo:where(
				  :not(
				    .bar,
				    .baz
				  )
				) {
				  color: red
				}
			`),
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
	plugins,
	ruleName,
	config: [`tab`],
	fix: true,

	accept: [
		{
			description: `Simple multiline pseudo`,
			code: stripIndent(`
				a:has(
					.foo
				) {}
			`),
		},
		{
			description: `Multiple multiline pseudos`,
			code: stripIndent(`
				a:where(
					:not(
						.bar:has(
							.foo, .baz,
							.bar
						),
						.baz:has(.foo)
					)
				) {}
			`),
		},
	],

	reject: [
		{
			description: `Multiple indentation issues`,
			code: stripIndent(`
				.foo:where(
						:not(
								  .bar,
								.baz
						)
				) {
						color: red
				}
			`),
			fixed: stripIndent(`
				.foo:where(
					:not(
						.bar,
						.baz
					)
				) {
					color: red
				}
			`),
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
	plugins,
	ruleName,
	config: [`tab`, { indentInsideParens: `twice` }],
	fix: true,

	accept: [
		{
			description: `Simple multiline pseudo`,
			code: stripIndent(`
				a:has(
						.foo
					) {}
			`),
		},
		{
			description: `Multiple multiline pseudos`,
			code: stripIndent(`
				a:where(
						:not(
							.bar:has(
								.foo, .baz,
								.bar
							),
							.baz:has(.foo)
						)
					) {}
			`),
		},
	],

	reject: [
		{
			description: `Multiple indentation issues`,
			code: stripIndent(`
				.foo:where(
						:not(
								  .bar,
								.baz
						)
				) {
						color: red
				}
			`),
			fixed: stripIndent(`
				.foo:where(
						:not(
							.bar,
							.baz
						)
					) {
					color: red
				}
			`),
			warnings: [
				{ line: 3, column: 7, message: messages.expected(`3 tabs`) },
				{ line: 4, column: 5, message: messages.expected(`3 tabs`) },
				{ line: 6, column: 1, message: messages.expected(`1 tab`) },
				{ line: 7, column: 3, message: messages.expected(`1 tab`) },
			],
		},
	],
})
