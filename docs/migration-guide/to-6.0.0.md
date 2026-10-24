# Migrating to 6.0.0

This guide is intended to help you migrate to version 6.0.0 of `@styistic/stylelint-plugin`. It covers only the required steps and a few useful tips. It does not cover every change; see the [changelog](../../CHANGELOG.md) for the complete list.

## Common to all syntaxes

First, upgrade both `@styistic/stylelint-plugin` to version 6 and `stylelint` itself to version 18.

After that, most configurations should continue to work as-is if you don't use custom syntaxes. However, some changes may also be necessary for configurations targeting plain CSS.

### Rule migration

The `declaration-block-single-line-max-declarations` rule from `stylelint` [has moved to the plugin](../../lib/rules/declaration-block-single-line-max-declarations/README.md). If your configuration includes this rule, either add the `@stylistic/` namespace to its name or move it to the new [`defineStylistic` and `defineStylisticOverride`](../user-guide/typed-configuration.md) functions.

### Conflicting settings

A pair of [conflicting settings](../user-guide/conflicting-settings.md) now causes the run to fail with a configuration error that identifies both settings and provides suggestions for fixing the issue. If you encounter this warning, simply update your configuration according to one of the suggestions.

Using the new [`defineStylistic` and `defineStylisticOverride`](../user-guide/typed-configuration.md) functions helps prevent such conflicts not only when the configuration is loaded, but also at the type level in your editor.

### New warnings and autofixes

The plugin includes many improvements, such as fixing numerous false-negative bugs, removing the dependency of autofix results on rule order in the configuration, expanding the scope of some rules, and more.

However, because every rule in the plugin now supports autofixing except `max-line-length` (which cannot be autofixed), you don't need to review all these improvements individually. Just run linting with `--fix` and review the resulting changes to your project's styles.

## Namespaces for custom syntaxes

Rules under their base names now read stylesheets only as plain CSS. If your configuration processes a syntax other than CSS through an `overrides` block with `customSyntax`, rename the rules in that block to use the namespace for that syntax:

```diff
export default {
    overrides: [
        {
            files: ["**/*.scss"],
            customSyntax: "postcss-scss",
            rules: {
-               "@stylistic/indentation": "tab",
+               "@stylistic/scss/indentation": "tab",
            },
        },
    ],
}
```

Use `less` or `styled` instead of `scss` for the other two syntaxes.

The new [`defineStylistic` and `defineStylisticOverride`](../user-guide/typed-configuration.md) functions let you avoid specifying a namespace for every rule. You specify the syntax once for the entire block, so rules keep their short names and can even omit the `@stylistic/` prefix. When using these functions with custom syntaxes, you'll also need to install the corresponding syntax package in your project (for example, `postcss-scss` for `scss`). These packages are not bundled with the plugin, to avoid adding unnecessary dependencies to your projects.

## New features (optional)

Check out the “[New rules](../../CHANGELOG.md#new-rules)” and “[New options](../../CHANGELOG.md#new-options)” sections of the changelog. Many of these additions are likely to be useful.

Alternatively, if you don't want to review them individually, use the new built-in [`@stylistic/stylelint-plugin/recommended`](../user-guide/configs.md) preset by adding it to your config's `extends` field. Although the preset is opinionated, its settings work well together and provide convenient style formatting. It also already includes most of the new rules and options, and will continue to gain new settings as features are added to the plugin. You can always override any settings in the preset that don't suit your needs.
