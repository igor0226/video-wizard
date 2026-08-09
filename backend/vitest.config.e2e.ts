import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: ["test/e2e/**/*.e2e-spec.ts"],
		setupFiles: ["./test/setup-e2e.ts"],
		root: "./",
	},
	plugins: [
		swc.vite({
			module: { type: "es6" },
		}),
	],
});
