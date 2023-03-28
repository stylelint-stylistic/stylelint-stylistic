# declaration-bang-space-before

Require a single space or disallow whitespace before the bang of declarations.

```css
a { color: pink !important; }
/**             ↑
 * The space before this exclamation mark */
```

The [`fix` option](../../../docs/user-guide/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"`

### `"always"`

There _must always_ be a single space before the bang.

The following patterns are considered problems:

```css
a { color: pink!important; }
```

```css
a { color: pink  ! important; }
```

The following patterns are _not_ considered problems:

```css
a { color: pink !important; }
```

```css
a { color:pink ! important; }
```

### `"never"`

There _must never_ be whitespace before the bang.

The following patterns are considered problems:

```css
a { color : pink !important; }
```

The following patterns are _not_ considered problems:

```css
a { color: pink!important; }
```

```css
a { color: pink! important; }
```
