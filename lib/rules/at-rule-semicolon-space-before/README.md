# at-rule-semicolon-space-before

Require a single space or disallow whitespace before the semicolons of at-rules.

```css
@import "components/buttons";
/**                         ↑
 * The space before this semicolon */
```

Nothing is asked of an at-rule the file spells no semicolon behind — one running to the brace that closes its container, or to the end of the file. There is no semicolon there for whitespace to stand in front of, and the whitespace that does stand there is the closing brace's or the file's own.

## Options

`string`: `"always"|"never"`

### `"always"`

There _must always_ be a single space before the semicolons.

The following pattern is considered a problem:

```css
@import "components/buttons";
```

The following pattern is _not_ considered a problem:

```css
@import "components/buttons" ;
```

### `"never"`

There _must never_ be a single space before the semicolons.

The following pattern is considered a problem:

```css
@import "components/buttons" ;
```

The following pattern is _not_ considered a problem:

```css
@import "components/buttons";
```
