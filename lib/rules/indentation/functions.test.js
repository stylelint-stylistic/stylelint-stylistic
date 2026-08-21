import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [2],

	accept: [
		{
			description: `a function whose arguments stand on one line`,
			code: `
				.foo {
				  color: rgb(0, 0, 0);
				}
			`,
		},
		{
			description: `a function whose arguments each stand a level deeper`,
			code: `
				.foo {
				  color: rgb(
				    0,
				    0,
				    0
				  );
				  top: 0;
				}
			`,
		},
		{
			description: `a Sass list whose items each stand a level deeper`,
			code: `
				$some-list: (
				  0,
				  0,
				  0
				);
			`,
		},
		{
			description: `a Sass map nested inside another`,
			code: `$colors: (\n  primary: (\n    base: $route;\n    contrast: $white\n  )\n);`,
		},
		{
			description: `a function nested inside a value broken over lines`,
			code: `
				background:
				  linear-gradient(
				    to bottom,
				    transparentize($gray-dark, 1) 0%,
				    transparentize($gray-dark, 0.1) 100%
				  );
			`,
		},
		{
			description: `the same single-line function written with carriage-return line breaks`,
			code: `.foo {\r\n  color: rgb(0, 0, 0);\r\n}`,
		},
		{
			description: `the same broken function written with carriage-return line breaks`,
			code: `.foo {\r\n  color: rgb(\r\n    0,\r\n    0,\r\n    0\r\n  );\r\n  top: 0;\r\n}`,
		},
		{
			description: `the same list written with carriage-return line breaks`,
			code: `$some-list: (\r\n  0,\r\n  0,\r\n  0\r\n);`,
		},
		{
			description: `the same nested map written with carriage-return line breaks`,
			code: `$colors: (\r\n  primary: (\r\n    base: $route;\r\n    contrast: $white\r\n  )\r\n);`,
		},
		{
			description: `the same nested function written with carriage-return line breaks`,
			code: `background:\r\n  linear-gradient(\r\n    to bottom,\r\n    transparentize($gray-dark, 1) 0%,\r\n    transparentize($gray-dark, 0.1) 100%\r\n  );`,
		},
	],

	reject: [
		{
			description: `the second argument left at the left margin`,
			code: `
				.foo {
				  color: rgb(
				    0,
				0,
				    0
				  );
				  top: 0;
				}
			`,
			fixed: `
				.foo {
				  color: rgb(
				    0,
				    0,
				    0
				  );
				  top: 0;
				}
			`,
			line: 4,
			column: 1,
			message: messages.expected(`4 spaces`),
		},
		{
			description: `the closing parenthesis indented a level too deep`,
			code: `
				.foo {
				  color: rgb(
				    0,
				    0,
				    0
				    );
				  top: 0;
				}
			`,
			fixed: `
				.foo {
				  color: rgb(
				    0,
				    0,
				    0
				  );
				  top: 0;
				}
			`,
			line: 6,
			column: 5,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `an item of a Sass list indented by a single space`,
			code: `
				$some-list: (
				  0,
				  0,
				 0
				);
			`,
			fixed: `
				$some-list: (
				  0,
				  0,
				  0
				);
			`,
			line: 4,
			column: 2,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the closing parenthesis of a Sass list indented a level too deep`,
			code: `
				$some-list: (
				  0,
				  0,
				  0
				  );
			`,
			fixed: `
				$some-list: (
				  0,
				  0,
				  0
				);
			`,
			line: 5,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the same argument at the left margin, written with carriage-return line breaks`,
			code: `.foo {\r\n  color: rgb(\r\n    0,\r\n0,\r\n    0\r\n  );\r\n  top: 0;\r\n}`,
			fixed: `.foo {\r\n  color: rgb(\r\n    0,\r\n    0,\r\n    0\r\n  );\r\n  top: 0;\r\n}`,
			line: 4,
			column: 1,
			message: messages.expected(`4 spaces`),
		},
		{
			description: `the same closing parenthesis, written with carriage-return line breaks`,
			code: `.foo {\r\n  color: rgb(\r\n    0,\r\n    0,\r\n    0\r\n    );\r\n  top: 0;\r\n}`,
			fixed: `.foo {\r\n  color: rgb(\r\n    0,\r\n    0,\r\n    0\r\n  );\r\n  top: 0;\r\n}`,
			line: 6,
			column: 5,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same list item, written with carriage-return line breaks`,
			code: `$some-list: (\r\n  0,\r\n  0,\r\n 0\r\n);`,
			fixed: `$some-list: (\r\n  0,\r\n  0,\r\n  0\r\n);`,
			line: 4,
			column: 2,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same closing parenthesis of a list, written with carriage-return line breaks`,
			code: `$some-list: (\r\n  0,\r\n  0,\r\n  0\r\n  );`,
			fixed: `$some-list: (\r\n  0,\r\n  0,\r\n  0\r\n);`,
			line: 5,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `a function opening at the left margin inside a value broken over lines`,
			code: `
				background:
				linear-gradient(
				    to bottom,
				    transparentize($gray-dark, 1) 0%,
				    transparentize($gray-dark, 0.1) 100%
				  );
			`,
			fixed: `
				background:
				  linear-gradient(
				    to bottom,
				    transparentize($gray-dark, 1) 0%,
				    transparentize($gray-dark, 0.1) 100%
				  );
			`,
			line: 2,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
	],
})

testRule({
	ruleName,
	config: [2, { ignore: [`inside-parens`] }],

	accept: [
		{
			description: `arguments indented one level, which this option leaves alone`,
			code: `
				.foo {
				  color: rgb(
				    0,
				    0,
				    0
				  );
				}
			`,
		},
		{
			description: `the same arguments indented deeper, left alone all the same`,
			code:
				`.foo {\n  color: rgb(\n      0,\n      0,\n      0\n    );\n}`,
		},
		{
			description: `the same arguments at the left margin, left alone for the same reason`,
			code: `
				.foo {
				  color: rgb(
				0,
				0,
				0
				    );
				}
			`,
		},
		{
			description: `a nested function whose arguments are indented one level`,
			code:
				`.foo {\n  color: bar(\n    rgb(\n      0,\n      0,\n      0\n    )\n  );\n}`,
		},
		{
			description: `the same nested function indented deeper`,
			code:
				`.foo {\n  color: bar(\n      rgb(\n        0,\n        0,\n        0\n      )\n    );\n}`,
		},
		{
			description: `a Sass map, which the option leaves alone with everything else inside parentheses`,
			code:
				`$tooltip-default-settings: (\n    tooltip-gutter: 8px 10px,\n  tooltip-border: 1px solid,\n);`,
		},
	],
})

testRule({
	ruleName,
	config: [`tab`, { indentClosingBrace: false }],

	accept: [
		{
			description: `a Sass list of pairs indented with tabs, its closing parenthesis at the root`,
			code: `
				$some-list: (
					var: value,
					var: value,
					var: value
				);
			`,
		},
	],

	reject: [
		{
			description: `the same list with its closing parenthesis indented one level`,
			code: `
				$some-list: (
					var: value,
					var: value,
						var: value
				);
			`,
			fixed: `
				$some-list: (
					var: value,
					var: value,
					var: value
				);
			`,
			line: 4,
			column: 3,
			message: messages.expected(`1 tab`),
		},
	],
})

testRule({
	ruleName,
	config: [2, { indentInsideParens: `twice` }],

	accept: [
		{
			description: `arguments indented twice, as this option asks`,
			code:
				`.foo {\n  color: rgb(\n      0,\n      0,\n      0\n    );\n  top: 0;\n}`,
		},
		{
			description: `a Sass list at the root whose items are indented twice`,
			code: `
				$some-list: (
				    0,
				    0,
				    0
				  );
			`,
		},
		{
			description: `the same arguments written with carriage-return line breaks`,
			code:
				`.foo {\r\n  color: rgb(\r\n      0,\r\n      0,\r\n      0\r\n    );\r\n  top: 0;\r\n}`,
		},
		{
			description: `the same list written with carriage-return line breaks`,
			code: `$some-list: (\r\n    0,\r\n    0,\r\n    0\r\n  );`,
		},
	],

	reject: [
		{
			description: `the second argument indented once rather than twice`,
			code:
				`.foo {\n  color: rgb(\n      0,\n    0,\n      0\n    );\n  top: 0;\n}`,
			fixed:
				`.foo {\n  color: rgb(\n      0,\n      0,\n      0\n    );\n  top: 0;\n}`,
			line: 4,
			column: 5,
			message: messages.expected(`6 spaces`),
		},
		{
			description: `the closing parenthesis indented one space short`,
			code:
				`.foo {\n  color: rgb(\n      0,\n      0,\n      0\n     );\n  top: 0;\n}`,
			fixed:
				`.foo {\n  color: rgb(\n      0,\n      0,\n      0\n    );\n  top: 0;\n}`,
			line: 6,
			column: 6,
			message: messages.expected(`4 spaces`),
		},
		{
			description: `an item of a Sass list indented one space short`,
			code: `
				$some-list: (
				    0,
				    0,
				   0
				  );
			`,
			fixed: `
				$some-list: (
				    0,
				    0,
				    0
				  );
			`,
			line: 4,
			column: 4,
			message: messages.expected(`4 spaces`),
		},
		{
			description: `the closing parenthesis of a Sass list indented one space short`,
			code: `
				$some-list: (
				    0,
				    0,
				    0
				 );
			`,
			fixed: `
				$some-list: (
				    0,
				    0,
				    0
				  );
			`,
			line: 5,
			column: 2,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same short item written with carriage-return line breaks`,
			code: `$some-list: (\r\n    0,\r\n    0,\r\n   0\r\n  );`,
			fixed: `$some-list: (\r\n    0,\r\n    0,\r\n    0\r\n  );`,
			line: 4,
			column: 4,
			message: messages.expected(`4 spaces`),
		},
		{
			description: `the same closing parenthesis written with carriage-return line breaks`,
			code: `$some-list: (\r\n    0,\r\n    0,\r\n    0\r\n );`,
			fixed: `$some-list: (\r\n    0,\r\n    0,\r\n    0\r\n  );`,
			line: 5,
			column: 2,
			message: messages.expected(`2 spaces`),
		},
	],
})

testRule({
	ruleName,
	config: [2, { indentInsideParens: `once-at-root-twice-in-block` }],

	accept: [
		{
			description: `arguments inside a block indented twice, as this option asks`,
			code:
				`.foo {\n  color: rgb(\n      0,\n      0,\n      0\n    );\n  top: 0;\n}`,
		},
		{
			description: `a Sass list at the root, whose items are indented once`,
			code: `
				$some-list: (
				  0,
				  0,
				  0
				);
			`,
		},
		{
			description: `the same arguments written with carriage-return line breaks`,
			code:
				`.foo {\r\n  color: rgb(\r\n      0,\r\n      0,\r\n      0\r\n    );\r\n  top: 0;\r\n}`,
		},
		{
			description: `the same list written with carriage-return line breaks`,
			code: `$some-list: (\r\n  0,\r\n  0,\r\n  0\r\n);`,
		},
	],

	reject: [
		{
			description: `the second argument inside a block indented once rather than twice`,
			code:
				`.foo {\n  color: rgb(\n      0,\n    0,\n      0\n    );\n  top: 0;\n}`,
			fixed:
				`.foo {\n  color: rgb(\n      0,\n      0,\n      0\n    );\n  top: 0;\n}`,
			line: 4,
			column: 5,
			message: messages.expected(`6 spaces`),
		},
		{
			description: `the closing parenthesis inside a block indented one space short`,
			code:
				`.foo {\n  color: rgb(\n      0,\n      0,\n      0\n     );\n  top: 0;\n}`,
			fixed:
				`.foo {\n  color: rgb(\n      0,\n      0,\n      0\n    );\n  top: 0;\n}`,
			line: 6,
			column: 6,
			message: messages.expected(`4 spaces`),
		},
		{
			description: `the closing parenthesis of a Sass list at the root indented one level`,
			code: `
				$some-list: (
				  0,
				  0,
				  0
				  );
			`,
			fixed: `
				$some-list: (
				  0,
				  0,
				  0
				);
			`,
			line: 5,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the same wrongly indented argument written with carriage-return line breaks`,
			code:
				`.foo {\r\n  color: rgb(\r\n      0,\r\n    0,\r\n      0\r\n    );\r\n  top: 0;\r\n}`,
			fixed:
				`.foo {\r\n  color: rgb(\r\n      0,\r\n      0,\r\n      0\r\n    );\r\n  top: 0;\r\n}`,
			line: 4,
			column: 5,
			message: messages.expected(`6 spaces`),
		},
		{
			description: `the same closing parenthesis written with carriage-return line breaks`,
			code:
				`.foo {\r\n  color: rgb(\r\n      0,\r\n      0,\r\n      0\r\n     );\r\n  top: 0;\r\n}`,
			fixed:
				`.foo {\r\n  color: rgb(\r\n      0,\r\n      0,\r\n      0\r\n    );\r\n  top: 0;\r\n}`,
			line: 6,
			column: 6,
			message: messages.expected(`4 spaces`),
		},
		{
			description: `the same closing parenthesis of a list written with carriage-return line breaks`,
			code: `$some-list: (\r\n  0,\r\n  0,\r\n  0\r\n  );`,
			fixed: `$some-list: (\r\n  0,\r\n  0,\r\n  0\r\n);`,
			line: 5,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
	],
})

testRule({
	ruleName,
	config: [
		2,
		{
			indentInsideParens: `once-at-root-twice-in-block`,
			indentClosingBrace: true,
		},
	],

	accept: [
		{
			description: `arguments indented twice inside a block, the closing parenthesis and brace indented with them`,
			code:
				`.foo {\n  color: rgb(\n      0,\n      0,\n      0\n      );\n  top: 0;\n  }`,
		},
		{
			description: `a Sass list at the root whose closing parenthesis is indented one level`,
			code: `
				$some-list: (
				  0,
				  0,
				  0
				  );
			`,
		},
		{
			description: `the same list of two items written with carriage-return line breaks`,
			code: `$some-list: (\r\n  0,\r\n  0\r\n  );`,
		},
	],

	reject: [
		{
			description: `the second argument inside a block indented once rather than twice`,
			code:
				`.foo {\n  color: rgb(\n      0,\n    0,\n      0\n      );\n  top: 0;\n  }`,
			fixed:
				`.foo {\n  color: rgb(\n      0,\n      0,\n      0\n      );\n  top: 0;\n  }`,
			line: 4,
			column: 5,
			message: messages.expected(`6 spaces`),
		},
		{
			description: `the closing parenthesis inside a block indented one space short`,
			code:
				`.foo {\n  color: rgb(\n      0,\n      0,\n      0\n     );\n  top: 0;\n  }`,
			fixed:
				`.foo {\n  color: rgb(\n      0,\n      0,\n      0\n      );\n  top: 0;\n  }`,
			line: 6,
			column: 6,
			message: messages.expected(`6 spaces`),
		},
		{
			description: `an item of a Sass list indented one space short`,
			code: `
				$some-list: (
				  0,
				  0,
				 0
				  );
			`,
			fixed: `
				$some-list: (
				  0,
				  0,
				  0
				  );
			`,
			line: 4,
			column: 2,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the closing parenthesis of a Sass list left at the root`,
			code: `
				$some-list: (
				  0,
				  0,
				  0
				);
			`,
			fixed: `
				$some-list: (
				  0,
				  0,
				  0
				  );
			`,
			line: 5,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same wrongly indented argument written with carriage-return line breaks`,
			code:
				`.foo {\r\n  color: rgb(\r\n      0,\r\n    0,\r\n      0\r\n      );\r\n  top: 0;\r\n  }`,
			fixed:
				`.foo {\r\n  color: rgb(\r\n      0,\r\n      0,\r\n      0\r\n      );\r\n  top: 0;\r\n  }`,
			line: 4,
			column: 5,
			message: messages.expected(`6 spaces`),
		},
		{
			description: `the same closing parenthesis written with carriage-return line breaks`,
			code:
				`.foo {\r\n  color: rgb(\r\n      0,\r\n      0,\r\n      0\r\n     );\r\n  top: 0;\r\n  }`,
			fixed:
				`.foo {\r\n  color: rgb(\r\n      0,\r\n      0,\r\n      0\r\n      );\r\n  top: 0;\r\n  }`,
			line: 6,
			column: 6,
			message: messages.expected(`6 spaces`),
		},
		{
			description: `the same short list item written with carriage-return line breaks`,
			code: `$some-list: (\r\n  0,\r\n  0,\r\n 0\r\n  );`,
			fixed: `$some-list: (\r\n  0,\r\n  0,\r\n  0\r\n  );`,
			line: 4,
			column: 2,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same closing parenthesis at the root written with carriage-return line breaks`,
			code: `$some-list: (\r\n  0,\r\n  0,\r\n  0\r\n);`,
			fixed: `$some-list: (\r\n  0,\r\n  0,\r\n  0\r\n  );`,
			line: 5,
			column: 1,
			message: messages.expected(`2 spaces`),
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
