# max-empty-lines

Limit the number of adjacent empty lines.

```css
a {}
     /* ← */
     /* ← */
a {} /* ↑ */
/**     ↑
 * These lines */
```

Where the option allows an empty line at all, the one a file ends on is counted like any other, and a run of spaces or tabs written behind the last line break does not hide it: such a run is a line of its own, and emptying it is what `no-eol-whitespace` is for. So a file closed by two line breaks is measured the same whether or not spaces follow them. The `0` option counts no line at the end of the file to begin with, and a file closed by a single break is no problem to it.

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix all of the problems reported by this rule.

The [`message` secondary option](https://stylelint.io/user-guide/configure/#message) can accept the arguments of this rule.

## Options

`int`: Maximum number of adjacent empty lines allowed.

For example, with `2`:

The following patterns are considered problems:

```css
a {}



b {}
```

Comment strings are also checked -- so the following is a problem:

```css
/*
 Call me Ishmael.



 Some years ago--never mind how long precisely-—...
 */
```

The following patterns are _not_ considered problems:

```css
a {}
b {}
```

```css
a {}

b {}
```

```css
a {}


b {}
```

## Optional secondary options

### `ignore: ["comments"]`

Only enforce the adjacent empty lines limit for lines that are not comments.

For example, with `2` adjacent empty lines:

The following patterns are considered problems:

```css
/* horse */
a {}



b {}
```

The following patterns are _not_ considered problems:

```css
/*
 Call me Ishmael.



 Some years ago -- never mind how long precisely -- ...
 */
```

```css
a {
    /*
     Comment




     inside the declaration with a lot of empty lines...
    */
     color: pink;
}
```
