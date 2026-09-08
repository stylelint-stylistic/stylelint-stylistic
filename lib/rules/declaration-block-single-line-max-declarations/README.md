# declaration-block-single-line-max-declarations

Limit the number of declarations within a single-line declaration block.

```css
a { color: pink; top: 0; }
/** ↑            ↑
 * The number of these declarations */
```

This is the one stylistic rule Stylelint 16 kept when it removed the others, and Stylelint 18 removes it in its turn; under the `@stylistic/` prefix it reports as it did there, with the same option (see [#639](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/639)).

A block is single-line where nothing between its braces breaks a line. What is counted is what the parser files as a declaration: a custom property counts, while a nested rule, a nested at-rule and a comment do not, and the declarations of a nested rule count to that rule's own block. The block of an at-rule, `@font-face` for one, is read as a rule's is, unlike in Stylelint's rule (see [#640](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/640)); an at-rule holding rules and no declaration of its own, `@media screen { a { color: pink; } }`, is a block of no declarations, and an at-rule without a block is nothing to count.

Under `--fix` this rule takes its turn after the rules that write line breaks, so it reports the blocks the fixed file holds on one line.

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix most of the problems reported by this rule (see [#641](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/641)). It breaks the block over lines: one for each declaration, nested rule and at-rule in it, and one for the closing brace, while a comment stays on the line of what it follows. Each of those runs is written as the rules about it ask wherever the configuration lists one of them — `block-opening-brace-newline-after` and `block-opening-brace-space-after` behind the opening brace, `declaration-block-semicolon-newline-after` and `declaration-block-semicolon-space-after` behind a semicolon, `block-closing-brace-newline-after` and `block-closing-brace-space-after` behind a nested block's closing brace, `block-closing-brace-newline-before` and `block-closing-brace-space-before` in front of the block's own — and as a line break where it lists none. The indentation of the new lines is the `indentation` rule's to write, which it does in the same run where it is configured; without it the lines stand unindented. A configuration under which none of those runs gets a line break — the three `never-multi-line` options at once, for one — leaves the block on one line whatever the fix writes, so the problem is reported and the block left as it is.

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
