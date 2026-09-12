# Writing a changelog entry

An entry is written for a user of the plugin, and it answers one question: what does this change mean for me? Not what was done, and not how it works — a reader who wants the mechanism opens the documentation, and that is what the link in the entry is for.

## The form

Name the subject, say what is now true of it, end with the issue number:

```markdown
- The plugin now requires `stylelint` version `17.0.0` or higher.
- The [`named-grid-areas-alignment`](https://stylelint-stylistic.github.io/rules/named-grid-areas-alignment) rule now applies to the `grid-template` and `grid` properties too, and not only to `grid-template-areas` (see [#45](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/45)).
```

Where the change asks something of the user, a second sentence says what: new warnings on code that used to pass, an autocorrection they will see, a rename in the configuration. Where there is a way to soften it, a third names that and stops:

```markdown
Where your code spells those shorthands, the rule may start asking for corrections or writing them under `--fix`. For finer control use its new option (see below).
```

Three sentences is the ceiling and most entries need one. What never goes in: how the rule reads the value, which node it walks, what the fix writes into which run, how many rows a sweep moved, the history of the defect. A review finding about a mechanism is, in an entry, a finding about a sentence that should not be there at all.

**The name of anything new is a link to its documentation** — a rule, an option, a function. A rule's page is `https://stylelint-stylistic.github.io/rules/<short name>`, an option's page is its rule's, and a feature's is the guide it is described in. The details live behind the link, which is why the entry does not carry them.

Where an entry concerns several rules of one family, open with the glob — “The `declaration-block-semicolon-*` rules …” — and refer back with “These rules…”, naming a single member only where it behaves differently from the rest. Do not list three rules at the start and then speak of “the four”.

Where every entry of a group would say the same thing to the user, say it once in a paragraph opening the group instead of once per entry.

## What gets an entry at all

**Until the next release, a fix gets an entry only where a user of the plugin reported the bug.** A defect found by a sweep, an oracle, a tool or an agent gets none: such a list runs to hundreds, and almost nothing in it tells a user something they could act on. The groups that hold those fixes end with one sentence saying there are many more, and that is the whole record of them. False negatives are under the same rule.

A fix for a **false negative** belongs under `Changed`, not `Fixed`: the user meets it as new warnings on code that used to pass, which is a change in behaviour rather than a repair they asked for. Purely internal changes — build tooling, test layout, CI — get no entry at all, since any entry forces a release.

## When the entry is committed

Until the next release the entry is **not** written in the commit that makes the change. It comes last, so that the maintainer can weigh whether it is wanted before it is folded in:

1. Fix the bug and commit the fix without an entry. Write the entry's text and keep it to hand.
2. After the fixups that correct the fix, add one more fixup carrying the entry, targeted at the commit whose change it describes. Several user-visible commits mean several such fixups.
3. The maintainer, before giving the go-ahead for the finishing stage, judges whether the entry is wanted and corrects it where it is.
4. `git rebase --autosquash` folds the fixups in before the push, and the entry — where it survived that judgement — lands in the commit it belongs to.

## Groups inside `Unreleased`

While a backlog is being cleared, `Unreleased` is not a flat list — thirty entries in one section cannot be read. Its entries sit under `####` group headings, one per kind of change a user meets, whose exact wording is in the file itself. A group heading is written only together with the first entry filed under it, and `### Changed` stands before `### Added`, which stands before `### Fixed`. Releases outside such a run are meant to be atomic, so a section holding one or two entries needs no groups at all.
