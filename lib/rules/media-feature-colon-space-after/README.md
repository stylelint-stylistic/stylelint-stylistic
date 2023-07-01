# media-feature-colon-space-after

Require a single space or disallow whitespace after the colon in media features.

```css
@media (max-width: 600px) {}
/**              ↑
 * The space after this colon */
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"`

### `"always"`

There _must always_ be a single space after the colon.

The following patterns are considered problems:

```css
@media (max-width:600px) {}
```

```css
@media (max-width :600px) {}
```

The following patterns are _not_ considered problems:

```css
@media (max-width: 600px) {}
```

```css
@media (max-width : 600px) {}
```

### `"never"`

There _must never_ be whitespace after the colon.

The following patterns are considered problems:

```css
@media (max-width: 600px) {}
```

```css
@media (max-width : 600px) {}
```

The following patterns are _not_ considered problems:

```css
@media (max-width:600px) {}
```

```css
@media (max-width :600px) {}
```
