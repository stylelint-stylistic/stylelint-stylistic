# named-grid-areas-alignment

Require cell tokens (and optionally ending quotes) within the rows of `grid-template-areas`, and of the `grid-template` and `grid` shorthands, to be aligned.

```css
div {
  grid-template-areas: 'column a-long-one bar'
                       'cell   .          bar'
/**                                ↑
 *                      This "table" alignment 
 */
}
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix all of the problems reported by this rule.

The [`message` secondary option](https://stylelint.io/user-guide/configure/#message) can accept the arguments of this rule.

The rows of the `grid-template` and `grid` shorthands are read as the longhand's are: every string at the top level of the value is a row, and its cells are aligned with the cells of the other rows. A shorthand puts a row's size and its line names beside each string and the columns behind a solidus, and the rule reads none of that — everything that is no row goes back as the file spells it — so a size standing behind a row moves with the row's closing quote, which `alignQuotes` lines up, while a line name in front of a row, the solidus and the columns behind it keep the place and the whitespace the author gave them:

```css
div {
  grid-template:
    [header-left] "head head" minmax(30px, 1fr) [header-right]
                  "nav  main" 1fr               [main-right]
    [footer]      "nav  foot" 30px
    / 120px 1fr;
}
```

Whether the solidus opens a line of its own or closes the last row's is not this rule's to decide, and neither is the column the rows open on.

A declaration spans lines when a line break stands in its value outside every row. Everything of the value that is no row is handed back character for character, wherever it stands and whatever it is — the whitespace in front of the first row, between two of them or behind the last, a comment, a call, a word carrying an escaped break — so a break written in any of them is one the fix leaves. A break standing inside a row is not one of those: the fix collapses the whitespace of a row, that break with it, so the row comes back on one line.

A row holding no cell token at all is aligned to nothing: the whitespace inside it is taken away and the row is written back with nothing between its quotation marks, keeping the place the author gave it. Under `alignQuotes` in a declaration spanning lines it is padded to the width of the others instead, so that its closing quote lines up with theirs.

A cell is measured in the characters it is written with rather than in the code units JavaScript stores them in, so a character outside the Basic Multilingual Plane counts once, as the one column it stands on. What is counted is code points and not what an editor draws: a grapheme cluster spelled with several of them counts as several, and a character drawn two columns wide counts as one.

## Options

### `true`

The following patterns are considered problems:

```css
/* ❌ Not aligned cell tokens */

div {
  grid-template-areas: 
    'a a a'
    'bb bb bb';
}
```

```css
/* ❌ Inconsistent spacing between cell tokens */

div {
  grid-template-areas: 'a a    a  a';
}
```

The following patterns are _not_ considered problems:

```css
/* ✅ Aligned cell tokens */

div {
  grid-template-areas: 
    'a  a  a'
    'bb bb bb'
}
```

```css
/* ✅ Consistent spacing between cell tokens */

div {
  grid-template-areas: 'a a a a'
}
```

## Optional secondary options

### `gap: number`

Specifies the number of spaces between cell tokens (default is `1`).

**Given rule configuration: `named-grid-areas-alignment: [true, { gap: 2 }]`**

The following patterns are considered problems:

```css
/* ❌ Single space between cell tokens */

div {
  grid-template-areas: 
    'a  a  a'
    'bb bb bb'
}
```

The following patterns are _not_ considered problems:

```css
/* ✅ Two spaces between cell tokens */

div {
  grid-template-areas: 
    'a   a   a'
    'bb  bb  bb'
}
```

### `alignQuotes: boolean`

Whether to align an ending quotes (default is `false`).

**Given rule configuration: `named-grid-areas-alignment: [true, { alignQuotes: true }]`**

The following patterns are considered problems:

```css
/* ❌ Ending quotes are not aligned */

div {
  grid-template-areas: 
    'a        a'
    'foo      foo'
    'long-one long-one'
}
```

The following patterns are _not_ considered problems:

```css
/* ✅ Ending quotes are properly aligned */

div {
  grid-template-areas: 
    'a        a       '
    'foo      foo     '
    'long-one long-one'
}
```
