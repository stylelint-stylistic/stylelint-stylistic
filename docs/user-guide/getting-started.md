# Getting started

Add `@stylistic/stylelint-plugin` and `stylelint` itself to your project:

::: code-group

```shell [pnpm]
pnpm add -D stylelint @stylistic/stylelint-plugin
```

```shell [npm]
npm add -D stylelint @stylistic/stylelint-plugin
```

```shell [bun]
bun add -D stylelint @stylistic/stylelint-plugin
```

```shell [deno]
deno add -D stylelint @stylistic/stylelint-plugin
```

```shell [yarn]
yarn add -D stylelint @stylistic/stylelint-plugin
```

:::

The quickest way in is the recommended preset, which sets every rule of the plugin that has an answer the same for every project. Create `stylelint.config.mjs` (or open your existing configuration) and extend it by the package's `recommended` subpath, beside whatever else you extend:

```js
export default {
	extends: ["@stylistic/stylelint-plugin/recommended"],
}
```

A setting of your own in `rules` wins over the preset's. What the preset sets, how it reads SCSS and Less, and which rules it leaves to you is in [Configs](./configs.md).

To choose every setting yourself instead, add `@stylistic/stylelint-plugin` to the plugins array and the rules you need to the rules list. [All rules from `@stylistic/stylelint-plugin`](./rules.md) need to be namespaced with `@stylistic/`. That prefix is the whole difference — an unprefixed name in the rules list is a rule of Stylelint's own, a prefixed one is a rule of this plugin:

```js
export default {
	plugins: ["@stylistic/stylelint-plugin"],
	rules: {
		"color-function-notation": "modern",
		"selector-max-compound-selectors": 2,

		"@stylistic/color-hex-case": "lower",
		"@stylistic/number-leading-zero": "always",
		"@stylistic/unit-case": "lower",
	},
}
```

The rules above read plain CSS. A stylesheet written in SCSS or Less, or embedded in JavaScript as a styled template, is read by the same rules under a namespace of its own — see [Custom syntaxes](./custom-syntaxes.md).

## Run

::: code-group

```shell [pnpm]
pnpx stylelint "**/*.css"
```

```shell [npm]
npx stylelint "**/*.css"
```

```shell [bun]
bun stylelint "**/*.css"
```

```shell [deno]
deno run --allow-read npm:stylelint "**/*.css"
```

```shell [yarn]
yarn stylelint "**/*.css"
```

:::

Stylelint reports what the rules find, and `--fix` rewrites the files to match them:

::: code-group

```shell [pnpm]
pnpx stylelint "**/*.css" --fix
```

```shell [npm]
npx stylelint "**/*.css" --fix
```

```shell [bun]
bun stylelint "**/*.css" --fix
```

```shell [deno]
deno run --allow-read --allow-write npm:stylelint "**/*.css" --fix
```

```shell [yarn]
yarn stylelint "**/*.css" --fix
```

:::

Everything else the command takes is in [Stylelint's CLI reference](https://stylelint.io/user-guide/cli).
