# value-slash-newline-before

Require a newline or disallow whitespace before the solidus that separates the parts of a value.

```css
a { grid-template: "a a" 1fr
      / 1fr 1fr; }
/**   ↑
 * The newline before this solidus */
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix most of the problems reported by this rule.

The solidus this rule reads is the one [`value-slash-space-before`](../value-slash-space-before/README.md) reads: the separator CSS spells between the numbers of a ratio, the sizes of a font shorthand, the lines of a grid area and the colour and the alpha of a colour function, and never the division operator of a math function, a character of a `url()` address, a string or a comment. The two rules divide a declaration between them the way the `value-list-comma-*` rules do: this one under `always-multi-line` or `never-multi-line` speaks of a declaration spanning lines, and the space rule under `always-single-line` or `never-single-line` of one on a single line.

The newline the fix writes goes over the whitespace in front of the solidus, which is the end of a line; the indentation of the line the solidus then opens is the [`indentation`](../indentation/README.md) rule's to write. Where that whitespace is the line break that closes a `//` comment of a preprocessor, `"never-multi-line"` reports the problem and leaves the value as it stands, since taking the break away would take the solidus into the comment.

## Options

`string`: `"always"|"always-multi-line"|"never-multi-line"`

### `"always"`

There _must always_ be a newline before the solidus.

The following patterns are considered problems:

```css
a { grid-area: 1 / 2; }
```

```css
a { grid-area: 1 /
      2; }
```

The following patterns are _not_ considered problems:

```css
a { grid-area: 1
      / 2; }
```

### `"always-multi-line"`

There _must always_ be a newline before the solidus in multi-line declarations.

The following patterns are considered problems:

```css
a { grid-area: 1 /
      2; }
```

The following patterns are _not_ considered problems:

```css
a { grid-area: 1 / 2; }
```

```css
a { grid-area: 1
      / 2; }
```

### `"never-multi-line"`

There _must never_ be whitespace before the solidus in multi-line declarations.

The following patterns are considered problems:

```css
a { grid-area: 1
      / 2; }
```

```css
a { grid-area: 1 /
      2; }
```

The following patterns are _not_ considered problems:

```css
a { grid-area: 1 / 2; }
```

```css
a { grid-area: 1/
      2; }
```

## Optional secondary options

### `ignoreFunctions: ["/regex/", /regex/, "non-regex"]`

Ignore the solidi inside the specified functions, including those of any function nested within them.

Function names are matched case-sensitively as written. Use a case-insensitive regex (e.g. `"/^rgb$/i"`) to match other letter cases.

For example, with `"always"`.

Given:

```json
["rgb"]
```

The following patterns are _not_ considered problems:

```css
a { color: rgb(0 0 0 / 50%); }
```

### `ignoreProperties: ["/regex/", /regex/, "non-regex"]`

Ignore the solidi in the values of the specified properties.

Property names are matched case-sensitively as written. Use a case-insensitive regex (e.g. `"/^grid-area$/i"`) to match other letter cases.

For example, with `"always"`.

Given:

```json
["/^grid-/"]
```

The following patterns are _not_ considered problems:

```css
a { grid-area: 1 / 2; }
```
