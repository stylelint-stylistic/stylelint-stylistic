# Contradicting settings

Two settings contradict each other when no spelling of an ordinary stylesheet satisfies both. The plugin refuses such a configuration: the run stops with a configuration error at the first rule of the plugin to run, the process exits with code `78`, and under `--fix` a file the pair applies to is not written.

```json
{
	"@stylistic/value-list-comma-newline-after": "always-multi-line",
	"@stylistic/value-list-comma-space-after": "always"
}
```

```text
Contradicting settings:
  "@stylistic/value-list-comma-newline-after": "always-multi-line"
  "@stylistic/value-list-comma-space-after": "always"
Set the second to "always-single-line", or turn one of them off.
```

The message names both settings as the configuration spells them, in the order it lists them, and every pair it holds at once. There is no way to keep such a pair on purpose: one of the two settings has to change.

The configuration is read as Stylelint merged it for the file being linted, so a pair put together by `extends` and `overrides` is refused too, and only over the files it applies to. A rule turned off with `null` takes no part. [`defineStylistic` and `defineStylisticOverride`](typed-configuration.md) refuse a pair written in one call the same way, as soon as the configuration is loaded, and their types refuse it in the editor already: each of the two settings is typed with a message naming the other.

## What is refused

### A `-newline-` rule and the `-space-` rule of the same delimiter

Both rules speak of one run of whitespace, so they contradict each other wherever their options speak of the same lines and ask for different characters there. `always` and `never` speak of every line, `-single-line` options of single-line constructs, `-multi-line` options of multi-line ones.

| The `-newline-` rule | The `-space-` rule | Rules |
| --- | --- | --- |
| `always` | `always`, `never` | every pair whose `-space-` rule takes the option |
| `always` | `always-multi-line`, `never-multi-line` | the four `block-*-brace-*` pairs |
| `always` | `always-single-line`, `never-single-line` | `block-opening-brace-*-before`, `block-closing-brace-*-after`, `declaration-colon-*-after` |
| `always-multi-line` | `always`, `never`, `always-multi-line`, `never-multi-line` | every pair taking the options |
| `never-multi-line` | `always`, `always-multi-line` | every pair taking the options |
| `always-single-line` | `always`, `never`, `always-single-line`, `never-single-line` | `block-opening-brace-*-before`, `block-closing-brace-*-after` |
| `never-single-line` | `always`, `always-single-line` | `block-opening-brace-*-before`, `block-closing-brace-*-after` |

The `never` options of a `-newline-` rule allow no whitespace at all, which is why they contradict a space that is asked for.

The pairs that always fit are a `-multi-line` option of the `-newline-` rule beside a `-single-line` option of the `-space-` rule, and the reverse where the rules take those options. The message names the options to change to, the fewer changes of the two ways round; it names none for `declaration-colon-space-after: "never"`, which has no `-single-line` spelling.

The pairs are: `at-rule-name-*-after`, `block-closing-brace-*-after`, `block-closing-brace-*-before`, `block-opening-brace-*-after`, `block-opening-brace-*-before`, `declaration-block-semicolon-*-after`, `declaration-block-semicolon-*-before`, `declaration-colon-*-after`, `function-comma-*-after`, `function-comma-*-before`, `function-parentheses-*-inside`, `media-query-list-comma-*-after`, `media-query-list-comma-*-before`, `selector-list-comma-*-after`, `selector-list-comma-*-before`, `value-list-comma-*-after`, `value-list-comma-*-before`, `value-slash-*-after` and `value-slash-*-before`.

### An empty line in front of a closing brace

[`block-closing-brace-empty-line-before: "always-multi-line"`](../../lib/rules/block-closing-brace-empty-line-before/README.md) contradicts:

- `block-closing-brace-newline-before: "never-multi-line"`;
- `block-closing-brace-space-before` under `"always"`, `"never"`, `"always-multi-line"` and `"never-multi-line"`;
- `max-empty-lines: 0`.

### No whitespace behind a function

[`function-whitespace-after: "never"`](../../lib/rules/function-whitespace-after/README.md) contradicts every `always` option, `-single-line` and `-multi-line` ones included, of the rules asking for whitespace in front of what stands behind a closing parenthesis: `declaration-block-semicolon-*-before`, `function-comma-*-before`, `function-parentheses-*-inside`, `value-list-comma-*-before` and `value-slash-*-before`.

### One rule under two namespaces

Two copies of one rule, `@stylistic/unit-case` and `@stylistic/scss/unit-case`, never contradict each other: a stylesheet is read by one copy of a rule — the one of its own family, the core's over plain CSS and the namespace's over its syntax — and the other yields (see [Custom syntaxes](../../README.md#custom-syntaxes)). A `-newline-` rule under one namespace and its `-space-` rule under another are read as the pair they are wherever both read the stylesheet.
