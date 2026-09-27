import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { type DefaultTheme, defineConfig } from "vitepress"

import { namespaces } from "../../lib/syntaxes/index.ts"

/** The root of the repository, which is the root the site is built from: every README of a rule and of a namespace stays where it lies, and `rewritePath` names the page it is served as. */
const ROOT = fileURLToPath(new URL(`../../`, import.meta.url))

/** The repository on GitHub, where every page of the site is edited. */
const REPOSITORY = `https://github.com/stylelint-stylistic/stylelint-stylistic`

/** Where each Markdown file of the repository is served, by its path from the root: the README of a rule under `rules/`, the README of a namespace under `syntaxes/`, the guides of `docs/` at the root of the site, and the two documents of the repository under their own names. */
const REWRITES: [RegExp, string][] = [
	[/^lib\/rules\/([^/]+)\/README\.md$/u, `rules/$1.md`],
	[/^lib\/syntaxes\/([^/]+)\/README\.md$/u, `syntaxes/$1.md`],
	[/^docs\/(.+)$/u, `$1`],
	[/^CHANGELOG\.md$/u, `changelog.md`],
	[/^CONTRIBUTING\.md$/u, `contributing.md`],
]

/** A link to a Markdown file of the repository, written relative to the file it stands in: no scheme, no leading slash, no bare anchor; the path and the anchor apart. */
const RELATIVE_MARKDOWN_LINK = /^(?![a-z]+:|\/|#)([^#]+\.md)(#.*)?$/u

/** The heading of a group in the rule list, and the entry of a rule under it. */
const RULE_GROUP_HEADING = /^## (.+)$/u
const RULE_ENTRY = /^- \[`([a-z-]+)`\]/u

let { version } = JSON.parse(readFileSync(`${ROOT}package.json`, `utf8`)) as { version: string }

/**
 * Names the page a Markdown file of the repository is served as.
 * @param page - The file's path from the root of the repository.
 * @returns The page's path from the root of the site.
 */
function rewritePath (page: string): string {
	for (let [pattern, replacement] of REWRITES) {
		if (pattern.test(page)) return page.replace(pattern, replacement)
	}

	return page
}

/**
 * Reads the groups of the hand-written rule list, so that the sidebar of the rule pages follows the file the registry test guards.
 * @returns One sidebar group per `##` heading of the list, holding one item per rule linked under it.
 */
function readRuleGroups (): DefaultTheme.SidebarItem[] {
	let groups: DefaultTheme.SidebarItem[] = []
	let source = readFileSync(`${ROOT}docs/user-guide/rules.md`, `utf8`)

	for (let line of source.split(`\n`)) {
		let heading = RULE_GROUP_HEADING.exec(line)?.[1]

		if (heading !== undefined) {
			groups.push({ text: heading, collapsed: true, items: [] })

			continue
		}

		let name = RULE_ENTRY.exec(line)?.[1]
		let group = groups.at(-1)

		if (name !== undefined && group) group.items?.push({ text: name, link: `/rules/${name}` })
	}

	return groups
}

let syntaxItems: DefaultTheme.SidebarItem[] = namespaces.flatMap((syntax) => (syntax.namespace === undefined ? [] : [{ text: syntax.namespace, link: `/syntaxes/${syntax.namespace}` }]))

let userGuide: DefaultTheme.SidebarItem[] = [
	{ text: `Getting started`, link: `/user-guide/getting-started` },
	{ text: `Rules`, link: `/user-guide/rules` },
	{ text: `Custom syntaxes`, link: `/user-guide/custom-syntaxes`, items: syntaxItems },
]

let contribute: DefaultTheme.SidebarItem[] = [
	{ text: `Contributing`, link: `/contributing` },
	{ text: `Writing rules`, link: `/developer-guide/rules` },
	{ text: `Issues`, link: `/maintainer-guide/issues` },
	{ text: `Pull requests`, link: `/maintainer-guide/pull-requests` },
	{ text: `Releases`, link: `/maintainer-guide/releases` },
]

export default defineConfig({
	title: `Stylelint Stylistic`,
	description: `Stylistic rules for Stylelint, in plugin form`,
	base: `/`,
	srcDir: `..`,
	srcExclude: [
		`node_modules/**`,
		`tmp/**`,
		`dist/**`,
		`.claude/**`,
		`lib/**/*.test.*`,
		`scripts/**`,
		`types/**`,
		`AGENTS*.md`,
		`CLAUDE*.md`,
		`LICENSE.md`,
		`README.md`,
	],
	rewrites: rewritePath,
	cleanUrls: true,
	lastUpdated: true,
	ignoreDeadLinks: false,
	markdown: {
		config (md) {
			let renderLink = md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self): string => self.renderToken(tokens, idx, options))
			let renderCode = md.renderer.rules.code_inline ?? ((tokens, idx, options, _env, self): string => self.renderToken(tokens, idx, options))

			// A relative link to a Markdown file is written for GitHub, where the file lies in the repository, and VitePress resolves it as written, without asking `rewrites` where the file is served; so the link is resolved against the source file (`env.realPath`, where `env.path` is already the rewritten one) and translated to the page before VitePress reads it
			md.renderer.rules.link_open = (tokens, idx, options, env, self): string => {
				let token = tokens[idx]
				let target = RELATIVE_MARKDOWN_LINK.exec(token?.attrGet(`href`) ?? ``)
				let file = target?.[1]

				if (token && file !== undefined && typeof env.realPath === `string`) {
					let source = path.relative(ROOT, path.resolve(path.dirname(env.realPath), file))

					token.attrSet(`href`, `/${rewritePath(source)}${target?.[2] ?? ``}`)
				}

				return renderLink(tokens, idx, options, env, self)
			}

			// VitePress wraps a fenced block in `v-pre` and an inline code span in nothing, so a `{{` inside one — the changelog spells one — is read by Vue as an interpolation
			md.renderer.rules.code_inline = (tokens, idx, options, env, self): string => {
				tokens[idx]?.attrSet(`v-pre`, ``)

				return renderCode(tokens, idx, options, env, self)
			}
		},
	},
	themeConfig: {
		nav: [
			{ text: `Guide`, items: [{ items: userGuide }, { items: contribute }] },
			{ text: `Rules`, link: `/user-guide/rules` },
			{ text: `Changelog`, link: `/changelog` },
			{ text: `v${version}`, link: `${REPOSITORY}/releases` },
		],
		sidebar: {
			"/rules/": readRuleGroups(),
			"/syntaxes/": [{ text: `Custom syntaxes`, link: `/user-guide/custom-syntaxes`, items: syntaxItems }],
			"/": [
				{ text: `User guide`, items: userGuide },
				{ text: `Contribute`, items: contribute },
			],
		},
		outline: `deep`,
		editLink: {
			pattern: `${REPOSITORY}/edit/main/:path`,
			text: `Edit this page on GitHub`,
		},
		search: { provider: `local` },
		socialLinks: [{ icon: `github`, link: REPOSITORY }],
		footer: { message: `Released under the MIT License.` },
	},
})
