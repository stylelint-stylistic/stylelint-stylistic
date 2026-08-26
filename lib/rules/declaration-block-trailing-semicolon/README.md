# declaration-block-trailing-semicolon

Require or disallow a trailing semicolon within declaration blocks.

```css
a { background: orange; color: pink; }
/**                                ↑
 *                    This semicolon */
```

The trailing semicolon is the _last_ semicolon in a declaration block and it is optional.

This rule ignores declaration blocks containing nested (at-)rules. A Less mixin call is not one of them: Less asks for the semicolon behind a call no more than CSS asks for it behind a declaration, so a call closing its block is read like any other node closing a block.

The top level of a stylesheet is no declaration block, so nothing is asked of a node standing there. The semicolon behind the last node of a file is as optional as a block's trailing one — dart-sass compiles a file ending in `$var: pink` — and this rule is named for the one a declaration block ends on. The root of an inline `style` attribute is the one exception, since the value of such an attribute is a declaration block and nothing else; an at-rule stands outside that exception all the same, an attribute having no place for one.

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix the problems reported by this rule, except the ones a comment leaves the semicolon nowhere to stand in: `"always"` writes none behind a value or a set of parameters that a `//` comment runs to the end of, since the semicolon would land inside the comment, and `"never"` takes none away from behind a bodiless at-rule or a custom property that a comment closes the block behind, since that is a semicolon PostCSS writes back whatever the stylesheet asks for.

## Options

`string`: `"always"|"never"`

### `"always"`

There _must always_ be a trailing semicolon.

The following patterns are considered problems:

```css
a { color: pink }
```

```css
a { background: orange; color: pink }
```

```css
a { @include foo }
```

The following patterns are _not_ considered problems:

```css
a { color: pink; }
```

```css
a { background: orange; color: pink; }
```

```css
a { @include foo; }
```

### `"never"`

There _must never_ be a trailing semicolon.

The following patterns are considered problems:

```css
a { color: pink; }
```

```css
a { background: orange; color: pink; }
```

```css
a { color: pink;; }
```

The following patterns are _not_ considered problems:

```css
a { color: pink }
```

```css
a { background: orange; color: pink }
```

## Optional secondary options

### `ignore: ["single-declaration"]`

Ignore declaration blocks that contain a single declaration.

The following patterns are _not_ considered problems:

```css
a { color: pink }
```

```css
a { color: pink; }
```
