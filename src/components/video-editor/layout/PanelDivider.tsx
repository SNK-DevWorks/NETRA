import { cn } from "@/lib/utils";
import type { PanelResizeDirection } from "@/hooks/usePanelResize";

interface PanelDividerProps {
	direction: PanelResizeDirection;
	isDragging?: boolean;
	onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
	className?: string;
}

export function PanelDivider({ direction, isDragging = false, onPointerDown, className }: PanelDividerProps) {
	const isHorizontal = direction === "horizontal";

	return (
		<div
			role="separator"
			aria-orientation={isHorizontal ? "vertical" : "horizontal"}
			onPointerDown={onPointerDown}
			className={cn(
				"group relative flex-shrink-0 select-none touch-none flex items-center justify-center",
				isHorizontal
					? "w-[7px] cursor-ew-resize py-2"
					: "h-[7px] cursor-ns-resize px-2",
				isDragging && "z-50",
				className,
			)}
		>
			{/* The visible pill handle indicator */}
			<div
				className={cn(
					"rounded-full transition-all duration-150",
					isHorizontal
						? "w-[3px] h-7 group-hover:h-12"
						: "h-[3px] w-7 group-hover:w-12",
					isDragging
						? "bg-[#2563EB] shadow-[0_0_8px_rgba(37,99,235,0.7)] opacity-100"
						: "bg-foreground/[0.15] group-hover:bg-foreground/45 opacity-60 group-hover:opacity-100",
				)}
			/>
		</div>
	);
}
