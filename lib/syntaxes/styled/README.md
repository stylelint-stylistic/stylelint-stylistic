# The `styled` namespace

The rules of the core under `@stylistic/styled/<rule>`, for stylesheets embedded in JavaScript as styled templates and parsed with [`postcss-styled-syntax`](https://github.com/hudochenkov/postcss-styled-syntax). The core's rules do not read such a file — on one they report a single warning naming this namespace — so a project using styled templates lists these names for the files that carry them:

```json
{
	"plugins": ["@stylistic/stylelint-plugin"],
	"overrides": [
		{
			"files": ["**/*.{js,jsx,ts,tsx}"],
			"customSyntax": "postcss-styled-syntax",
			"rules": {
				"@stylistic/styled/indentation": ["tab"]
			}
		}
	]
}
```

Every rule of the core is here, with the same options and the same documentation, and plain CSS is read exactly as the core reads it. One rule answers a styled template differently:

- [`indentation`](../../rules/indentation/README.md) counts its levels from the line the template's expression opens on rather than from the start of the line, and a template broken over lines holds its content one level deeper — save for a first node standing on the line of the backtick itself, which hangs from neither and is asked for no indentation at all; a declaration whose value embeds an expression of the host language (`${…}`) is not checked, since its lines are the host's rather than the stylesheet's.
