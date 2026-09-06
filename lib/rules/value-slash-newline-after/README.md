# value-slash-newline-after

Require a newline or disallow whitespace after the solidus that separates the parts of a value.

```css
a { grid-template: "a a" 1fr /
      1fr 1fr; }              ↑
/**                           ↑
 * The newline after this solidus */
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix most of the problems reported by this rule.

The solidus this rule reads is the one [`value-slash-space-after`](../value-slash-space-after/README.md) reads: the separator CSS spells between the numbers of a ratio, the sizes of a font shorthand, the lines of a grid area and the colour and the alpha of a colour function, and never the division operator of a math function, a character of a `url()` address, a string or a comment. The two rules divide a declaration between them the way the `value-list-comma-*` rules do: this one under `always-multi-line` or `never-multi-line` speaks of a declaration spanning lines, and the space rule under `always-single-line` or `never-single-line` of one on a single line.

A comment standing right behind the solidus moves the question behind the comment: a block comment is read through, and the newline is looked for behind it; a `//` comment of a preprocessor is closed by a newline, so the newline the rule asks for is there already. The newline the fix writes goes in front of whatever whitespace stands behind the solidus, which then becomes the indentation of the line the newline opens, for the [`indentation`](../indentation/README.md) rule to measure. Where a comment stands right behind that whitespace under a preprocessor, `"never-multi-line"` reports the problem and leaves the value as it stands: closing the solidus up against the `/` that opens the comment would spell a `//` comment with the solidus as its first character.

## Options

`string`: `"always"|"always-multi-line"|"never-multi-line"`

### `"always"`

There _must always_ be a newline after the solidus.

The following patterns are considered problems:

```css
a { grid-area: 1 / 2; }
```

```css
a { grid-area: 1
      / 2; }
```

The following patterns are _not_ considered problems:

```css
a { grid-area: 1 /
      2; }
```

### `"always-multi-line"`

There _must always_ be a newline after the solidus in multi-line declarations.

The following patterns are considered problems:

```css
a { grid-area: 1
      / 2; }
```

The following patterns are _not_ considered problems:

```css
a { grid-area: 1 / 2; }
```

```css
a { grid-area: 1 /
      2; }
```

### `"never-multi-line"`

There _must never_ be whitespace after the solidus in multi-line declarations.

The following patterns are considered problems:

```css
a { grid-area: 1 /
      2; }
```

```css
a { grid-area: 1
      / 2; }
```

The following patterns are _not_ considered problems:

```css
a { grid-area: 1 / 2; }
```

```css
a { grid-area: 1
      /2; }
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
