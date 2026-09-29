# Why?

The reasons are almost exactly those of [ESLint Stylistic](https://eslint.style/guide/why): a formatter reprints the code and throws away how its authors laid it out, while stylistic rules with autofix keep every convention under your control and leave the rest as written.

With stylesheets the case is plainer still: a formatter at best falls short of formatting styles well, and more often cannot do it at all. Take a `grid` shorthand with named areas and lines, sizes beside its rows and columns behind the solidus. Prettier leaves it as it is:

```css
.layout {
	grid:
		[full-start header-start] "logo nav nav search" auto [header-end]
		[main-start] "sidebar main main aside" minmax(0, 1fr) [main-end]
		[footer-start] "footer footer footer footer" 3rem [footer-end full-end]
		/ [sidebar-start] 16rem [sidebar-end content-start] 1fr 1fr [content-end] 12rem;
}
```

The [`named-grid-areas-alignment`](../../lib/rules/named-grid-areas-alignment/README.md) rule, under `gap: 2`, `alignQuotes` and `alignColumns`, lays it out as the table it is:

```css
.layout {
	grid:
		[full-start header-start]  "logo     nav     nav     search"  auto            [header-end]
		[main-start]               "sidebar  main    main    aside "  minmax(0, 1fr)  [main-end]
		[footer-start]             "footer   footer  footer  footer"  3rem            [footer-end full-end]
		/ [sidebar-start] 16rem [sidebar-end content-start] 1fr 1fr [content-end] 12rem;
}
```
