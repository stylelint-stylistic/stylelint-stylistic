# Managing issues

We manage issues consistently for the benefit of ourselves and our users.

## Labels

Use [labels](https://github.com/stylelint-stylistic/stylelint-stylistic/labels).

When you first triage an issue, add one of the `status: needs *` labels, e.g. `status: needs discussion`, and nothing else.

After triage, you should:

- replace it with one of the other `status: *` labels, e.g. `status: ready to implement`
- set the issue's type, e.g. `Bug`, `New rule` or `New option`
- add the matching `syntax: *`, `harm: *` and other labels

## Milestones

Use [milestones](https://github.com/stylelint-stylistic/stylelint-stylistic/milestones), one per version, e.g. `v6.0.0`, for the issues a release is to close. An issue asking for a breaking change goes to the next major version's.

## Titles

Rename the title into a consistent format, whatever the issue is about: it starts with a verb in the imperative mood, saying what is to be done.

- "Fix x false positives/negatives for y", e.g. "Fix `max-line-length` false negatives for strings ending in an escaped backslash"
- "Add x to y", e.g. "Add a fixer to `unicode-bom`"
- "Add y", e.g. "Add `configs.customize()` beside `configs.recommended`"
- "Refuse y", e.g. "Refuse a configuration whose settings conflict with each other"
- use `*` if the issue applies to a group of rules, e.g. `block-closing-brace-*-after`

## Saved replies

You should use [saved replies](https://help.github.com/en/github/writing-on-github/working-with-saved-replies).

### Close an issue

That doesn't use a template:

```md
Thank you for creating this issue. However, issues need to follow one of our templates so that we can clearly understand your particular circumstances.

Please help us help you by [recreating the issue](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/new/choose) using one of our templates.
```

That is best suited as another plugin:

```md
Thank you for your suggestion. I think this is best-suited as another [plugin](https://stylelint.io/developer-guide/plugins).
```

### Label as ready to implement

That fixes a bug in a rule:

```md
I've labeled the issue as ready to implement. Please consider [contributing](https://stylelint-stylistic.github.io/contributing) if you have time.

There are [steps on how to fix a bug in a rule](https://stylelint-stylistic.github.io/developer-guide/rules#fix-a-bug-in-a-rule) in the Developer guide.
```

That adds a new option to a rule:

```md
I've labeled the issue as ready to implement. Please consider [contributing](https://stylelint-stylistic.github.io/contributing) if you have time.

There are [steps on how to add a new option](https://stylelint-stylistic.github.io/developer-guide/rules#add-an-option-to-a-rule) in the Developer guide.
```

That adds a new rule:

```md
I've labeled the issue as ready to implement. Please consider [contributing](https://stylelint-stylistic.github.io/contributing) if you have time.

There are [steps on how to add a new rule](https://stylelint-stylistic.github.io/developer-guide/rules#add-a-rule) in the Developer guide.
```

That is another type of improvement:

```md
I've labeled the issue as ready to implement. Please consider [contributing](https://stylelint-stylistic.github.io/contributing) if you have time.
```
