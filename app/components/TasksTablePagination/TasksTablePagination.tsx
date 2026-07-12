"use client";

import {
	ChevronFirst,
	ChevronLast,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import "./TasksTablePagination.css";

type TasksTablePaginationProps = {
	totalRows: number;
	selectedCount: number;
	pageIndex: number;
	pageSize: number;
	onPageIndexChange: (pageIndex: number) => void;
	onPageSizeChange: (pageSize: number) => void;
};

export function TasksTablePagination({
	totalRows,
	selectedCount,
	pageIndex,
	pageSize,
	onPageIndexChange,
	onPageSizeChange,
}: TasksTablePaginationProps) {
	const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
	const canGoPrevious = pageIndex > 0;
	const canGoNext = pageIndex < pageCount - 1;

	return (
		<div className="tasksPagination">
			<p className="tasksPaginationSelection">
				{selectedCount} of {totalRows} row(s) selected.
			</p>

			<div className="tasksPaginationControls">
				<div className="tasksPaginationPageSize">
					<span>Rows per page</span>
					<Select
						value={String(pageSize)}
						onValueChange={(value) => onPageSizeChange(Number(value))}
					>
						<SelectTrigger className="tasksPageSizeSelect">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="10">10</SelectItem>
							<SelectItem value="20">20</SelectItem>
							<SelectItem value="50">50</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<span className="tasksPaginationPageLabel">
					Page {pageIndex + 1} of {pageCount}
				</span>

				<div className="tasksPaginationButtons">
					<Button
						type="button"
						variant="outline"
						size="icon"
						className="h-8 w-8"
						disabled={!canGoPrevious}
						onClick={() => onPageIndexChange(0)}
					>
						<ChevronFirst className="h-4 w-4" />
						<span className="sr-only">First page</span>
					</Button>
					<Button
						type="button"
						variant="outline"
						size="icon"
						className="h-8 w-8"
						disabled={!canGoPrevious}
						onClick={() => onPageIndexChange(pageIndex - 1)}
					>
						<ChevronLeft className="h-4 w-4" />
						<span className="sr-only">Previous page</span>
					</Button>
					<Button
						type="button"
						variant="outline"
						size="icon"
						className="h-8 w-8"
						disabled={!canGoNext}
						onClick={() => onPageIndexChange(pageIndex + 1)}
					>
						<ChevronRight className="h-4 w-4" />
						<span className="sr-only">Next page</span>
					</Button>
					<Button
						type="button"
						variant="outline"
						size="icon"
						className="h-8 w-8"
						disabled={!canGoNext}
						onClick={() => onPageIndexChange(pageCount - 1)}
					>
						<ChevronLast className="h-4 w-4" />
						<span className="sr-only">Last page</span>
					</Button>
				</div>
			</div>
		</div>
	);
}
