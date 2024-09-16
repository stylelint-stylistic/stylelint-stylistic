# selector-descendant-combinator-no-non-space

Disallow non-space characters for descendant combinators of selectors.

```css
.foo .bar .baz {}
/** ↑    ↑
* These descendant combinators */
```

This rule ensures that only a single space is used and ensures no tabs, newlines, nor multiple spaces are used for descendant combinators of selectors.

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix most of the problems reported by this rule.

The [`message` secondary option](https://stylelint.io/user-guide/configure/#message) can accept the arguments of this rule.

This rule currently ignores selectors containing comments.

## Options

### `true`

The following patterns are considered problems:

```css
.foo  .bar {}
```

```css
.foo
.bar {}
```

The following patterns are _not_ considered problems:

```css
.foo .bar {}
```
