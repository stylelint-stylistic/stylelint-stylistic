# declaration-block-trailing-semicolon

Require or disallow a trailing semicolon within declaration blocks.

```css
a { background: orange; color: pink; }
/**                                ↑
 *                    This semicolon */
```

The trailing semicolon is the _last_ semicolon in a declaration block and it is optional.

Nothing is asked of a declaration block that a nested rule closes, nor of one closed by an at-rule carrying a block. A block holding such a node anywhere but at its end is read like any other, its own closing node being what the rule asks about. A Less mixin call is no such node — `postcss-less` reads it as an at-rule with no block of its own — and Less asks for the semicolon behind a call no more than CSS asks for it behind a declaration, so a call closing its block is read like any other node closing a block.

The top level of a stylesheet is no declaration block, so nothing is asked of a node standing there. The semicolon behind the last node of a file is as optional as a block's trailing one — dart-sass compiles a file ending in `$var: pink` — and this rule is named for the one a declaration block ends on. The root of an inline `style` attribute is the one exception, since the value of such an attribute is a declaration block and nothing else; an at-rule stands outside that exception all the same, an attribute having no place for one.

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix the problems reported by this rule, except the ones a comment leaves the semicolon nowhere to stand in: `"always"` writes none behind a value or a set of parameters that a `//` comment runs to the end of, since the semicolon would land inside the comment, and `"never"` takes none away from behind a bodiless at-rule or a custom property that a comment closes the block behind, since that is a semicolon PostCSS writes back whatever the stylesheet asks for. Under Less, `"never"` takes none away from behind an at-rule carrying no block of its own either: Less reads such an at-rule as running to its semicolon, so `a { @extend .b }` is `@extend rule is missing block or ending semi-colon` to it, where Sass and plain CSS part with that semicolon as readily as with a declaration's. A mixin call is not an at-rule to Less, and neither is a call to a detached ruleset spelled `@name()` and nothing else; the semicolon behind either is taken away as it always was. Anything behind those parentheses — a comment, a lookup — puts the call back among the at-rules here, and its semicolon is left standing with theirs. A Less variable declaration is one to Less and is left alone here all the same: telling it from an at-rule means reading its value the way Less reads it, and Less asks that the whole of that value parse as an expression of its own, so `a { @v: pink; }` is now reported and left as it stands. A declaration Less reads no value in — `a { color: }`, `a { --x: }` — it refuses just as readily, and that semicolon this rule still takes away.

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

Ignore declaration blocks that hold a single node other than a comment.

A comment is a node of the block and nothing the block is about, so it is not counted, however many comments stand in the block and on whichever side of that node they stand. Everything else the block holds is counted, whatever kind of node it is: a bodiless at-rule standing alone in a block is that block's single node, exactly as a declaration standing alone in one is, and a nested rule standing beside a declaration is a second node, so that block holds two.

For example, with `"always"`.

The following patterns are _not_ considered problems:

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
