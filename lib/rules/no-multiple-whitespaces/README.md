# no-multiple-whitespaces

Disallow multiple whitespaces.

```css
.foo { background: linear-gradient(rgb(0··0··0), white)··no-repeat }
/**                                      ↑  ↑           ↑
 *                                       These whitespaces
 */
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix most of the problems reported by this rule.

## Options

### `true`

The following patterns are considered problems:

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

The following patterns are _not_ considered problems:

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
