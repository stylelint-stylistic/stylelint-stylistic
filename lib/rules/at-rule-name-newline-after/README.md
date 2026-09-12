# at-rule-name-newline-after

Require a newline after at-rule names.

```css
    @media
   /*↑*/  (max-width: 600px) {}
/**  ↑
 * The newline after this at-rule name */
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix most of the problems reported by this rule. It writes no break behind the name of a `@charset`, whatever its head is spelled like: a rule respelling that head can make it the encoding declaration within the same run, and a break there is never the spelling the specification reads. The warning stands.

The rule passes over an encoding declaration spelled as the specification reads it — `@charset "utf-8";` at the very start of the file, with one space and double quotes — since no other spelling of it declares an encoding at all.

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
