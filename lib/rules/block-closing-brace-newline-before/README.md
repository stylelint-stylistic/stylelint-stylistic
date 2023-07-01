# block-closing-brace-newline-before

Require a newline or disallow whitespace before the closing brace of blocks.

```css
    a { color: pink;
    }
/** ↑
 * The newline before this brace */
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"always-multi-line"|"never-multi-line"`

### `"always"`

There _must always_ be a newline before the closing brace.

The following patterns are considered problems:

```css
a { color: pink;}
```

The following patterns are _not_ considered problems:

```css
a { color: pink;
}
```

```css
a {
color: pink;
}
```

### `"always-multi-line"`

There _must always_ be a newline before the closing brace in multi-line blocks.

The following patterns are considered problems:

```css
a {
color: pink;}
```

The following patterns are _not_ considered problems:

```css
a { color: pink; }
```

```css
a { color: pink;
}
```

### `"never-multi-line"`

There _must never_ be whitespace before the closing brace in multi-line blocks.

The following patterns are considered problems:

```css
a {
color: pink; }
```

The following patterns are _not_ considered problems:

```css
a { color: pink; }
```

```css
a {
color: pink;}
```
