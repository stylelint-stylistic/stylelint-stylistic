# function-whitespace-after

Require or disallow whitespace after functions.

```css
a { transform: translate(1, 1) scale(3); }
/**                           ↑
 *                   This space */
```

This rule does not check for space immediately after `)` if the very next character is `,`, `)`, `/` or `}`, allowing some of the patterns exemplified below.

The `never` option reads no whitespace standing in front of a `+` or a `-` that opens no number, wherever such a pair stands: the whitespace is what makes the sign the operator of a sum, so `a { width: calc(var(--x) + 1px); }` keeps its space under that option instead of being closed up into a calculation no browser reads. A sign with a digit or a decimal point behind it opens a number rather than a sum, so `a { width: url(x) -1px; }` is closed up like anything else, and so are a `*` and a `/`, which ask for no whitespace beside them.

A parenthesis that opens no call is not read at all. Parentheses that group an expression rather than open a call are none of this rule's business, and whatever stands behind them belongs to the expression: `a { width: calc((100% - 20px) - 1rem); }` keeps the spaces the CSS grammar asks for around its operator, and `h1 { width: (@a * 2)px; }` and `h1 { width: (@a * 2) px; }` are each left as they are written, whichever option is set.

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix all of the problems reported by this rule.

## Options

`string`: `"always"|"never"`

### `"always"`

There _must always_ be whitespace after the function.

The following patterns are considered problems:

```css
a { transform: translate(1, 1)scale(3); }
```

The following patterns are _not_ considered problems:

```css
a { transform: translate(1, 1) scale(3); }
```

```css
a { transform: translate(1, 1)     scale(3); }
```

```css
a {
  transform:
    translate(1, 1)
    scale(3);
}
```

```css
/* the inner parentheses group an expression and open no call, and the outer ones close the value */
a { top: calc(1 * (1 + 3)); }
```

```css
/* notice the ), with no space after the closing parenthesis */
a { padding: calc(1 * 2px), calc(2 * 5px); }
```

### `"never"`

There _must never_ be whitespace after the function.

The following patterns are considered problems:

```css
a { transform: translate(1, 1) scale(3); }
```

The following patterns are _not_ considered problems:

```css
a { transform: translate(1, 1)scale(3); }
```
