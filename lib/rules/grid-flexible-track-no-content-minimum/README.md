# grid-flexible-track-no-content-minimum

Disallow a content-sized minimum for a flexible grid track.

```css
a { grid-template-columns: 300px 1fr; }
/**                              ↑
 * This flexible track, whose minimum is `auto` */
```

A track sized with a bare `<flex>` — `1fr`, `2fr`, `.5fr` — reads as `minmax(auto, <flex>)`, and the `auto` is what lets a long word, a wide image or an unbreakable string push the track wider than its share of the space, so that the grid overflows its container: the grid blowout. Writing the minimum out as `0` keeps every flexible track at its share whatever it holds.

This rule reports a flexible track whose minimum is content-sized — spelled bare, or as a `minmax()` whose minimum is `auto`, `min-content` or `max-content` — in every property whose value spells a track list: `grid-template-columns`, `grid-template-rows`, `grid-auto-columns`, `grid-auto-rows`, and the `grid-template` and `grid` shorthands. A track standing among the arguments of a `repeat()` is read as one of the list.

A `minmax()` whose minimum is anything else — a length, a percentage, `0`, a `calc()`, a `var()` — is left alone, since such a minimum is what the rule asks for. So is a `<flex>` standing inside any other call, the fallback of a `var()` among them, and a value written in a variable, since what either sizes is nothing the rule can read.

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix all of the problems reported by this rule. The fix changes how the grid is laid out, not only how it is written: a track that used to grow to fit its content is held at its share, and the content overflows the track instead. Where the layout already guards against the blowout in another way — `min-width: 0` or `overflow: hidden` on the grid items, which this rule cannot see — turn the fix off with the [`disableFix` secondary option](https://stylelint.io/user-guide/configure#disablefix), or the rule with a [configuration comment](https://stylelint.io/user-guide/ignore-code).

The [`message` secondary option](https://stylelint.io/user-guide/configure/#message) can accept the arguments of this rule.

The `minmax()` the fix wraps a bare track in is spaced the way the `function-comma-newline-*`, `function-comma-space-*`, `function-parentheses-newline-inside` and `function-parentheses-space-inside` rules ask, wherever the configuration lists them, so that one run of `--fix` settles the value whichever order the configuration lists the rules in. Where none of them is listed, the call is written as `minmax(0, 1fr)`.

## Options

### `true`

The following patterns are considered problems:

```css
a { grid-template-columns: 1fr; }
```

```css
a { grid-template-columns: repeat(12, 1fr); }
```

```css
a { grid-template-columns: minmax(auto, 1fr); }
```

```css
a { grid-template-columns: minmax(min-content, 1fr); }
```

```css
a { grid-template-rows: 1fr; }
```

```css
a { grid-template: "a a" 1fr / 1fr 2fr; }
```

The following patterns are _not_ considered problems:

```css
a { grid-template-columns: minmax(0, 1fr); }
```

```css
a { grid-template-columns: repeat(12, minmax(0, 1fr)); }
```

```css
a { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
```

```css
a { grid-template-columns: minmax(10%, 1fr); }
```

```css
a { grid-template-columns: 200px auto; }
```

```css
a { grid-template-columns: var(--columns); }
```

## Optional secondary options

### `ignore: ["rows"]`

Ignore the tracks of the row axis: the values of `grid-template-rows` and `grid-auto-rows`, and what stands in front of the solidus of the `grid-template` and `grid` shorthands.

The following patterns are _not_ considered problems:

```css
a { grid-template-rows: 1fr; }
```

```css
a { grid-template: 1fr / minmax(0, 1fr); }
```

The following patterns are still considered problems:

```css
a { grid-template-columns: 1fr; }
```

```css
a { grid-template: 1fr / 1fr; }
```
