export function withSvgRootClass(markup: string, className: string): string {
	return markup.replace(/<svg\b([^>]*)class="/, `<svg$1class="${className} `);
}
