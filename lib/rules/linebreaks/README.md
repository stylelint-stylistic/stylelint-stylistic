# linebreaks

Specify unix or windows linebreaks.

The setting is read by every other rule that writes a line break — one behind a brace, a comma, a colon or a semicolon — so a break such a rule writes is spelled as this rule asks for from the start, whatever order the configuration lists the rules in. Without this rule, those rules spell a break the way the file spells its lines, and a file that ends no line at all is given a line feed.

A bare carriage return and a form feed are whitespace to this rule, as they are to PostCSS: only a line feed, alone or behind a carriage return, is a line break.

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix all of the problems reported by this rule.

The [`message` secondary option](https://stylelint.io/user-guide/configure/#message) can accept the arguments of this rule.

## Options

`string`: `"unix"|"windows"`

### `"unix"`

Linebreaks _must always_ be LF (`\n`).

Lines with CRLF linebreaks are considered problems.

### `"windows"`

Linebreaks _must always_ be CRLF (`\r\n`).


Lines with LF linebreaks are considered problems.
