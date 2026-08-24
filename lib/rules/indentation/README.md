# indentation

Specify indentation.

```css
   |@media print {
   |  a {
   | ↑  background-position: top left,
   | ↑ ↑  top right;
   | ↑}↑ ↑
   |}↑ ↑ ↑
/**  ↑ ↑ ↑
 * The indentation at these three points */
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix all of the problems reported by this rule.

The [`message` secondary option](https://stylelint.io/user-guide/configure/#message) can accept the arguments of this rule.

## Options

`int|"tab"`, where `int` is the number of spaces

### `2`

Always indent at-rules, rules, comments, declarations, inside parentheses and multi-line values by 2 spaces.

The following patterns are considered problems:

```css
@media print {
a {
background-position: top left,
top right;
}
}
```

```css
@media print {
a {
  background-position: top left,
    top right;
  }
}
```

```css
@media print {
  a {
    background-position: top left,
    top right;
  }
}
```

```css
@media print {
  a,
    b {
    background-position: top left,
      top right;
  }
}
```

```css
a {
/* blergh */
  color: pink;
}
  /* blergh */
```

```css
@media print,
(-webkit-min-device-pixel-ratio: 1.25),
(min-resolution: 120dpi) {}
```

```css
a {
  color: rgb(
  255,
  255,
  255
  );
  top: 0;
}
```

```css
@media (min-width: 100px
  ) {}
```

The following patterns are _not_ considered problems:

```css
@media print {
  a {
    background-position: top left,
      top right;
  }
}
```

```css
@media print {
  a,
  b {
    background-position: top left,
      top right;
  }
}
```

```css
a {
  /* blergh */
  color: pink;
}
/* blergh */
```

```css
@media print,
  (-webkit-min-device-pixel-ratio: 1.25),
  (min-resolution: 120dpi) {}
```

```css
a {
  color: rgb(
    255,
    255,
    255
  );
  top: 0;
}
```

```css
@media (min-width: 100px
) {}
```

A closing bracket standing at the beginning of a line is indented one level out from the lines inside the brackets — but only while a bracket opened at the end of a line is still open. A bracket opened in the middle of a line indents nothing, so the one closing it asks for the outermost level of the selector, the value or the set of parameters it belongs to: the first column for an at-rule at the root, the level of the at-rule itself for one nested in a rule, the level of the declaration for a value. This holds for the brace of a Sass interpolation as it does for a parenthesis, save under `indentClosingBrace` below: that option keeps a closing parenthesis at the level of the lines inside the parentheses, and has never been asked about a brace.

That outermost level is the level of the node itself wherever the text is measured there rather than one level above it: `@nest` and Sass's `@at-root`, whose parameters are a selector, and anything the `except` option below takes a level away from. The brackets inside such a text still indent the lines they open, since `except` is about the level of the text and not about what stands inside it.

## Optional secondary options

### `baseIndentLevel: int|"auto"`

By default, the indent level of the CSS code block in non-CSS-like files is determined by the shortest indent of non-empty line. The setting `baseIndentLevel` allows you to define a relative indent level based on CSS code block opening or closing line.

For example, with `[ 2, { baseIndentLevel: 1 } ]`, CSS should be indented 1 levels higher than `<style>` tag:

```html
<!doctype html>
<html lang="en">
  <head>
    <style>
      a {
        display: block;
      }
    </style>
  </head>
</html>
```

### `indentInsideParens: "twice"|"once-at-root-twice-in-block"`

By default, _one extra_ indentation (of your specified type) is expected after newlines inside parentheses, and the closing parenthesis is expected to have no extra indentation.

If you would like to change the quantity of extra indentation inside parentheses, use this option.

`"twice"` means you expect two extra indentations (of your specified type) after newlines inside parentheses, and expect the closing parenthesis to have one extra indentation. For example:

```css
a {
  color: rgb(
      255,
      255,
      255
    );
  top: 0;
}
```

`"once-at-root-twice-in-block"` means two things: You want the behavior of `"once"`, as documented above, when the parenthetical expression is part of a node that is an immediate descendent of the root — i.e. not inside a block. And you want the behavior of `"twice"`, as documented above, when the parenthetical expression is part of a node that is inside a block. For example:

```css
@import (
  "foo.css"
);

a {
  color: rgb(
      255,
      255,
      255
    );
  top: 0;
}
```

### `indentClosingBrace: true|false`

If `true`, the closing brace of a block (rule or at-rule) will be expected at the same indentation level as the block's inner nodes.

For example, with `indentClosingBrace: true`.

The following patterns are considered problems:

```css
a {
  color: pink;
}
```

```css
@media print {
  a {
    color: pink;
  }
}
```

The following patterns are _not_ considered problems:

```css
a {
  color: pink;
  }
```

```css
@media print {
  a {
    color: pink;
    }
  }
```

### `except: ["block", "param", "value"]`

Do _not_ indent for these things.

For example, with `2`.

The following patterns are considered problems:

```css
@media print,
  (-webkit-min-device-pixel-ratio: 1.25),
  (min-resolution: 120dpi) {
  a {
    background-position: top left,
      top right;
  }
}
```

The following patterns are _not_ considered problems:

```css
@media print,
(-webkit-min-device-pixel-ratio: 1.25),
(min-resolution: 120dpi) {
a {
background-position: top left,
top right;
}
}
```

### `ignore: ["inside-parens", "param", "value"]`

#### `"inside-parens"`

Ignore the indentation inside parentheses.

For example, with `2`.

The following patterns are _not_ considered problems:

```css
a {
  color: rgb(
255,
  255,
    255
  );
  top: 0;
}
```

#### `"param"`

Ignore the indentation of at-rule params.

For example, with `2`.

The following patterns are _not_ considered problems:

```css
@media print,
  (-webkit-min-device-pixel-ratio: 1.25),
    (min-resolution: 120dpi) {
}
```

#### `"value"`

Ignore the indentation of values.

For example, with `2`.

The following patterns are _not_ considered problems:

```css
a {
  background-position: top left,
top right,
  bottom left,
    bottom right;
}
```
