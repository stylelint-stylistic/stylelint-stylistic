# Reading a line break

A line break in [lib/regexps.ts](../../lib/regexps.ts) is what PostCSS reads as one — a line feed, with or without the carriage return of a Windows pair in front of it — and nothing else: a bare carriage return and a form feed are whitespace to PostCSS's tokenizer and no line to its line counter, so a rule reading a line in either reports a position the file does not have.

A name that reads one spelling of a break alone, as `CRLF` and `EVERY_LF_RUN` do, says which question it is allowed to answer, since a reader picking a name cannot tell a narrow one from a wide one otherwise. Adding a narrow name without that sentence is how #245 and #247 came to be written.

Asking whether a character or a text is a line break is done through one of those names and never by hand. A comparison is not a regular expression, so a `===` against a break character, an `includes` of one, a `style-search` target and a pattern built out of a template literal all slip past the rule above — which is where #246 stood.

[scripts/check-break-readings.ts](../../scripts/check-break-readings.ts), which `make verify` runs, therefore accounts for **every** line of `lib/` that spells a break rather than looking for the shapes a reading is written in: a line matching neither of its two lists is what it fails on, so no shape can slip. Twenty-nine readings are carried as a named debt list, the way the `overrides` of `.oxlintrc.json` carries its own, and twelve lines that only write a break are named beside them.

Writing a break is untouched by any of this — a fixer has to be free to put the character the file is spelled with.
