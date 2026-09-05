# Writing a test fixture

Indentation is stripped from every fixture: `autoStripIndent` is set once, in [vitest.setup.ts](../../vitest.setup.ts), and no test file turns it on. So multi-line `code` and `fixed` are written as indented template literals rather than with `\n` escapes:

```js
{
	code: `
		a {
			transform: scale(1,1);
		}
	`,
},
```

What the stripping does, in the order it does it:

- the line break that opens the literal goes, and every space and tab in front of the first line's content with it, so indentation a case is *about* can never stand on the first line;
- the last line break goes too, along with the whitespace behind it, so a fixture cannot end in a newline;
- of what is left, the shortest run of tabs and spaces in front of content is measured, and that many characters come off the front of every line — so a fixture's own indentation is written on top of the common tabs, and a space put in front of the tabs is taken off as one of the stripped characters instead;
- `code` and `fixed` are stripped apart from each other, each by its own common indentation.

Line numbers in `reject` cases therefore count from the first line of the fixture, not from the line its literal opens on.

A case whose subject is the whitespace at the edges of the source — a blank first line, a newline at the end, the indentation of the whole fixture — cannot be written under stripping at all, and turns it off with `autoStripIndent: false`. That is the only reason to write the flag, and it goes at the narrowest scope covering the cases that need it: the case itself, the `testRule({ … })` block, or the `createTestRule({ … })` factory where a rule is about nothing else, as `linebreaks`, `max-empty-lines` and `no-missing-end-of-source-newline` are.

## Whitespace a fixture cannot spell

Whitespace at the end of a line — what `no-eol-whitespace` is about — is written as an interpolated constant declared once per file, since an editor trims a real trailing space away on the first save. Indentation asks for nothing of the kind: a space inside a template literal is left alone by the linter, and is written as itself.

```js
// A space no editor trims from the end of a line.
const S = ` `

// …

{
	autoStripIndent: true,
	code: `
		@foo: (
			a,${S}${S}${S}
			b
		);
	`,
},
```

A case testing `\r` or `\r\n` stays on one line with `\n` escapes: a carriage return is invisible in the source, and no linter leaves it where it is put. So does a case whose subject is a break written inside a string — a row of `grid-template-areas`, say. The stripping takes every line down to the common indent of the fixture, so the whitespace standing behind such a break survives only as the amount that line is indented past the rest of the fixture, and every shallower spelling comes back with no whitespace there at all: a row of an `a`, a break, two tabs and another `a` is written by indenting its second line two tabs deeper than the block around it, which reads as alignment rather than as the text under test.
