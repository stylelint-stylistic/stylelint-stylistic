# The `styled` namespace

The rules of the core under `@stylistic/styled/<rule>`, for stylesheets embedded in JavaScript as styled templates and parsed with [`postcss-styled-syntax`](https://github.com/hudochenkov/postcss-styled-syntax). They are configured in the `overrides` block naming that syntax, as [Custom syntaxes](../../../docs/user-guide/custom-syntaxes.md) shows.

Every rule of the core is here, with the same options and the same documentation, and plain CSS is read exactly as the core reads it. Some rules answer a styled template differently:

- [`indentation`](../../rules/indentation/README.md) counts its levels from the line the template's expression opens on rather than from the start of the line, and a template broken over lines holds its content one level deeper — save for a first node standing on the line of the backtick itself, which hangs from neither and is asked for no indentation at all; a declaration whose value embeds an expression of the host language (`${…}`) is not checked, since its lines are the host's rather than the stylesheet's.
- [`no-empty-first-line`](../../rules/no-empty-first-line/README.md) reads the break behind the opening backtick as the end of the host's line rather than as an empty first line: an empty line is one standing between that line and the first line of the stylesheet.
- [`no-missing-end-of-source-newline`](../../rules/no-missing-end-of-source-newline/README.md) asks for no break where the closing backtick stands on the host's line — a template not broken over lines, or one whose last line holds nothing but the backtick's indentation — and for one in front of a closing backtick ending a line of the stylesheet.
