# media-feature-slash-space-before

Require a single space or disallow whitespace before the solidus of a ratio in media features.

```css
@media (aspect-ratio: 16 /9) {}
/**                     ↑
 * The space before this solidus */
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix most of the problems reported by this rule.

The solidus this rule reads is the one between the two numbers of a `<ratio>`, in the colon form of a feature (`(aspect-ratio: 16 / 9)`) and in the range form (`(16 / 9 <= aspect-ratio)`) alike. A solidus inside the arguments of a math function is the division operator and is not read, and neither is one inside a `url()` address, a string or a comment. The solidus of a declaration's value is read by [`value-slash-space-before`](../value-slash-space-before/README.md).

Where the whitespace in front of the solidus is the line break that closes a `//` comment of a preprocessor, the problem is reported and the query left as it stands: a space written there would take the solidus into the comment, and so would taking the break away.

## Options

`string`: `"always"|"never"`

### `"always"`

There _must always_ be a single space before the solidus.

The following patterns are considered problems:

```css
@media (aspect-ratio: 16/9) {}
```

```css
@media (aspect-ratio: 16/ 9) {}
```

The following patterns are _not_ considered problems:

```css
@media (aspect-ratio: 16 /9) {}
```

```css
@media (aspect-ratio: 16 / 9) {}
```

### `"never"`

There _must never_ be whitespace before the solidus.

The following patterns are considered problems:

```css
@media (aspect-ratio: 16 /9) {}
```

```css
@media (aspect-ratio: 16 / 9) {}
```

The following patterns are _not_ considered problems:

```css
@media (aspect-ratio: 16/9) {}
```

```css
@media (aspect-ratio: 16/ 9) {}
```
