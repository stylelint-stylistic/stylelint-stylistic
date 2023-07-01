# no-missing-end-of-source-newline

Disallow missing end-of-source newlines.

```css
    a { color: pink; }
    \n
/** ↑
 * This newline */
```

Completely empty files are not considered problems.

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix all of the problems reported by this rule.

## Options

### `true`

The following patterns are considered problems:

```css
a { color: pink; }
```

The following patterns are _not_ considered problems:

```css
a { color: pink; }
\n
```
