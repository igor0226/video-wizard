import type { ValueTransformer } from "typeorm";

export const isoDateTransformer: ValueTransformer = {
	to: (value: string | Date | null | undefined) => {
		if (value == null) {
			return value;
		}
		return value instanceof Date ? value : new Date(value);
	},
	from: (value: Date | null) => value?.toISOString() ?? "",
};

export const bigintTransformer: ValueTransformer = {
	to: (value: number) => value,
	from: (value: string | number) =>
		typeof value === "string" ? Number(value) : value,
};
