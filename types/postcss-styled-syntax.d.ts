// `postcss-styled-syntax` ships no declaration of its entry; what the tests read of it is declared here.
declare module "postcss-styled-syntax" {
	import type { Document, Parser } from "postcss"

	let parse: Parser<Document>

	export { parse }
}
