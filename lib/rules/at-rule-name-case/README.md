# at-rule-name-case

Specify lowercase or uppercase for at-rules names.

```css
   @media (min-width: 10px) {}
/** ↑
 * This at-rule name */
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix some of the problems reported by this rule.

The [`message` secondary option](https://stylelint.io/user-guide/configure/#message) can accept the arguments of this rule.

The rule passes over a `@charset` in any spelling: the encoding declaration is a byte sequence the browser reads before parsing rather than an at-rule, and Stylelint's [`at-charset-rule-no-invalid`](https://stylelint.io/user-guide/rules/at-charset-rule-no-invalid) rule judges its spelling. A CSS file holding one gets a single warning asking for that rule where the configuration leaves it off.

## Options

`string`: `"lower"|"upper"`

### `"lower"`

The following patterns are considered problems:

```css
@Layer base;
```

```css
@lAyEr base;
```

```css
@LAYER base;
```

```css
@Media (min-width: 50em) {}
```

```css
@mEdIa (min-width: 50em) {}
```

```css
@MEDIA (min-width: 50em) {}
```

The following patterns are _not_ considered problems:

```css
@layer base;
```

```css
@media (min-width: 50em) {}
```

### `"upper"`

The following patterns are considered problems:

```css
@Layer base;
```

```css
@lAyEr base;
```

```css
@layer base;
```

```css
@Media (min-width: 50em) {}
```

```css
@mEdIa (min-width: 50em) {}
```

```css
@media (min-width: 50em) {}
```

The following patterns are _not_ considered problems:

```css
@LAYER base;
```

```css
@MEDIA (min-width: 50em) {}
```
