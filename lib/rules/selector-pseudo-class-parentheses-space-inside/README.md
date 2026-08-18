# selector-pseudo-class-parentheses-space-inside

Require a single space or disallow whitespace on the inside of the parentheses within pseudo-class selectors.

```css
input:not( [type="submit"] ) {}
/**      ↑                 ↑
 * The space inside these two parentheses */
```

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix the problems reported by this rule, leaving any comment inside the parentheses where it is.

An argument with no node in it — the whole of `input:not()`, or the empty half of `input:not(,[type="submit"])` — has no inside to space out, and that end of the parentheses is passed over. Where whitespace stands at such an argument, or at a selector of the list that holds nothing, the parser keeps none of it and nothing in the parsed selector can hold it, so the whole list is passed over instead, under either option. So is a selector carrying an inline comment under `postcss-scss`, which that syntax spells one way and prints another.

## Options

`string`: `"always"|"never"`

### `"always"`

There _must always_ be a single space inside the parentheses.

The following patterns are considered problems:

```css
input:not([type="submit"]) {}
```

```css
input:not([type="submit"] ) {}
```

The following patterns are _not_ considered problems:

```css
input:not( [type="submit"] ) {}
```

### `"never"`

There _must never_ be whitespace on the inside the parentheses.

The following patterns are considered problems:

```css
input:not( [type="submit"] ) {}
```

```css
input:not( [type="submit"]) {}
```

The following patterns are _not_ considered problems:

```css
input:not([type="submit"]) {}
```
