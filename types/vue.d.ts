// A single-file component is imported for the app to register; TypeScript is told what the module holds and nothing more.
declare module "*.vue" {
	import type { DefineComponent } from "vue"

	let component: DefineComponent

	export default component
}
