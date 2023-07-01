# value-list-comma-newline-after

Require a newline or disallow whitespace after the commas of value lists.

```css
a { background-size: 0,
      0; }            ↑
/**                   ↑
 * The newline after this comma */
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix most of the problems reported by this rule.

## Options

`string`: `"always"|"always-multi-line"|"never-multi-line"`

### `"always"`

There _must always_ be a newline after the commas.

The following patterns are considered problems:

```css
a { background-size: 0,0; }
```

```css
a { background-size: 0
      , 0; }
```

The following patterns are _not_ considered problems:

```css
a { background-size: 0,
      0; }
```

### `"always-multi-line"`

There _must always_ be a newline after the commas in multi-line value lists.

The following patterns are considered problems:

```css
a { background-size: 0
    , 0; }
```

The following patterns are _not_ considered problems:

```css
a { background-size: 0, 0; }
```

```css
a { background-size: 0,0; }
```

```css
a { background-size: 0,
      0; }
```

### `"never-multi-line"`

There _must never_ be whitespace after the commas in multi-line value lists.

The following patterns are considered problems:

```css
a { background-size: 0
      , 0; }
```

The following patterns are _not_ considered problems:

```css
a { background-size: 0,0; }
```

```css
a { background-size: 0, 0; }
```

```css
a { background-size: 0
      ,0; }
```
