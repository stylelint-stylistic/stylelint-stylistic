# named-grid-areas-alignment

Require cell tokens (and optionally ending quotes) within `grid-template-areas` to be aligned.

```css
div {
  grid-template-areas: 'column a-long-one bar'
                       'cell   .          bar'
/**                                ↑
 *                      This "table" alignment 
 */
}
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix all of the problems reported by this rule.

## Options

### `true`

The following patterns are considered problems:

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

The following patterns are _not_ considered problems:

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

Specifies the number of spaces between cell tokens (default is `1`).

**Given rule configuration: `named-grid-areas-alignment: [true, { gap: 2 }]`**

The following patterns are considered problems:

```css
/* ❌ Single space between cell tokens */

div {
  grid-template-areas: 
    'a  a  a'
    'bb bb bb'
}
```

The following patterns are _not_ considered problems:

```css
/* ✅ Two spaces between cell tokens */

div {
  grid-template-areas: 
    'a   a   a'
    'bb  bb  bb'
}
```

### `alignQuotes: boolean`

Whether to align an ending quotes (default is `false`).

**Given rule configuration: `named-grid-areas-alignment: [true, { alignQuotes: true }]`**

The following patterns are considered problems:

```css
/* ❌ Ending quotes are not aligned */

div {
  grid-template-areas: 
    'a        a'
    'foo      foo'
    'long-one long-one'
}
```

The following patterns are _not_ considered problems:

```css
/* ✅ Ending quotes are properly aligned */

div {
  grid-template-areas: 
    'a        a       '
    'foo      foo     '
    'long-one long-one'
}
```
