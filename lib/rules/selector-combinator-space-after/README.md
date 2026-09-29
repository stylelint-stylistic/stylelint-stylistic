# selector-combinator-space-after

Require a single space or disallow whitespace after the combinators of selectors.

```css
  a > b + c ~ d e >>> f { color: pink; }
/** ↑   ↑   ↑  ↑  ↑
 * These are combinators */
```

The descendant combinator is _not_ checked by this rule.

Also, `+` and `-` signs within `:nth-*()` arguments are not checked (e.g. `a:nth-child(2n+1)`).

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"`

### `"always"`

There _must always_ be a single space after the combinators.

The following patterns are considered problems:

```css
a +b { color: pink; }
```

```css
a>b { color: pink; }
```

The following patterns are _not_ considered problems:

```css
a + b { color: pink; }
```

```css
a> b { color: pink; }
```

### `"never"`

There _must never_ be whitespace after the combinators.

The following patterns are considered problems:

```css
a + b { color: pink; }
```

```css
a> b { color: pink; }
```

The following patterns are _not_ considered problems:

```css
a +b { color: pink; }
```

```css
a>b { color: pink; }
```
