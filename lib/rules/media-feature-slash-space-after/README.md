# media-feature-slash-space-after

Require a single space or disallow whitespace after the solidus of a ratio in media features.

```css
@media (aspect-ratio: 16/ 9) {}
/**                     ↑
 * The space after this solidus */
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix most of the problems reported by this rule.

The solidus this rule reads is the one between the two numbers of a `<ratio>`, in the colon form of a feature (`(aspect-ratio: 16 / 9)`) and in the range form (`(16 / 9 <= aspect-ratio)`) alike. A solidus inside the arguments of a math function is the division operator and is not read, and neither is one inside a `url()` address, a string or a comment. The solidus of a declaration's value is read by [`value-slash-space-after`](../value-slash-space-after/README.md).

Where a comment stands right behind the whitespace under a preprocessor, `"never"` reports the problem and leaves the query as it stands: closing the solidus up against the `/` that opens the comment would spell a `//` comment running to the end of the line, and the solidus would be its first character.

## Options

`string`: `"always"|"never"`

### `"always"`

There _must always_ be a single space after the solidus.

The following patterns are considered problems:

```css
@media (aspect-ratio: 16/9) {}
```

```css
@media (aspect-ratio: 16 /9) {}
```

The following patterns are _not_ considered problems:

```css
@media (aspect-ratio: 16/ 9) {}
```

```css
@media (aspect-ratio: 16 / 9) {}
```

### `"never"`

There _must never_ be whitespace after the solidus.

The following patterns are considered problems:

```css
@media (aspect-ratio: 16/ 9) {}
```

```css
@media (aspect-ratio: 16 / 9) {}
```

The following patterns are _not_ considered problems:

```css
@media (aspect-ratio: 16/9) {}
```

```css
@media (aspect-ratio: 16 /9) {}
```
