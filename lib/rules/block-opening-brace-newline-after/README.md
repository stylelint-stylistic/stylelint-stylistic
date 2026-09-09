# block-opening-brace-newline-after

Require a newline after the opening brace of blocks.

```css
  a {
    ↑ color: pink; }
/** ↑
 * The newline after this brace */
```

This rule allows an end-of-line comment followed by a newline. For example,

```css
a { /* end-of-line comment */
  color: pink;
}
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix most of the problems reported by this rule. Over a block holding nothing but comments the run it reads is the whitespace in front of the closing brace, which the `block-closing-brace-newline-before`, `block-closing-brace-space-before` and `block-closing-brace-empty-line-before` rules write too, so it writes there only where each of those that speaks of the block the write leaves, and whose fix you have not turned off, asks for a run this rule accepts as well; otherwise the warning stands for you to answer by hand. Nor does it write over a run holding anything the plugin does not read as whitespace, a stray semicolon for one, which those rules read differently from one another.

## Options

`string`: `"always"|"always-multi-line"|"never-multi-line"`

### `"always"`

There _must always_ be a newline after the opening brace.

The following patterns are considered problems:

```css
a{ color: pink; }
```

```css
a{ color: pink;
}
```

```css
a{ /* end-of-line comment
  with a newline */
  color: pink;
}
```

The following patterns are _not_ considered problems:

```css
a {
color: pink; }
```

```css
a
{
color: pink; }
```

```css
a { /* end-of-line comment */
  color: pink;
}
```

### `"always-multi-line"`

There _must always_ be a newline after the opening brace in multi-line blocks.

The following patterns are considered problems:

```css
a{color: pink;
}
```

The following patterns are _not_ considered problems:

```css
a { color: pink; }
```

```css
a {
color: pink; }
```

### `"never-multi-line"`

There _must never_ be whitespace after the opening brace in multi-line blocks.

The following patterns are considered problems:

```css
a { color: pink;
}
```

The following patterns are _not_ considered problems:

```css
a { color: pink; }
```

```css
a {color: pink;
}
```

## Optional secondary options

### `ignore: ["rules"]`

Ignore the opening brace of rules.

For example, with `"always"`:

The following pattern is _not_ considered a problem:

```css
a { color: pink; }
```
