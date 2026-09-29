# declaration-block-single-line-max-declarations

Limit the number of declarations within a single-line declaration block.

```css
a { color: pink; top: 0; }
/** ↑            ↑
 * The number of these declarations */
```

A block is single-line when nothing between its braces breaks a line. Every declaration in it counts, custom properties included, while nested rules, nested at-rules and comments do not; a nested rule's declarations count toward its own block. An at-rule's block, `@font-face` for one, is counted as a rule's is, and an at-rule without a block is ignored.

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix most of the problems reported by this rule. It puts each declaration, nested rule and at-rule of the block on a line of its own, and the closing brace too, while a comment stays on the line of what it follows. The whitespace it writes is what the configured `block-opening-brace-*-after`, `declaration-block-semicolon-*-after` and `block-closing-brace-*-before` rules ask for, and `block-closing-brace-*-after` behind the closing brace of a nested block, and a line break where none of them is configured; indentation is left to the `indentation` rule. Under `--fix` the rule reports only the blocks the fixed file still holds on one line, as it does where those rules allow no line break at all — the three `never-multi-line` options at once, for one.

The [`message` secondary option](https://stylelint.io/user-guide/configure/#message) can accept the arguments of this rule.

## Options

`int`: Maximum number of declarations allowed.

For example, with `1`:

The following patterns are considered problems:

```css
a { color: pink; top: 3px; }
```

```css
a,
b { color: pink; top: 3px; }
```

```css
@font-face { font-family: x; src: y; }
```

The following patterns are _not_ considered problems:

```css
a { color: pink; }
```

```css
a,
b { color: pink; }
```

```css
a {
  color: pink;
  top: 3px;
}
```

```css
@media screen { a { color: pink; } }
```
