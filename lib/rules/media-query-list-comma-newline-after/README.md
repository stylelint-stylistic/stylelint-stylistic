# media-query-list-comma-newline-after

Require a newline or disallow whitespace after the commas of media query lists.

```css
@media screen and (color),
  projection {}       /* ↑ */
/**                      ↑
 *            These commas */
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"always-multi-line"|"never-multi-line"`

### `"always"`

There _must always_ be a newline after the commas.

The following patterns are considered problems:

```css
@media screen and (color), projection and (color) {}
```

```css
@media screen and (color)
, projection and (color) {}
```

The following patterns are _not_ considered problems:

```css
@media screen and (color),
projection and (color) {}
```

```css
@media screen and (color)
,
projection and (color) {}
```

### `"always-multi-line"`

There _must always_ be a newline after the commas in multi-line media query lists.

The following patterns are considered problems:

```css
@media screen and (color)
, projection and (color) {}
```

The following patterns are _not_ considered problems:

```css
@media screen and (color), projection and (color) {}
```

```css
@media screen and (color),
projection and (color) {}
```

```css
@media screen and (color)
,
projection and (color) {}
```

### `"never-multi-line"`

There _must never_ be whitespace after the commas in multi-line media query lists.

The following patterns are considered problems:

```css
@media screen and (color),
projection and (color) {}
```

```css
@media screen and (color)
,
projection and (color) {}
```

The following patterns are _not_ considered problems:

```css
@media screen and (color), projection and (color) {}
```

```css
@media screen and (color)
,projection and (color) {}
```
