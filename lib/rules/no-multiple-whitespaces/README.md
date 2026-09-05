# no-multiple-whitespaces

Disallow multiple whitespaces.

```css
.foo { background: linear-gradient(rgb(0··0··0), white)··no-repeat }
/**                                      ↑  ↑           ↑
 *                                       These whitespaces
 */
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix most of the problems reported by this rule.

Where the configuration lists the [`named-grid-areas-alignment`](../named-grid-areas-alignment/README.md) rule with its `alignColumns` option, the runs between the tokens of a line of a `grid-template` or `grid` shorthand that holds a row are that rule's, which pads them into columns, and this rule leaves them alone — whichever order the two are listed in, and whether that rule's fix is on or not. Every other run of such a value, the one in front of the solidus among them, is read as before.

## Options

### `true`

The following patterns are considered problems:

```css
a { gap: 1em  2em }
```

```css
a { transform: translate(50%,  50%) }
```

```css
a { aspect-ratio: 1  /  2 }
```

```css
a { border: 1px  solid   black }
```

```css
a { color: rgb(0  0   0    /    0) }
```

The following patterns are _not_ considered problems:

```css
a { gap: 1em 2em }
```

```css
a { transform: translate(50%, 50%) }
```

```css
a { aspect-ratio: 1 / 2 }
```

```css
a { border: 1px solid black }
```

```css
a { color: rgb(0 0 0 / 0) }
```
