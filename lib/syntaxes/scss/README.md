# The `scss` namespace

The rules of the core under `@stylistic/scss/<rule>`, for stylesheets written in [SCSS](https://sass-lang.com) and parsed with [`postcss-scss`](https://github.com/postcss/postcss-scss). The core's rules do not read such a file — on one they report a single warning naming this namespace — so a project holding SCSS lists these names for the files that carry it:

```json
{
	"plugins": ["@stylistic/stylelint-plugin"],
	"overrides": [
		{
			"files": ["**/*.scss"],
			"customSyntax": "postcss-scss",
			"rules": {
				"@stylistic/scss/color-hex-case": "lower"
			}
		}
	]
}
```

Every rule of the core is here, with the same options and the same documentation, and plain CSS is read exactly as the core reads it — a plain block of an HTML page beside a `lang="scss"` one included, so a mixed page is configured with these rules alone. What the namespace reads beyond the core:

- the constructs only Sass spells — placeholder selectors (`%a`), nested properties (`font: { family: x }`), `@content` and a reading through a module (`ns.$a`, `ns.f()`) — are passed over the way the core passes over what is not standard CSS, rather than misread as code; a variable (`$a: b`) with its map or list, and an interpolation (`#{…}`), the core passes over as well, since a plugin spells both over plain CSS;
- an inline comment (`//`) is a comment of the file: the parser rewrites it into a block comment in the copy it hands a rule and keeps the file's own spelling in a copy beside it, and every rule here reads and writes the copy the file spells, so a position is counted in the file, a fix lands in it, and no fix writes into such a comment;
- `function-whitespace-after` under `never` leaves the whitespace in front of a `+` or a `-` standing behind a call, since Sass reads such a sign as an operator (see the rule's README);
- the `value-slash-space-*` and `media-feature-slash-space-*` rules pass over a solidus Sass divides at — one beside a variable or a call of Sass's own, as in `4/$a` and `fn()/2` — since the whitespace beside an operator is no separator's, and read every other solidus as the core does, `var(--x)/2` among them, which Sass hands through as it stands; where taking the whitespace behind a solidus away would close it up against a comment, which spells a `//` comment with the solidus as its first character, the `never` options of the `*-after` rules report the problem and leave the text alone.

This namespace is about the stylistic side of the CSS an SCSS file holds. The SCSS constructs themselves — `@if`/`@else`, `@mixin`/`@include`, variables, placeholders, `//` comments — have stylistic rules of their own in [stylelint-scss](https://github.com/stylelint-scss/stylelint-scss), which reads the same files beside this namespace.
