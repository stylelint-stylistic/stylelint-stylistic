# at-rule-name-newline-after

Require a newline after at-rule names.

```css
    @media
   /*↑*/  (max-width: 600px) {}
/**  ↑
 * The newline after this at-rule name */
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix most of the problems reported by this rule. Under Less it writes no break behind an `@import` or `@plugin` with no whitespace behind the name, since Less takes the two as directives only with whitespace there. The warning stands.

The rule passes over a `@charset` in any spelling: the encoding declaration is a byte sequence the browser reads before parsing rather than an at-rule, and Stylelint's [`at-charset-rule-no-invalid`](https://stylelint.io/user-guide/rules/at-charset-rule-no-invalid) rule judges its spelling. A CSS file holding one gets a single warning asking for that rule where the configuration leaves it off.

## Options

`string`: `"always"|"always-multi-line"`

### `"always"`

There _must always_ be a newline after at-rule names.

The following patterns are considered problems:

```css
@import "x.css";
```

```css
@media (min-width: 700px) and
  (orientation: landscape) {}
```

The following patterns are _not_ considered problems:

```css
@import
  "x.css";
```

```css
@import
  "x.css" screen and
 (orientation:landscape);
```

```css
@media
  (min-width: 700px) and (orientation: landscape) {}
```

```css
@media
  (min-width: 700px) and
  (orientation: landscape) {}
```

### `"always-multi-line"`

There _must always_ be a newline after at-rule names in at-rules with multi-line parameters.

The following patterns are considered problems:

```css
@import "x.css" screen and
 (orientation:landscape);
```

```css
@media (min-width: 700px) and
 (orientation: landscape) {}
```

The following patterns are _not_ considered problems:

```css
@import "x.css";
```

```css
@import
  "x.css";
```

```css
@import "x.css" screen and (orientation:landscape);
```

```css
@media (min-width: 700px) and (orientation: landscape) {}
```

```css
@media
  (min-width: 700px) and
  (orientation: landscape) {}
```
