# at-rule-semicolon-newline-after

Require a newline after the semicolon of at-rules.

```css
@import url("x.css");
@import url("y.css");
/**                 ↑
 * The newline after these semicolons */
```

This rule allows an end-of-line comment followed by a newline. For example:

```css
@import url("x.css"); /* end-of-line comment */

a {}
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"`

### `"always"`

There _must always_ be a newline after the semicolon.

The following patterns are considered problems:

```css
@import url("x.css"); @import url("y.css");
```

```css
@import url("x.css"); a {}
```

The following patterns are _not_ considered problems:

```css
@import url("x.css");
@import url("y.css");
```

```css
@import url("x.css"); /* end-of-line comment */
a {}
```

```css
@import url("x.css");

a {}
```
