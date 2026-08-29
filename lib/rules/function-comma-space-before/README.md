# function-comma-space-before

Require a single space or disallow whitespace before the commas of functions.

```css
a { transform: translate(1 ,1) }
/**                        ↑
 * The space before this comma */
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"|"always-single-line"|"never-single-line"`

### `"always"`

There _must always_ be a single space before the commas.

The following patterns are considered problems:

```css
a { transform: translate(1,1) }
```

```css
a { transform: translate(1, 1) }
```

The following patterns are _not_ considered problems:

```css
a { transform: translate(1 ,1) }
```

```css
a { transform: translate(1 , 1) }
```

### `"never"`

There _must never_ be whitespace before the commas.

The following patterns are considered problems:

```css
a { transform: translate(1 ,1) }
```

```css
a { transform: translate(1 , 1) }
```

The following patterns are _not_ considered problems:

```css
a { transform: translate(1,1) }
```

```css
a { transform: translate(1, 1) }
```

### `"always-single-line"`

There _must always_ be a single space before the commas in single-line functions.

The following patterns are considered problems:

```css
a { transform: translate(1,1) }
```

```css
a { transform: translate(1, 1) }
```

The following patterns are _not_ considered problems:

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

There _must never_ be whitespace before the commas in single-line functions.

The following patterns are considered problems:

```css
a { transform: translate(1 ,1) }
```

```css
a { transform: translate(1 , 1) }
```

The following patterns are _not_ considered problems:

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

## Optional secondary options

### `ignoreFunctions: ["/regex/", /regex/, "non-regex"]`

Ignore the commas of specified functions, including the commas of any function nested within them.

Function names are matched case-sensitively as written. Use a case-insensitive regex (e.g. `"/^translate$/i"`) to match other letter cases. This is important for custom functions like `--my-function()`, whose names are case-sensitive.

For example, with `"always"`.

Given:

```json
["translate", "/^rgba?$/"]
```

The following patterns are _not_ considered problems:

```css
a { transform: translate(1,1) }
```

```css
a { color: rgba(0,0,0,0.5) }
```

```css
a { transform: translate(min(1px,2px),1) }
```

The following patterns are still considered problems:

```css
a { transform: scale(1,1) }
```

```css
a { background: linear-gradient(45deg,rgba(0,0,0,0.5)) }
```
