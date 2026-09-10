import { LANGUAGE_OPTIONS } from "@/shared/config";
import { Label } from "@/shared/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";

type LanguageSelectProps = {
	id: string;
	label: string;
	placeholder: string;
	value: string;
	disabled: boolean;
	onChange: (value: string) => void;
};

export function LanguageSelect({
	id,
	label,
	placeholder,
	value,
	disabled,
	onChange,
}: LanguageSelectProps) {
	return (
		<div className="newVideoField">
			<Label htmlFor={id}>{label}</Label>
			<Select value={value} onValueChange={onChange} disabled={disabled}>
				<SelectTrigger id={id}>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{LANGUAGE_OPTIONS.map((option) => (
						<SelectItem key={option} value={option}>
							{option}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
