# no-empty-first-line

Disallow empty first lines.

```css
    \n
    /** ↑
     * This newline */
    a { color: pink; }
```

This rule ignores empty sources. Use the [`no-empty-source`](https://stylelint.io/user-guide/rules/no-empty-source) rule to disallow these.

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix all of the problems reported by this rule.

## Options

### `true`

The following patterns are considered problems:

```css
\n
a { color: pink; }
```

The following patterns are _not_ considered problems:

```css
a { color: pink; }
```
