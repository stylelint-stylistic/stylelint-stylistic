# The `less` namespace

The rules of the core under `@stylistic/less/<rule>`, for stylesheets written in [Less](https://lesscss.org) and parsed with [`postcss-less`](https://github.com/shellscape/postcss-less). They are configured in the `overrides` block naming that syntax, as [Custom syntaxes](../../../docs/user-guide/custom-syntaxes.md) shows.

Every rule of the core is here, with the same options, `upper` of `at-rule-name-case` aside, and the same documentation, and plain CSS is read exactly as the core reads it — a plain block of an HTML page beside a `lang="less"` one included, so a mixed page is configured with these rules alone, but for `upper` of `at-rule-name-case`, which its plain blocks take from the core's copy. What the namespace reads beyond the core:

- the constructs `postcss-less` hands over — mixins and their calls, variables (`@foo: bar;`), detached rulesets, `:extend`, CSS guards (`when`), maps — are passed over the way the core passes over what is not standard CSS, rather than misread as code;
- an inline comment (`//`) is a comment of the text a rule reads, and every fix keeps out of one;
- `--fix` keeps the whitespace around a mixin call's `!important` on the side of the flag the file puts it, except that an end-of-line comment behind the flag still gets the flag moved behind it;
- `declaration-block-trailing-semicolon` under `never` reports and leaves the semicolons Less will not part with: behind an at-rule without a block (`a { @extend .b }` is an error to Less), a variable (`@v: pink`), and a declaration with no value (`color:;`), where a custom property's lone `!important` counts as a value; the semicolon behind a mixin call or a call to a detached ruleset, `@name()` and `@name()[key]` alike, goes as it does behind any declaration, while `@name ()` with a space is an at-rule;
- `at-rule-name-space-after` and `at-rule-name-newline-after` report an `@import` or `@plugin` with no whitespace behind the name, `@import(reference) "x.less"` or `@plugin"p"`, and write none into it, since Less takes the two as directives only with whitespace there;
- `at-rule-name-case` takes `lower` alone, since Less refuses an at-rule name holding an upper-case letter;
- `indentation` measures the head of a mixin definition as it measures an at-rule's parameters: a line continuing it outside the parameter list, a guard on a line of its own among them, stands a level deeper, and a line inside the list follows the parentheses as a mixin call's arguments do;
- `unit-case` reads and fixes the value of a variable (`@v: 10PX`) as it does a declaration's, whatever whitespace stands around the colon;
- `unit-case` reads a dimension as Less does: the number is digits with at most one period, and the unit ends at the first escape, hyphen or digit, so `10PX-2REM` has the units `PX` and `REM` and `1E5PX` the units `E` and `PX`, where the core reads the exponent into the number and the rest as one unit;
- the `value-slash-space-*` and `media-feature-slash-space-*` rules read a solidus outside parentheses as the separator it is to the core, `2/@a` included, since Less divides only inside parentheses under its default `math` mode; a parenthesised group is passed over, and a variable's own value (`@a: 1/2`) is no declaration to them;
- `named-grid-areas-alignment` under `alignColumns` leaves a row without a line name at the indentation, since the empty list of names `[]` that would put it under the others is an error to Less.

This namespace is about the stylistic side of the CSS a Less file holds. The Less constructs themselves — variables, mixins, guards — have no stylistic rules here.
