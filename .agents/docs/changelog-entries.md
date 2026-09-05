# Writing a changelog entry

Entries are written from the user's point of view, as “something **now** behaves like this”, not as a description of what was done. Never “added support for…” or “fixed a bug in…”. Name the subject first, then what is now true of it:

```markdown
- The plugin now requires `stylelint` version `17.0.0` or higher.
- The `function-comma-newline-after` rule now has an additional `ignoreFunctions` option (see [#78](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/78)).
- The `selector-pseudo-class-parentheses-space-inside` rule no longer triggers false positives in multiline pseudo-classes.
```

An optional sentence after that says what it means for the user — for a breaking change, what they will most likely have to fix; for a feature, what they can do with it now; for a fix, what they can now do without fear or which workaround they can drop.

Where possible, end the entry with a link to the issue or PR in parentheses, plus the author's profile for outside contributions. Follow the surrounding entries: most of the file carries no links, and multi-part entries use a nested list rather than a long sentence.

The entry for a bug fix is a full paragraph rather than a line: which rules, what happened before, what happens now, what a user will notice, with sub-bullets where a change has several faces. It is the only thing a user ever reads about the fix, so its facts are checked as carefully as the code's.

Where an entry concerns several rules of one family, open with the glob — “The `declaration-block-semicolon-*` rules …” — and refer back with “These rules…”, naming a single member only where it behaves differently from the rest. Do not list three rules at the start and then speak of “the four” in the explanation.

## Groups inside `Unreleased`

While a backlog is being cleared, `Unreleased` is not a flat list — thirty-three entries in one section cannot be read. Its entries sit as sub-items under group headings whose exact wording is in the file itself: two groups in `Changed`, for violations the plugin passed over in silence and for warnings that used to vanish under `--fix`, and four in `Fixed`, for a fix that could only be written by commenting the code out, a fix that carried off what stood beside it, a warning raised where nothing was wrong, and a warning that was right while the fix or the position was not.

A group heading is written only together with the first entry filed under it, and `### Changed` stands before `### Fixed`. Releases outside such a run are meant to be atomic, so a section holding one or two entries needs no groups at all.
