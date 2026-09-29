# value-slash-newline-after

Require a newline or disallow whitespace after the solidus that separates the parts of a value.

```css
a { grid-template: "a a" 1fr /
      1fr 1fr; }              ↑
/**                           ↑
 * The newline after this solidus */
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix most of the problems reported by this rule.

This rule reads the solidus [`value-slash-space-after`](../value-slash-space-after/README.md) reads. The two rules divide a declaration between them the way the `value-list-comma-*` rules do: this one under `always-multi-line` or `never-multi-line` speaks of a declaration spanning lines, and the space rule under `always-single-line` or `never-single-line` of one on a single line.

A block comment standing right behind the solidus is read through, and the newline is looked for behind it; a `//` comment of a preprocessor ends with the newline already. The fix writes the newline in front of the whitespace behind the solidus, which then becomes the indentation of the new line, for the [`indentation`](../indentation/README.md) rule to measure. Where the fix would move code into a `//` comment, it leaves the whitespace alone and the warning stands.

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
