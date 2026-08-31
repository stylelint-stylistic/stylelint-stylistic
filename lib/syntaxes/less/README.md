# The `less` namespace

The rules of the core under `@stylistic/less/<rule>`, for stylesheets written in [Less](https://lesscss.org) and parsed with [`postcss-less`](https://github.com/shellscape/postcss-less). The core's rules do not read such a file — on one they report a single warning naming this namespace — so a project holding Less lists these names for the files that carry it:

```json
{
	"plugins": ["@stylistic/stylelint-plugin"],
	"overrides": [
		{
			"files": ["**/*.less"],
			"customSyntax": "postcss-less",
			"rules": {
				"@stylistic/less/color-hex-case": "lower"
			}
		}
	]
}
```

Every rule of the core is here, with the same options and the same documentation, and plain CSS is read exactly as the core reads it — a plain block of an HTML page beside a `lang="less"` one included, so a mixed page is configured with these rules alone. What the namespace reads beyond the core:

- the constructs `postcss-less` hands over — mixins and their calls, variables (`@foo: bar;`), detached rulesets, `:extend`, CSS guards (`when`), maps — are passed over the way the core passes over what is not standard CSS, rather than misread as code;
- an inline comment (`//`) is a comment of the text a rule reads, and every fix keeps out of one;
- `declaration-block-trailing-semicolon` under `never` leaves the one semicolon Less will not part with — behind an at-rule without a block — and reports it without writing a fix that would break the file; a mixin call and a call to a detached ruleset close their block like any node, and the semicolon behind either goes as a declaration's would;
- `indentation` holds the parameter list of a mixin definition one level deeper, and `unit-case` walks the value of a variable the way it walks a declaration's.

This namespace is about the stylistic side of the CSS a Less file holds. The Less constructs themselves — variables, mixins, guards — have no stylistic rules here.

What `declaration-block-trailing-semicolon` makes of the constructs in detail: Under Less, `"never"` takes none away from behind an at-rule carrying no block of its own either: Less reads such an at-rule as running to its semicolon, so `a { @extend .b }` is `@extend rule is missing block or ending semi-colon` to it, where Sass and plain CSS part with that semicolon as readily as with a declaration's. A mixin call is not an at-rule to Less, and neither is a call to a detached ruleset, whose parameters open on `()`; the semicolon behind either is taken away as it always was. A lookup behind those parentheses leaves the call a call, since Less inlines `@name()[key]` as it inlines `@name()`, so that semicolon goes too; a space in front of them ends the call, and `@name ()` keeps its semicolon with the at-rules. A Less variable declaration is one to Less and is left alone here all the same: telling it from an at-rule means reading its value the way Less reads it, and Less asks that the whole of that value parse as an expression of its own, so `a { @v: pink; }` is now reported and left as it stands. A declaration Less reads no value in — `a { color: }`, `a { --x: }` — it refuses just as readily, and that semicolon this rule still takes away.
