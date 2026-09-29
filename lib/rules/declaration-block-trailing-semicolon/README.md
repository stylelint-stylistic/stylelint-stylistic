# declaration-block-trailing-semicolon

Require or disallow a trailing semicolon within declaration blocks.

```css
a { background: orange; color: pink; }
/**                                ↑
 *                    This semicolon */
```

The trailing semicolon is the _last_ semicolon in a declaration block and it is optional.

Nothing is asked of a declaration block that a nested rule closes, nor of one closed by an at-rule carrying a block. A block holding such a node anywhere but at its end is read like any other, its own closing node being what the rule asks about.

Nothing is asked of the top level of a stylesheet, except the root of an inline `style` attribute, which is a declaration block; an at-rule standing there is passed over all the same.

The semicolon `"always"` writes is spaced as the `declaration-block-semicolon-newline-before` and `declaration-block-semicolon-space-before` rules ask, and as `at-rule-semicolon-space-before` asks behind an at-rule.

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix most of the problems reported by this rule. Where a `//` comment runs to the end of a value, `"always"` writes the semicolon in front of the comment.

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

The following patterns are _not_ considered problems:

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

The following patterns are _not_ considered problems:

```css
a { color: pink }
```

```css
a { background: orange; color: pink }
```

## Optional secondary options

### `ignore: ["single-declaration"]`

Ignore declaration blocks that hold a single node other than a comment.

A comment is a node of the block and nothing the block is about, so it is not counted, however many comments stand in the block and on whichever side of that node they stand. Everything else the block holds is counted, whatever kind of node it is: a bodiless at-rule standing alone in a block is that block's single node, exactly as a declaration standing alone in one is, and a nested rule standing beside a declaration is a second node, so that block holds two.

For example, with `"always"`.

The following patterns are _not_ considered problems:

```css
a { color: pink }
```

```css
a { /* comment */ color: pink }
```

```css
a { color: pink /* comment */ }
```

```css
a { @include foo }
```

The following patterns are still considered problems:

```css
a { background: orange; color: pink }
```

```css
a { /* comment */ background: orange; color: pink }
```

```css
a { b { top: 0; } color: pink }
```
