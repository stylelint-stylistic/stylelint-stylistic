# function-parentheses-space-inside

Require a single space or disallow whitespace on the inside of the parentheses of functions.

```css
a { transform: translate( 1, 1 ); }
/**                     ↑      ↑
 * The space inside these two parentheses */
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix the problems reported by this rule, except the ones where an inline comment stands in front of the whitespace and the line break that whitespace holds is the one closing it: writing over that break would leave the first argument, or the closing parenthesis, and everything the declaration has behind it, inside the comment's text, so the whitespace is left alone and the warning stands. Only `"always"` and `"never"` ever meet such a break, since whitespace holding one makes the function multi-line and so puts it outside what the two single-line options are about.

## Options

`string`: `"always"|"never"|"always-single-line"|"never-single-line"`

### `"always"`

There _must always_ be a single space inside of the parentheses.

The following patterns are considered problems:

```css
a { transform: translate(1, 1); }
```

```css
a { transform: translate(1, 1 ); }
```

The following patterns are _not_ considered problems:

```css
a { transform: translate( 1, 1 ); }
```

### `"never"`

There _must never_ be whitespace on the inside of the parentheses.

The following patterns are considered problems:

```css
a { transform: translate( 1, 1 ); }
```

```css
a { transform: translate(1, 1 ); }
```

The following patterns are _not_ considered problems:

```css
a { transform: translate(1, 1); }
```

### `"always-single-line"`

There _must always_ be a single space inside the parentheses of single-line functions.

The following patterns are considered problems:

```css
a { transform: translate(1, 1) }
```

```css
a { transform: translate(1, 1 ) }
```

The following patterns are _not_ considered problems:

```css
a { transform: translate( 1, 1 ) }
```

```css
a { transform: translate(1,
  1) }
```

```css
a {
  transform: translate(
    1,
    1
  )
}
```

### `"never-single-line"`

There _must never_ be whitespace inside the parentheses of single-line functions.

The following patterns are considered problems:

```css
a { transform: translate( 1, 1 ) }
```

```css
a { transform: translate(1, 1 ) }
```

The following patterns are _not_ considered problems:

```css
a { transform: translate(1, 1) }
```

```css
a { transform: translate( 1,
  1) }
```

```css
a {
  transform: translate(
    1,
    1
  )
}
```
