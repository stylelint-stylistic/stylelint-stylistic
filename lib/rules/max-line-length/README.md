# max-line-length

Limit the length of a line.

```css
a { color: red }
/**            ↑
 *       The end */
```

Lines that exceed the maximum length but contain no whitespace (other than at the beginning of the line) are ignored.

When evaluating the line length, the arguments of any `url(...)` functions are excluded from the calculation, because typically you have no control over the length of these arguments. This means that long `url()` functions should not contribute to problems.

The [`message` secondary option](https://stylelint.io/user-guide/configure/#message) can accept the arguments of this rule.

## Options

`int`: Maximum number of characters allowed.

For example, with `20`:

The following patterns are considered problems:

```css
a { color: 0; top: 0; }
```

```css
a {
  background: linear-gradient(red, blue);
}
```

The following patterns are _not_ considered problems:

```css
a {
  color: 0;
  top: 0;
}
```

```css
a {
  background: url(a-url-that-is-over-20-characters-long);
}
```

## Optional secondary options

### `ignore: ["non-comments"]`

Only enforce the line-length limit for lines within comments.

This does not apply to comments that are stuck in between other stuff, only to lines that begin at the beginning or in the middle of a comment.

For example, with a maximum length of `30`.

The following patterns are considered problems:

Each have only one problem.

```css
/* This line is too long for my rule */
a { color: pink; background: orange; }
a { color: pink; /* this comment is also long but not on its own line */ }
```

```css
a { color: pink; background: orange; }
/**
 * This line is short,
 * but this line is too long for my liking,
 * though this one is fine
 */
a { color: pink; /* this comment is also long but not on its own line */ }
```

### `ignore: ["comments"]`

Only enforce the line-length limit for lines that are not comments.

This also applies to comments that are between code on the same line.

For example, with a maximum length of `30`.

The following patterns are considered problems:

```css
a { color: pink; } /* comment that is too long */
```

```css
a { /* this comment is too long for the max length */ }
```

The following patterns are _not_ considered problems:

```css
/* comment that is too long for my rule*/
a { color: pink; }
```

```css
/*
 * comment that is too long the max length
 * comment that is too long the max length
 *
 */
a { color: pink; }
```

### `ignorePattern: "/regex/"`

Ignore any line that matches the given regex pattern, regardless of whether it is comment or not. The regex may be passed as a string (for JSON configuration) by enclosing in forward-slashes, or an ordinary JavaScript RegExp may be used.

Given:

```json
"/^@import\\s+/"
```

The following pattern is _not_ considered a problem:

```css
@import "../../../../another/css/or/scss/file/or/something.css";
```

Given the following, with a maximum length of `20`.

```js
["/https?://[0-9,a-z]*.*/"];
```

The following pattern is _not_ considered a problem:

```css
/* ignore urls https://www.example.com */
```

### `tabSize: int`

Measure a tab as reaching the next tab stop of the given width, the way an editor with that tab size shows it, instead of as a single character.

The option is named after the CSS `tab-size` property and counts the way it does: a tab takes as many columns as are left up to the next tab stop, so a tab standing in the middle of a line may take fewer than a whole tab size. Without the option a tab is one character like any other, and a file indented with tabs measures shorter than it looks in the editor, which is what the option is for alongside `indentation: "tab"`.

For example, with a maximum length of `20` and `tabSize: 4`.

The following pattern is considered a problem, the second line being indented with two tabs and measuring 8 + 13 = 21 columns:

```css
a {
		color: black;
}
```

The following patterns are _not_ considered problems, the first measuring 8 + 12 = 20 columns and the second 3 + 1 + 14 = 18, since its tab reaches the next tab stop after one column:

```css
a {
		color: pink;
}
```

```css
a {	color: pink; }
```
