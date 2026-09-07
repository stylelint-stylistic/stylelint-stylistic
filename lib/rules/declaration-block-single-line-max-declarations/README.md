# declaration-block-single-line-max-declarations

Limit the number of declarations within a single-line declaration block.

```css
a { color: pink; top: 0; }
/** ↑            ↑
 * The number of these declarations */
```

This is the one stylistic rule Stylelint 16 kept when it removed the others, and Stylelint 18 removes it in its turn; under the `@stylistic/` prefix it reads and reports as it did there, with the same option (see [#639](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/639)).

A block is single-line where nothing between its braces breaks a line. What is counted is what the parser files as a declaration: a custom property counts, while a nested rule, a nested at-rule and a comment do not, and the declarations of a nested rule count to that rule's own block. The block of an at-rule, `@font-face` for one, is not read.

Under `--fix` this rule takes its turn after the rules that write line breaks, so it reports the blocks the fixed file holds on one line.

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
