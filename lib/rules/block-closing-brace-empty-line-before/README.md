# block-closing-brace-empty-line-before

Require or disallow an empty line before the closing brace of blocks.

```css
a {
  color: pink;
  /* ← */
} /* ↑ */
/**  ↑
 * This line */
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix all of the problems reported by this rule.

Over a block holding nothing but comments the run in front of the closing brace is the run behind the opening brace, so [`block-opening-brace-newline-after`](https://stylelint-stylistic.github.io/rules/block-opening-brace-newline-after) writes it too. Asked under `never-multi-line`, it takes both breaks of an empty line back out, and no file satisfies both: there the reversal behind `except: ["after-closing-brace"]` asks for nothing and that rule writes. A copy of it kept off reporting — by a disable comment standing on the line its warning falls on, which for a head written in several lines is the line the opening brace stands on, or by `ignore: ["rules"]`, which takes it off rules alone — is asked nothing, since a rule that reports nothing forbids nothing, and the empty line stands.

## Options

`string`: `"always-multi-line"|"never"`

### `always-multi-line`

The following patterns are considered problems:

```css
a {
  color: pink;
}
```

The following patterns are _not_ considered problems:

```css
a {
  color: pink;

}
```

```css
a { color: pink; }
```

### `never`

The following patterns are considered problems:

```css
a {
  color: pink;

}
```

The following patterns are _not_ considered problems:

```css
a {
  color: pink;
}
```

```css
a { color: pink; }
```

## Optional secondary options

### `except: ["after-closing-brace"]`

When a rule is nested, `after-closing-brace` brace will reverse the primary option.

For example, with `"never"` and `except: ["after-closing-brace"]`:

The following patterns are considered problems:

```css
@media print {

  a {
    color: aquamarine;
  }
}
```

```css
@supports (animation-name: test) {

  a {
    color: aquamarine;
  }
}
```

```css
@keyframes test {

  100% {
    color: aquamarine;
  }
}
```

The following patterns are _not_ considered problems:

```css
@media print {

  a {
    color: aquamarine;
  }

}
```

```css
@font-face {
  font-family: "MyFont";
  src: url("myfont.woff2") format("woff2");
}
```

```css
@supports (animation-name: test) {

  a {
    color: aquamarine;
  }

}
```

```css
@keyframes test {

  100% {
    color: aquamarine;
  }

}
```

For example, with `"always-multi-line"` and `except: ["after-closing-brace"]`:

The following patterns are considered problems:

```css
@media print {

  a {
    color: aquamarine;

  }

}
```

```css
@supports (animation-name: test) {

  a {
    color: aquamarine;

  }

}
```

```css
@keyframes test {

  100% {
    color: aquamarine;

  }

}
```

The following patterns are _not_ considered problems:

```css
@media print {

  a {
    color: aquamarine;

  }
}
```

```css
@font-face {
  font-family: "MyFont";
  src: url("myfont.woff2") format("woff2");

}
```

```css
@supports (animation-name: test) {

  a {
    color: aquamarine;

  }
}
```

```css
@keyframes test {

  100% {
    color: aquamarine;

  }
}
```
