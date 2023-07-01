# selector-pseudo-class-parentheses-space-inside

Require a single space or disallow whitespace on the inside of the parentheses within pseudo-class selectors.

```css
input:not( [type="submit"] ) {}
/**      ↑                 ↑
 * The space inside these two parentheses */
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix most of the problems reported by this rule. It won't fix pseudo elements containing comments.

## Options

`string`: `"always"|"never"`

### `"always"`

There _must always_ be a single space inside the parentheses.

The following patterns are considered problems:

```css
input:not([type="submit"]) {}
```

```css
input:not([type="submit"] ) {}
```

The following patterns are _not_ considered problems:

```css
input:not( [type="submit"] ) {}
```

### `"never"`

There _must never_ be whitespace on the inside the parentheses.

The following patterns are considered problems:

```css
input:not( [type="submit"] ) {}
```

```css
input:not( [type="submit"]) {}
```

The following patterns are _not_ considered problems:

```css
input:not([type="submit"]) {}
```
