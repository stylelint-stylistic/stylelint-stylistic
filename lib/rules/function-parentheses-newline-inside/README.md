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

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix the problems reported by this rule, except some under `"never-multi-line"` where an inline comment stands in the whitespace: emptying it could move code into the comment, so the whitespace is left alone and the warning stands.

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

The following patterns are _not_ considered problems:

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

The following patterns are _not_ considered problems:

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

The following patterns are _not_ considered problems:

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
