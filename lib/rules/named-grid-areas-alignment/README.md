# named-grid-areas-alignment

Require cell tokens (and optionally ending quotes) within `grid-template-areas` to be aligned.

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

A declaration spans lines when a line break stands in its value outside every row. Everything of the value that is no row is handed back character for character, wherever it stands and whatever it is — the whitespace in front of the first row, between two of them or behind the last, a comment, a call, a word carrying an escaped break — so a break written in any of them is one the fix leaves. A break standing inside a row is not one of those: the fix collapses the whitespace of a row, that break with it, so the row comes back on one line.

A row holding no cell token at all is aligned to nothing: the whitespace inside it is taken away and the row is written back with nothing between its quotation marks, keeping the place the author gave it. Under `alignQuotes` in a declaration spanning lines it is padded to the width of the others instead, so that its closing quote lines up with theirs.

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
