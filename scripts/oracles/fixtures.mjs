/** The shapes the defects of this plugin have come out of: a comment beside code, two spellings of a line break, a bang, a run of them. Each is as small as it can be and still be wrong, since every fixture costs the run about a dozen lints per rule and option — three for `converge.mjs`, one each for `comments.mjs` and `nodes.mjs`, and eight for `twins.mjs`, which lints an original and three twins twice over. */
const FIXTURES = [
	[`plain`, `a { color: pink; }\n`],
	[`plain-multi`, `a,\nb {\n\tcolor: pink;\n\ttransform: translate(1px, 2px);\n}\n`],
	[`block-comment`, `a { color: pink /* c */; }\n`],
	[`comment-in-value`, `a { b: x/*c*/f(1,2)c; }\n`],
	[`slash-star-slash`, `a { b: x/*/*a,b*/f(1,2)c; }\n`],
	[`bang`, `a { b: 1px!important; }\n`],
	[`bang-twice`, `a { b: 1px!important 2px /*c*/!important; }\n`],
	[`bang-slashes`, `a { b: 1px!important//!important; }\n`],
	[`url-slashes`, `a { b: url(http://a/b.png); }\n`],
	[`media-ops`, `@media ,a<>=b screen<screen { a { b: c; } }\n`],
	[`media-feature`, `@media (min-width:100px) and (max-width:200px) { a { b: c; } }\n`],
	[`cr`, `a { color: pink;  \r}\n`],
	[`ff`, `a { color: pink;  \f}\n`],
	[`crlf`, `a {\r\n\tcolor: pink;\r\n}\r\n`],
	[`trailing-comment-block`, `a { color: pink /* c */ }\n`],
	[`nested-func`, `a { b: calc( 1px + f(2,3) ) ; }\n`],
	[`selector-comment`, `a /* c */ > b { color: pink; }\n`],
	[`atrule-bodiless`, `@import "a";\n@charset "utf-8";\n`],
	[`grid`, `a { grid-template-areas: "a a"\n\t"b b"; }\n`],
	[`quotes`, `a[href='x'] { b: 'y'; }\n`],
	[`two-bangs`, `a { b: 1px!important 2px!important; }\n`],
	[`group-with-unit`, `h1 { width: (1 + 2)px; }\n`],
	[`nested-group`, `h1 { width: ((1) * (2))em; }\n`],
]

/** The same shapes again with the comment the two custom syntaxes spell with a double slash. The last two stand where a fixer is about to take a break away — behind the opening brace, and behind a semicolon — since that is where taking one carries the code after it into the comment, which is #248 and which no fixture reached until this pair was written. */
const INLINE_FIXTURES = [
	[`inline-value`, `a { b: 1px // c\n\t2px; }\n`],
	[`inline-trailing`, `a {\n\tcolor: pink // c\n}\n`],
	[`inline-node`, `a {\n\tcolor: pink\n\t// c\n}\n`],
	[`inline-bang`, `a {\n\tcolor: red // c !important\n\t;\n}\n`],
	[`inline-func`, `a { t: translate(1px, 2px // c\n\t); }\n`],
	[`inline-unclosed`, `a { transform: translate(1px, 2px // a /*\n); }\n`],
	[`inline-media`, `@media (min-width: 100px // c\n\t) { a { color: red; } }\n`],
	[`inline-selector`, `a // c\n{ color: pink; }\n`],
	[`inline-after-brace`, `a {// c\n\tcolor: pink;\n}\n`],
	[`inline-after-semicolon`, `a {\n\tcolor: pink;// c\n\ttop: 0;\n}\n`],
]

export { FIXTURES, INLINE_FIXTURES }
