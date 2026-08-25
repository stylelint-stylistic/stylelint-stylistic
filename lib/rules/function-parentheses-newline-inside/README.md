# function-parentheses-newline-inside

Require a newline or disallow whitespace on the inside of the parentheses of functions.

```css
  a {
    transform: translate(
      1,             /* ↑ */
      1              /* ↑ */
    );               /* ↑ */
  }                  /* ↑ */
/** ↑                   ↑
 * The newline inside these two parentheses */
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix the problems reported by this rule, except two kinds of them under `"never-multi-line"`. Where an inline comment stands in front of the whitespace and the line break that whitespace holds is the one closing it, emptying the whitespace would leave the first argument, or the closing parenthesis, and everything the declaration has behind it, inside the comment's text; where a call is left with both problems at once, that is asked of the two fixes together as well as of each apart, since they are written in one pass over one value and a break either of them takes away can be the very break that keeps the other one's character out of the comment. And behind the opening parenthesis the fixer may not reach every stretch of the whitespace the option was measured against: the walk that measures it steps over an inline comment and counts what hangs behind the comment's end, while the fix stops at the double slash that opens one, and emptying only the stretches it does reach would leave the option violated behind a problem reported as fixed. Both times the whitespace is left alone and the warning stands. `"always"` and `"always-multi-line"` put a line break in and take nothing away, so neither kind holds them back.

## Options

`string`: `"always"|"always-multi-line"|"never-multi-line"`

### `"always"`

There _must always_ be a newline inside the parentheses.

The following patterns are considered problems:

```css
a { transform: translate(1, 1); }
```

```css
a { transform: translate(1,
  1
  ); }
```

The following patterns are _not_ considered problems:

```css
a {
  transform: translate(
    1, 1
  );
}
```

```css
a {
  transform: translate(
    1,
    1
  );
}
```

### `"always-multi-line"`

There _must always_ be a newline inside the parentheses of multi-line functions.

The following patterns are considered problems:

```css
a { transform: translate(1,
  1) }
```

The following patterns are _not_ considered problems:

```css
a { transform: translate(1, 1) }
```

```css
a { transform: translate( 1, 1 ) }
```

```css
a {
  transform: translate(
    1, 1
  );
}
```

```css
a {
  transform: translate(
    1,
    1
  );
}
```

### `"never-multi-line"`

The following patterns are considered problems:

```css
a {
  transform: translate(
    1, 1
  );
}
```

```css
a {
  transform: translate(
    1,
    1
  );
}
```

The following patterns are _not_ considered problems:

```css
a { transform: translate(1, 1) }
```

```css
a { transform: translate( 1, 1 ) }
```

```css
a { transform: translate(1,
  1) }
```
