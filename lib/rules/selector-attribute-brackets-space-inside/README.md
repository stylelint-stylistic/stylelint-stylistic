# selector-attribute-brackets-space-inside

Require a single space or disallow whitespace on the inside of the brackets within attribute selectors.

```css
    [ target=_blank ]
/** ↑               ↑
 * The space inside these two brackets */
```

The [`fix` option](../../../docs/user-guide/options.md#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"`

### `"always"`

There _must always_ be a single space inside the brackets.

The following patterns are considered problems:

```css
[target] {}
```

```css
[ target] {}
```

```css
[target ] {}
```

```css
[target=_blank] {}
```

```css
[ target=_blank] {}
```

```css
[target=_blank ] {}
```

The following patterns are _not_ considered problems:

```css
[ target ] {}
```

```css
[ target=_blank ] {}
```

### `"never"`

There _must never_ be whitespace on the inside the brackets.

The following patterns are considered problems:

```css
[ target] {}
```

```css
[target ] {}
```

```css
[ target ] {}
```

```css
[ target=_blank] {}
```

```css
[target=_blank ] {}
```

```css
[ target=_blank ] {}
```

The following patterns are _not_ considered problems:

```css
[target] {}
```

```css
[target=_blank] {}
```
