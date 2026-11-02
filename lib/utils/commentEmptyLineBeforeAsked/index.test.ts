import type { Comment } from "postcss"
import { document as makeDocument, parse } from "postcss"
import type { PostcssResult } from "stylelint"
import { describe, expect, it } from "vitest"

import { commentEmptyLineBeforeAsked } from "./index.ts"

describe(`commentEmptyLineBeforeAsked`, () => {
	it(`does not ask for an empty line before a comment ignored after another comment`, () => {
		let root = parse(`/* first */\n/* target */`)
		let comment = root.nodes[1] as Comment
		let result = resultWith({ "comment-empty-line-before": [`always`, { ignore: [`after-comment`] }] })

		expect(commentEmptyLineBeforeAsked(comment, result)).toBe(false)
	})

	it(`does not ask for an empty line before the first nested comment with its exception`, () => {
		let root = parse(`a {/* opening */\n/* target */}`)
		let comment = root.first?.type === `rule` ? root.first.nodes?.[1] as Comment : undefined
		let result = resultWith({ "comment-empty-line-before": [`always`, { except: [`first-nested`] }] })

		expect(comment && commentEmptyLineBeforeAsked(comment, result)).toBe(false)
	})

	it(`treats the first comment in an embedded document root as first nested`, () => {
		let root = parse(`/* target */`)
		let comment = root.first as Comment
		let document = makeDocument()
		document.append(root)
		let result = resultWith({ "comment-empty-line-before": [`always`, { except: [`first-nested`] }] })

		expect(commentEmptyLineBeforeAsked(comment, result)).toBe(false)
	})
})

/**
 * Makes a result with configured rules.
 * @param rules - The configured rules.
 * @returns The result.
 */
function resultWith (rules: Record<string, unknown>): PostcssResult {
	return { stylelint: { config: { rules } } } as unknown as PostcssResult
}
