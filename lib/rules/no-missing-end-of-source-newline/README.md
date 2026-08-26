# no-missing-end-of-source-newline

Disallow missing end-of-source newlines.

```css
    a { color: pink; }
    \n
/** ↑
 * This newline */
```

Completely empty files are not considered problems.

A line feed, a carriage return and a form feed each end a line, so a file ending in any of the three already has its end-of-source newline. Where none of them ends the file, the fix writes the break the file spells its lines with. A file that spells none — one written on a single line, or one whose only breaks stand inside a comment or a string — is closed with the break Stylelint hands the rule instead: a line feed or a Windows pair found anywhere in the text, comments and strings included, and the line ending of the machine where the text holds neither.

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix all of the problems reported by this rule.

## Options

### `true`

The following patterns are considered problems:

```css
a { color: pink; }
```

The following patterns are _not_ considered problems:

```css
a { color: pink; }
\n
```
