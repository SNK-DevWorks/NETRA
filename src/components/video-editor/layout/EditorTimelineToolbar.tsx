import {
	MagicWand,
	MagnifyingGlassPlus,
	MagnifyingGlassMinus,
	Plus,
	Scissors,
	CaretDown,
	ArrowFatLineLeft,
	ArrowFatLineRight,
	Magnet,
	FilmSlate,
} from "@phosphor-icons/react";
import type { RefObject } from "react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { useI18n } from "@/contexts/I18nContext";
import type { useClipRegionCommands } from "../hooks/useClipRegionCommands";
import type { useTimelineState } from "../state/useTimelineState";
import type { TimelineEditorHandle } from "../timeline/TimelineEditor";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
	t: ReturnType<typeof useI18n>["t"];
	currentTime: number;
	duration: number;
	timelineRef: RefObject<TimelineEditorHandle>;
	clipCommands: ReturnType<typeof useClipRegionCommands>;
	timeline: ReturnType<typeof useTimelineState>;
	timelineZoom?: number;
	onTimelineZoomChange?: (zoom: number) => void;
};

// ─── Helper: Separator ─────────────────────────────────────────────────────────

function ToolSep() {
	return <div className="mx-1 h-4 w-px flex-shrink-0 bg-foreground/[0.08]" />;
}

// ─── Helper: Icon Button ───────────────────────────────────────────────────────

function ToolBtn({
	title,
	onClick,
	children,
	active,
	danger,
	disabled,
}: {
	title: string;
	onClick?: () => void;
	children: React.ReactNode;
	active?: boolean;
	danger?: boolean;
	disabled?: boolean;
}) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			title={title}
			onClick={onClick}
			disabled={disabled}
			className={cn(
				"h-7 w-7 rounded-md text-muted-foreground transition-all",
				active && "bg-[#2563EB]/10 text-[#2563EB]",
				danger && "hover:bg-red-500/10 hover:text-red-400",
				!active && !danger && "hover:bg-foreground/10 hover:text-foreground",
			)}
		>
			{children}
		</Button>
	);
}

// ─── Left Section: Editing Tools ──────────────────────────────────────────────

function ToolbarLeft({
	t,
	currentTime,
	timelineRef,
	clipCommands,
	timeline,
	snapEnabled,
	onSnapToggle,
}: {
	t: Props["t"];
	currentTime: number;
	timelineRef: RefObject<TimelineEditorHandle>;
	clipCommands: ReturnType<typeof useClipRegionCommands>;
	timeline: ReturnType<typeof useTimelineState>;
	snapEnabled: boolean;
	onSnapToggle: () => void;
}) {
	const currentMs = Math.round(currentTime * 1000);
	const hasClipAtPlayhead = timeline.clipRegions.some(
		(c) => currentMs > c.startMs && currentMs < c.endMs,
	);

	const handleSplit = useCallback(() => {
		clipCommands.handleClipSplit(currentTime * 1000);
	}, [clipCommands, currentTime]);

	const handleRippleLeft = useCallback(() => {
		clipCommands.handleRippleDeleteLeft?.(currentTime * 1000);
	}, [clipCommands, currentTime]);

	const handleRippleRight = useCallback(() => {
		clipCommands.handleRippleDeleteRight?.(currentTime * 1000);
	}, [clipCommands, currentTime]);

	const handleAddZoom = useCallback(() => {
		timelineRef.current?.addZoom();
	}, [timelineRef]);

	const handleSuggestZooms = useCallback(() => {
		timelineRef.current?.suggestZooms();
	}, [timelineRef]);

	return (
		<div className="flex items-center gap-0.5">
			<ToolBtn
				title="Split at Playhead (Ctrl+B / C)"
				onClick={handleSplit}
				disabled={!hasClipAtPlayhead}
			>
				<Scissors className="h-3.5 w-3.5" />
			</ToolBtn>

			<ToolBtn
				title="Ripple Delete Left (Q)"
				onClick={handleRippleLeft}
				disabled={!hasClipAtPlayhead}
			>
				<ArrowFatLineLeft className="h-3.5 w-3.5" />
			</ToolBtn>

			<ToolBtn
				title="Ripple Delete Right (W)"
				onClick={handleRippleRight}
				disabled={!hasClipAtPlayhead}
			>
				<ArrowFatLineRight className="h-3.5 w-3.5" />
			</ToolBtn>

			<ToolSep />

			<ToolBtn title="Add Zoom" onClick={handleAddZoom}>
				<MagnifyingGlassPlus className="h-3.5 w-3.5" />
			</ToolBtn>

			<ToolBtn title="Auto-Suggest Zooms" onClick={handleSuggestZooms}>
				<MagicWand className="h-3.5 w-3.5" />
			</ToolBtn>

			<ToolSep />

			{/* + Add Layer dropdown */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="h-7 gap-1 rounded-md border border-foreground/[0.08] bg-foreground/[0.04] px-2 text-[11px] text-foreground/70 transition-all hover:bg-foreground/[0.08] hover:text-foreground"
					>
						<Plus className="h-3 w-3" />
						<span className="font-medium">{t("editor.toolbar.addLayer")}</span>
						<CaretDown className="h-3 w-3" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="border-foreground/10 bg-editor-surface-alt">
					<DropdownMenuItem
						onClick={() => {
							const nextTrack =
								timeline.annotationRegions.length > 0
									? Math.max(...timeline.annotationRegions.map((r) => r.trackIndex ?? 0)) + 1
									: 0;
							timelineRef.current?.addAnnotation(nextTrack);
						}}
						className="cursor-pointer text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
					>
						{t("timeline.annotation.label")}
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => {
							const nextTrack =
								timeline.audioRegions.length > 0
									? Math.max(...timeline.audioRegions.map((r) => r.trackIndex ?? 0)) + 1
									: 0;
							void timelineRef.current?.addAudio(nextTrack);
						}}
						className="cursor-pointer text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
					>
						{t("timeline.audio.label")}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<ToolSep />

			{/* Snap toggle */}
			<ToolBtn
				title={snapEnabled ? "Snapping On (click to disable)" : "Snapping Off (click to enable)"}
				onClick={onSnapToggle}
				active={snapEnabled}
			>
				<Magnet className="h-3.5 w-3.5" />
			</ToolBtn>
		</div>
	);
}

// ─── Center Section: Scene Name ────────────────────────────────────────────────

function ToolbarCenter() {
	return (
		<div className="flex items-center">
			<div className="flex items-center gap-1.5 rounded-lg border border-foreground/[0.08] bg-foreground/[0.03] px-2.5 py-1">
				<FilmSlate className="h-3.5 w-3.5 text-muted-foreground/60" />
				<span className="text-[11px] font-medium text-muted-foreground">
					Main Timeline
				</span>
			</div>
		</div>
	);
}

// ─── Right Section: Zoom Slider ────────────────────────────────────────────────

function ToolbarRight({
	zoom,
	onZoomChange,
}: {
	zoom: number;
	onZoomChange: (v: number) => void;
}) {
	return (
		<div className="flex items-center gap-1">
			<ToolBtn
				title="Zoom out timeline"
				onClick={() => onZoomChange(Math.max(0, zoom - 0.1))}
			>
				<MagnifyingGlassMinus className="h-3.5 w-3.5" />
			</ToolBtn>

			{/* Zoom slider */}
			<div className="relative flex h-6 w-24 items-center overflow-hidden rounded-full border border-foreground/[0.08] bg-editor-bg/80">
				<div
					className="absolute inset-y-[3px] left-[3px] right-auto rounded-full bg-foreground/[0.1]"
					style={{ width: `max(calc(${zoom * 100}% - 6px), 0.5rem)` }}
				/>
				<input
					type="range"
					min="0"
					max="1"
					step="0.01"
					value={zoom}
					onChange={(e) => onZoomChange(Number(e.target.value))}
					className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
					aria-label="Timeline zoom"
				/>
				<span className="pointer-events-none relative z-10 pl-2 text-[9px] font-medium text-muted-foreground tabular-nums">
					{Math.round(zoom * 100)}%
				</span>
			</div>

			<ToolBtn
				title="Zoom in timeline"
				onClick={() => onZoomChange(Math.min(1, zoom + 0.1))}
			>
				<MagnifyingGlassPlus className="h-3.5 w-3.5" />
			</ToolBtn>
		</div>
	);
}

// ─── Main Toolbar ──────────────────────────────────────────────────────────────

export function EditorTimelineToolbar({
	t,
	currentTime,
	timelineRef,
	clipCommands,
	timeline,
	timelineZoom,
	onTimelineZoomChange,
}: Props) {
	const [snapEnabled, setSnapEnabled] = useState(true);
	const [localZoom, setLocalZoom] = useState(0.5);

	const zoom = timelineZoom ?? localZoom;
	const handleZoomChange = useCallback(
		(v: number) => {
			setLocalZoom(v);
			onTimelineZoomChange?.(v);
		},
		[onTimelineZoomChange],
	);

	return (
		<div className="flex h-10 flex-shrink-0 items-center border-b border-foreground/[0.06] bg-foreground/[0.02] px-3">
			{/* Left: editing tools */}
			<div className="flex flex-1 items-center">
				<ToolbarLeft
					t={t}
					currentTime={currentTime}
					timelineRef={timelineRef}
					clipCommands={clipCommands}
					timeline={timeline}
					snapEnabled={snapEnabled}
					onSnapToggle={() => setSnapEnabled((v) => !v)}
				/>
			</div>

			{/* Center: scene/timeline name */}
			<ToolbarCenter />

			{/* Right: zoom slider */}
			<div className="flex flex-1 items-center justify-end">
				<ToolbarRight zoom={zoom} onZoomChange={handleZoomChange} />
			</div>
		</div>
	);
}
