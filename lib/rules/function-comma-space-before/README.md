# function-comma-space-before

Require a single space or disallow whitespace before the commas of functions.

```css
a { transform: translate(1 ,1) }
/**                        ↑
 * The space before this comma */
```

The [`fix` option](../../../docs/user-guide/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"|"always-single-line"|"never-single-line"`

### `"always"`

There _must always_ be a single space before the commas.

The following patterns are considered problems:

```css
a { transform: translate(1,1) }
```

```css
a { transform: translate(1, 1) }
```

The following patterns are _not_ considered problems:

```css
a { transform: translate(1 ,1) }
```

```css
a { transform: translate(1 , 1) }
```

### `"never"`

There _must never_ be whitespace before the commas.

The following patterns are considered problems:

```css
a { transform: translate(1 ,1) }
```

```css
a { transform: translate(1 , 1) }
```

The following patterns are _not_ considered problems:

```css
a { transform: translate(1,1) }
```

```css
a { transform: translate(1, 1) }
```

### `"always-single-line"`

There _must always_ be a single space before the commas in single-line functions.

The following patterns are considered problems:

```css
a { transform: translate(1,1) }
```

```css
a { transform: translate(1, 1) }
```

The following patterns are _not_ considered problems:

```css
a { transform: translate(1 ,1) }
```

```css
a { transform: translate(1 , 1) }
```

```css
a {
  transform: translate(1,
    1)
}
```

### `"never-single-line"`

There _must never_ be whitespace before the commas in single-line functions.

The following patterns are considered problems:

```css
a { transform: translate(1 ,1) }
```

```css
a { transform: translate(1 , 1) }
```

The following patterns are _not_ considered problems:

```css
a { transform: translate(1,1) }
```

```css
a { transform: translate(1, 1) }
```

```css
a {
  transform: translate(1 ,
    1)
}
```
