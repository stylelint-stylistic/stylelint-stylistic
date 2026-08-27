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

The break is written behind whatever the file ends on rather than in place of it, so a free semicolon standing behind the last block, the whitespace around it, and an empty line the file ends on are all left where the author put them. Whether such a semicolon belongs in a stylesheet is what `no-extra-semicolons` says, how many empty lines a file may end on is what `max-empty-lines` says, and whitespace at the end of a line is what `no-eol-whitespace` says. One thing does come off: a run of spaces and tabs standing on its own behind the file's last line break. Such a file has ended its last line already, and a break written behind that run would leave it an empty line it never had. It comes off only where the raw the fix writes into and the file the warning was made about agree that it is what the file ends on, and a break is written wherever the two part — the raw because it is the only place a fix can write, the file because a rule listed ahead of this one may have written into that raw already.

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
