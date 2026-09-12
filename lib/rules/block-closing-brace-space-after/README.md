# block-closing-brace-space-after

Require a single space or disallow whitespace after the closing brace of blocks.

```css
a { color: pink; }
/**              ↑
 * The space after this brace */
```

This rule allows a trailing semicolon after the closing brace of a block. For example,

```css
:root {
  --toolbar-theme: {
    background-color: hsl(120, 70%, 95%);
  };
/* ↑
 * This semicolon */
}
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix most of the problems reported by this rule. It writes nothing where `block-closing-brace-newline-after` asks for something else of the same run and either writes it last or was already content with the run as it stands, nor where a stray semicolon stands inside the run itself rather than behind the brace. The warning stands in both.

## Options

`string`: `"always"|"never"|"always-single-line"|"never-single-line"|"always-multi-line"|"never-multi-line"`

### `"always"`

There _must always_ be a single space after the closing brace.

The following patterns are considered problems:

```css
a { color: pink; }b { color: red; }
```

```css
a { color: pink; }
b { color: red; }
```

The following patterns are _not_ considered problems:

```css
a { color: pink; } b { color: red; }
```

### `"never"`

There _must never_ be whitespace after the closing brace.

The following patterns are considered problems:

```css
a { color: pink; } b { color: red; }
```

```css
a { color: pink; }
b { color: red; }
```

The following patterns are _not_ considered problems:

```css
a { color: pink; }b { color: red; }
```

```css
a { color: pink;
}b { color: red; }
```

### `"always-single-line"`

There _must always_ be a single space after the closing brace in single-line blocks.

The following patterns are considered problems:

```css
a { color: pink; }b { color: red; }
```

The following patterns are _not_ considered problems:

```css
a { color: pink; } b { color: red; }
```

```css
a { color: pink;
}b { color: red; }
```

### `"never-single-line"`

There _must never_ be whitespace after the closing brace in single-line blocks.

The following patterns are considered problems:

```css
a { color: pink; } b { color: red; }
```

The following patterns are _not_ considered problems:

```css
a { color: pink; }b { color: red; }
```

```css
a { color: pink;
} b { color: red; }
```

### `"always-multi-line"`

There _must always_ be a single space after the closing brace in multi-line blocks.

The following patterns are considered problems:

```css
a { color: pink;
}b { color: red; }
```

The following patterns are _not_ considered problems:

```css
a { color: pink; }b { color: red; }
```

```css
a { color: pink;
} b { color: red; }
```

### `"never-multi-line"`

There _must never_ be whitespace after the closing brace in multi-line blocks.

The following patterns are considered problems:

```css
a { color: pink;
} b { color: red; }
```

The following patterns are _not_ considered problems:

```css
a { color: pink; } b { color: red; }
```

```css
a { color: pink;
}b { color: red; }
```
