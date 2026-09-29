# Custom syntaxes

The rules under `@stylistic/<rule>` read plain CSS. A stylesheet written in SCSS (`postcss-scss`) is read by the same rules under the `@stylistic/scss/` namespace, one written in Less (`postcss-less`) under `@stylistic/less/`, and one embedded in JavaScript as a styled template (`postcss-styled-syntax`) under `@stylistic/styled/`; on any such file the core names report one warning pointing at the right namespace. Configure a namespace in the `overrides` block that names the syntax:

```js
export default {
	plugins: ["@stylistic/stylelint-plugin"],
	overrides: [
		{
			files: ["**/*.scss"],
			customSyntax: "postcss-scss",
			rules: {
				"@stylistic/scss/color-hex-case": "lower",
			},
		},
		{
			files: ["**/*.less"],
			customSyntax: "postcss-less",
			rules: {
				"@stylistic/less/color-hex-case": "lower",
			},
		},
		{
			files: ["**/*.{js,jsx,ts,tsx}"],
			customSyntax: "postcss-styled-syntax",
			rules: {
				"@stylistic/styled/indentation": ["tab"],
			},
		},
	],
}
```

What each namespace answers differently is written on its own page: [`scss`](../../lib/syntaxes/scss/README.md), [`less`](../../lib/syntaxes/less/README.md), [`styled`](../../lib/syntaxes/styled/README.md). Configure one family of names per file: a namespace reads plain CSS too, so listing the core and a namespace over the same files would run every rule twice.
