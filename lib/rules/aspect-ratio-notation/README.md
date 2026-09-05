# aspect-ratio-notation

Specify the notation for the value of `aspect-ratio`.

```css
a { aspect-ratio: 16 / 9; }
/**               ↑    ↑
 * These two numbers, and whether both of them are written */
```

One and the same aspect ratio can be written in more than one way, and this rule reads a value along two axes that do not depend on each other. The primary option decides **how many numbers are written**: the grammar of the property reads a value of one number as that number over `1`, so `2` and `2 / 1` are the same ratio written twice. The optional `smallestIntegers` option decides **what those numbers are**: `16 / 8` and `2 / 1` are the same ratio as well.

Either axis can be used without the other, and both are settled before anything is written, so one run of the fix always leaves the value as the configuration asks for it.

Where the fix adds the second number, the solidus in front of it is spelled the way the [`value-slash-space-before`](../value-slash-space-before/README.md) and [`value-slash-space-after`](../value-slash-space-after/README.md) rules ask wherever the configuration lists them — the [`media-feature-slash-space-before`](../media-feature-slash-space-before/README.md) and [`media-feature-slash-space-after`](../media-feature-slash-space-after/README.md) rules for a media feature — whichever order it lists the rules in, and with a single space on either side where it lists neither. The examples below are written for a configuration listing neither: under `value-slash-space-before: "never"` and `value-slash-space-after: "never"`, `2` becomes `2/1` and `1.5` becomes `3/2`.

This rule reads the value of the `aspect-ratio` property and the `<ratio>` of a media feature — `@media (aspect-ratio: 16 / 9)`, `@media (16 / 9 <= aspect-ratio)` — under the same options, the `device-aspect-ratio` feature and the `min-` and `max-` spellings of both included; the `ignore` option below leaves the media features alone.

This rule leaves a value alone where it spells anything but `auto` and a ratio of plain numbers, a call and a variable of another syntax among them. The keyword stands in front of the ratio or behind it, never in between its numbers, since the two components of the grammar stand apart. It also leaves a number alone where that number carries a sign or an exponent, since rewriting either is nothing the rule was asked to do.

The [`fix` option](https://stylelint.io/user-guide/options#fix) can automatically fix most of the problems reported by this rule. It does not fix one where a comment stands between the two numbers and the second of them has to go, since the run taken out would carry the comment away with it.

The [`message` secondary option](https://stylelint.io/user-guide/configure/#message) can accept the arguments of this rule.

## Options

`string`: `"ratio"|"number-where-possible"|"as-written"`

### `"ratio"`

Both numbers of the ratio _must always_ be written.

The following patterns are considered problems:

```css
a { aspect-ratio: 2; }
```

```css
a { aspect-ratio: auto 1.5; }
```

The following patterns are _not_ considered problems:

```css
a { aspect-ratio: 2 / 1; }
```

```css
a { aspect-ratio: 16 / 8; }
```

```css
a { aspect-ratio: auto; }
```

### `"number-where-possible"`

The second number of the ratio _must never_ be written where that number is one.

The following patterns are considered problems:

```css
a { aspect-ratio: 2 / 1; }
```

```css
a { aspect-ratio: 2 / 1.0; }
```

The following patterns are _not_ considered problems:

```css
a { aspect-ratio: 2; }
```

```css
a { aspect-ratio: 3 / 2; }
```

```css
a { aspect-ratio: 16 / 8; }
```

### `"as-written"`

The rule _must not_ choose between the two notations.

Give this option together with a secondary option below. On its own the rule has an opinion about neither axis and reports nothing at all.

The following patterns are _not_ considered problems:

```css
a { aspect-ratio: 2; }
```

```css
a { aspect-ratio: 2 / 1; }
```

## Optional secondary options

### `smallestIntegers: boolean`

The two numbers of the ratio must be the smallest pair of whole numbers the same ratio can be written with. Defaults to `false`, which leaves every number as it is written.

The reduction is exact, so a number that is no ratio of small whole numbers comes out as the pair it really is: `1.777` becomes `1777 / 1000` rather than the `16 / 9` its author may have meant. A ratio with a zero on either side is degenerate and has nothing to be divided by, so it is left as it stands — the primary option still says how many of its numbers are written.

Where the reduction asks for a second number the value does not spell, that number is written whatever the primary option says: `1.5` becomes `3 / 2` under every one of the three, since no single number says the same ratio.

**Given rule configuration: `aspect-ratio-notation: ["as-written", { smallestIntegers: true }]`**

The following patterns are considered problems:

```css
a { aspect-ratio: 16 / 8; }
```

```css
a { aspect-ratio: 1.5; }
```

```css
a { aspect-ratio: 0.5 / 0.25; }
```

The following patterns are _not_ considered problems:

```css
a { aspect-ratio: 16 / 9; }
```

```css
a { aspect-ratio: 2; }
```

```css
a { aspect-ratio: 2 / 1; }
```

### `ignore: ["at-rules"]`

#### `"at-rules"`

Leave the `<ratio>` of a media feature alone, and read the value of the property only.

**Given rule configuration: `aspect-ratio-notation: ["ratio", { ignore: ["at-rules"] }]`**

The following patterns are considered problems:

```css
a { aspect-ratio: 2; }
```

The following patterns are _not_ considered problems:

```css
@media (aspect-ratio: 2) {}
```

```css
@media (2 <= aspect-ratio) {}
```
