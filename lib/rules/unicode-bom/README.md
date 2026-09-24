# unicode-bom

Require or disallow the Unicode Byte Order Mark.

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix all of the problems reported by this rule.

Under `"always"` a CSS file whose first node is a `@charset`, in any spelling, gets a warning about the option rather than a mark: the mark outranks the encoding declaration behind it, so set `"never"` or leave the rule unset for such files, and let Stylelint's [`at-charset-rule-no-invalid`](https://stylelint.io/user-guide/rules/at-charset-rule-no-invalid) rule judge the declaration's spelling. An SCSS or Less file gets the mark as any file does, since neither compiler carries it into the output.

## Options

`string`: `"always"|"never"`

### `"always"`

The following patterns are considered problems:

```css
a {}
```

```css
@charset "utf-8";
a {}
```

The following pattern is _not_ considered a problem:

```css
U+FEFF
a {}
```

### `"never"`

The following pattern is considered a problem:

```css
U+FEFF
a {}
```

The following pattern is _not_ considered a problem:

```css
a {}
```
