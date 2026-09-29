# Custom syntaxes

The rules under `@stylistic/<rule>` read plain CSS. A stylesheet written in SCSS (`postcss-scss`) is read by the same rules under the `@stylistic/scss/` namespace, one written in Less (`postcss-less`) under `@stylistic/less/`, and one embedded in JavaScript as a styled template (`postcss-styled-syntax`) under `@stylistic/styled/`; on any such file a core name whose namespace copy is not configured over it reports one warning pointing at the right namespace, and one whose copy is configured says nothing, since that copy reads the file. Configure a namespace in the `overrides` block that names the syntax:

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

What each namespace answers differently is written on its own page: [`scss`](../../lib/syntaxes/scss/README.md), [`less`](../../lib/syntaxes/less/README.md), [`styled`](../../lib/syntaxes/styled/README.md). A rule configured under two of these names is still read once per stylesheet: by the copy of the stylesheet's own family — the core's over plain CSS, the namespace's over its syntax, each block of an HTML page by its own — or, where that copy is not configured, by the first listed copy whose namespace accepts the stylesheet. A namespace accepts plain CSS too. The other copies yield without a word and check nothing there, their options included, the core's copy over a file its syntax refuses among them: the warning naming the namespace comes only from a rule no configured copy reads there.
