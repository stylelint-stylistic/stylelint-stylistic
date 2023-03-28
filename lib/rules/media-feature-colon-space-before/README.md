# media-feature-colon-space-before

Require a single space or disallow whitespace before the colon in media features.

```css
@media (max-width :600px) {}
/**               ↑
 * The space before this colon */
```

The [`fix` option](../../../docs/user-guide/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"`

### `"always"`

There _must always_ be a single space before the colon.

The following patterns are considered problems:

```css
@media (max-width:600px) {}
```

```css
@media (max-width: 600px) {}
```

The following patterns are _not_ considered problems:

```css
@media (max-width :600px) {}
```

```css
@media (max-width : 600px) {}
```

### `"never"`

There _must never_ be whitespace before the colon.

The following patterns are considered problems:

```css
@media (max-width :600px) {}
```

```css
@media (max-width : 600px) {}
```

The following patterns are _not_ considered problems:

```css
@media (max-width:600px) {}
```

```css
@media (max-width: 600px) {}
```
