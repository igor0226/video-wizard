export default {
	"*.{ts,js,json}": ["biome lint --write"],
	"*.{ts,tsx}": () => "npm run typecheck",
	"tsconfig.json": () => "npm run typecheck",
	"package.json": () => "npm run typecheck",
};
