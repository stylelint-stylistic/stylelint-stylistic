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

Whether the solidus opens a line of its own or closes the last row's is not this rule's to decide, and neither is the column the rows open on. The `alignColumns` option below lays the sizes and the line names out as columns of their own.

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

### `alignColumns: boolean`

Whether the line names and the sizes beside the rows of a `grid-template` or `grid` shorthand are laid out as columns of a table (default is `false`).

Every line of the value that holds one row is read as four columns — the line names in front of the row, the row, its size, and the line names behind it — and every column is as wide as the widest text standing in it. The padding is written between the tokens of a line and never in front of its first one: the first token of every line stands where the indentation puts it, so the indentation stays what the [`indentation`](../indentation/README.md) rule asks for, and a row that has no line name in front of it stands at the indentation while its size and its closing names still reach their columns. Two names of one line stand a single space apart. The solidus and the columns behind it, a comment and everything behind it on its line, and a line holding two rows or none are left as they stand, and so is a value that spans no line outside its rows — the longhand has nothing to lay out.


Where the configuration lists this option, the [`no-multiple-whitespaces`](../no-multiple-whitespaces/README.md) rule leaves the runs between the tokens of such a line alone, whichever order the two rules are listed in and whether this rule's fix is on or not; a run standing anywhere else in the value, in front of the solidus for one, is that rule's as before. The padding lengthens a line, which [`max-line-length`](../max-line-length/README.md) may report.

Under `alignQuotes` the padding of a short row stands inside its quotation marks, and the sizes line up behind the closing quotes; without it the padding stands behind the closing quote, and the sizes line up all the same.

**Given rule configuration: `named-grid-areas-alignment: [true, { alignColumns: true }]`**

The following patterns are considered problems:

```css
/* ❌ Line names, rows and sizes not laid out as columns */

div {
  grid-template:
    [header-left] "head head" minmax(30px, 1fr) [header-right]
    [] "nav main" 1fr [main-right]
    [footer] "nav foot" 30px
    / 120px 1fr;
}
```

The following patterns are _not_ considered problems:

```css
/* ✅ Every column laid out */

div {
  grid-template:
    [header-left] "head head" minmax(30px, 1fr) [header-right]
    []            "nav  main" 1fr               [main-right]
    [footer]      "nav  foot" 30px
    / 120px 1fr;
}
```

```css
/* ✅ A row without a line name in front of it, standing at the indentation */

div {
  grid-template:
    [header-left] "head head" 30px [header-right]
    "nav  main"               1fr  [main-right]
    / 120px 1fr;
}
```

#### A row without a line name

The rule never writes in front of the first token of a line, so a row that has no line name in front of it cannot be moved under the rows that have one: it stays at the indentation, and only its size and the names behind it reach their columns, as the last example above shows. To put such a row under the others, give it an empty list of line names, `[]`. The grammar of `<line-names>` is `'[' <custom-ident>* ']'`, a list of no names included; `lightningcss` 1.33 compiles `grid-template: [] "a a" 1fr / auto` with the brackets dropped, Sass hands them through, and the `[]` behind the names closing the row above merges with them, so the grid is the one it was:

```css
/* ✅ The same grid, its second row given an empty list of line names and laid out under the first */

div {
  grid-template:
    [header-left] "head head" 30px [header-right]
    []            "nav  main" 1fr  [main-right]
    / 120px 1fr;
}
```

The rule writes no `[]` itself: it writes whitespace and nothing else, and whether the column of the names is worth an empty list is the author's to decide. **Less does not read an empty list**: Less 4.9.1 refuses `[]` and `[ ]` alike as unrecognised input, so a stylesheet written in Less keeps such a row at the indentation, and the [`less` namespace](../../syntaxes/less/README.md) says so.
