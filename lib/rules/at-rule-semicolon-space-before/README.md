# at-rule-semicolon-space-before

Require a single space or disallow whitespace before the semicolons of at-rules.

```css
@import "components/buttons";
/**                         ↑
 * The space before this semicolon */
```

Nothing is asked of an at-rule the file spells no semicolon behind — one running to the brace that closes its container, or to the end of the file. There is no semicolon there for whitespace to stand in front of, and the whitespace that does stand there is the closing brace's or the file's own.

The rule passes over an encoding declaration spelled as the specification reads it — `@charset "utf-8";` at the very start of the file, with one space and double quotes — since no other spelling of it declares an encoding at all.

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix most of the problems reported by this rule. It writes nothing where a `//` comment runs to the end of the at-rule, since the semicolon would land inside the comment, and `"always"` writes nothing in front of the semicolon of a `@charset`, which the specification reads no whitespace in front of. The warning stands in both.

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
