import {
	CaretDown,
	Check,
	Crop,
	Pause,
	Play,
	SkipBack,
	SkipForward,
	SpeakerHigh,
	SpeakerLow,
	SpeakerX,
} from "@phosphor-icons/react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { useI18n } from "@/contexts/I18nContext";
import { ASPECT_RATIOS, type AspectRatio, getAspectRatioLabel } from "@/utils/aspectRatioUtils";
import type { useVideoEditorAudio } from "../audio/useVideoEditorAudio";
import type { CaptionEditTarget } from "../captionEditing";
import type { useAnnotationRegionCommands } from "../hooks/useAnnotationRegionCommands";
import type { useEditorPlaybackControls } from "../hooks/useEditorPlaybackControls";
import type { useTimelineProjection } from "../hooks/useTimelineProjection";
import type { useZoomRegionCommands } from "../hooks/useZoomRegionCommands";
import type { useAppearanceState } from "../state/useAppearanceState";
import type { useTimelineState } from "../state/useTimelineState";
import type { TimelineEditorHandle } from "../timeline/TimelineEditor";
import type { VideoPlaybackRef } from "../VideoPlayback";
import { EditorVideoPreview } from "./EditorVideoPreview";

type Props = {
	t: ReturnType<typeof useI18n>["t"];
	videoPath: string | null;
	previewVersion: number;
	aspectRatio: AspectRatio;
	setAspectRatio: Dispatch<SetStateAction<AspectRatio>>;
	previewAspectRatioValue: number;
	videoPlaybackRef: RefObject<VideoPlaybackRef>;
	timelineRef?: RefObject<TimelineEditorHandle>;
	currentTime: number;
	isPlaying: boolean;
	previewVolume: number;
	setPreviewVolume: Dispatch<SetStateAction<number>>;
	suspendRendering: boolean;
	appearance: ReturnType<typeof useAppearanceState>;
	timeline: ReturnType<typeof useTimelineState>;
	audio: ReturnType<typeof useVideoEditorAudio>;
	projection: ReturnType<typeof useTimelineProjection>;
	playback: ReturnType<typeof useEditorPlaybackControls>;
	zoomCommands: ReturnType<typeof useZoomRegionCommands>;
	annotationCommands: ReturnType<typeof useAnnotationRegionCommands>;
	effectiveCursorTelemetry: ReturnType<typeof useTimelineState>["cursorTelemetry"];
	effectiveShowCursor: boolean;
	isCropped: boolean;
	handleOpenCropEditor: () => void;
	handleSaveAutoCaptionEdit: (target: CaptionEditTarget, text: string) => void;
	handleSelectAnnotation: (id: string | null) => void;
	setDuration: Dispatch<SetStateAction<number>>;
	setIsPreviewReady: Dispatch<SetStateAction<boolean>>;
	setCurrentTime: Dispatch<SetStateAction<number>>;
	setIsPlaying: Dispatch<SetStateAction<boolean>>;
	setError: Dispatch<SetStateAction<string | null>>;
};

function formatTime(seconds: number) {
	if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function EditorPreviewPanel(props: Props) {
	const {
		t,
		videoPath,
		previewVersion,
		aspectRatio,
		setAspectRatio,
		previewAspectRatioValue,
		videoPlaybackRef,
		currentTime,
		isPlaying,
		previewVolume,
		setPreviewVolume,
		suspendRendering,
		appearance,
		timeline,
		audio,
		projection,
		playback,
		zoomCommands,
		annotationCommands,
		effectiveCursorTelemetry,
		effectiveShowCursor,
		isCropped,
		handleOpenCropEditor,
		handleSaveAutoCaptionEdit,
		handleSelectAnnotation,
		setDuration,
		setIsPreviewReady,
		setCurrentTime,
		setIsPlaying,
		setError,
	} = props;

	return (
		<div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden rounded-2xl border border-foreground/[0.08] bg-editor-panel shadow-sm">
			{/* Preview Header Bar — clean, minimal (OpenCut style) */}
			<div className="flex h-10 flex-shrink-0 items-center justify-between border-b border-foreground/[0.06] bg-foreground/[0.02] px-3.5">
				<div className="flex items-center gap-2">
					<span className="rounded-md bg-foreground/[0.05] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums">
						{getAspectRatioLabel(aspectRatio)}
					</span>
				</div>

				<div className="flex items-center gap-1.5">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="h-7 gap-1 rounded-md px-2 text-xs text-muted-foreground transition-all hover:bg-foreground/10 hover:text-foreground"
							>
								<span className="font-medium">{getAspectRatioLabel(aspectRatio)}</span>
								<CaretDown className="h-3 w-3" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="border-foreground/10 bg-editor-surface-alt">
							{ASPECT_RATIOS.map((ratio) => (
								<DropdownMenuItem
									key={ratio}
									onClick={() => setAspectRatio(ratio)}
									className="flex cursor-pointer items-center justify-between gap-3 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
								>
									<span>{getAspectRatioLabel(ratio)}</span>
									{aspectRatio === ratio ? (
										<Check className="h-3 w-3 text-[#2563EB]" />
									) : null}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>

					<div className="h-3.5 w-px bg-foreground/15" />

					<Button
						variant="ghost"
						size="sm"
						onClick={handleOpenCropEditor}
						className="h-7 gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-all hover:bg-foreground/10 hover:text-foreground"
					>
						<Crop className="h-3.5 w-3.5" />
						<span className="font-medium">{t("settings.crop.title")}</span>
						{isCropped ? <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" /> : null}
					</Button>
				</div>
			</div>

			{/* Monitor Canvas Viewport */}
			<div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#090a0d] p-3">
				<div
					className="relative flex items-center justify-center"
					style={{
						width: "auto",
						height: "100%",
						aspectRatio: previewAspectRatioValue,
						maxWidth: "100%",
						maxHeight: "100%",
						margin: "0 auto",
						boxSizing: "border-box",
					}}
				>
					<EditorVideoPreview
						videoPath={videoPath}
						previewVersion={previewVersion}
						aspectRatio={aspectRatio}
						playbackRef={videoPlaybackRef}
						currentTime={currentTime}
						isPlaying={isPlaying}
						previewVolume={previewVolume}
						suspendRendering={suspendRendering}
						appearance={appearance}
						timeline={timeline}
						audio={audio}
						effectiveZoomRegions={projection.effectiveZoomRegions}
						effectiveSpeedRegions={projection.effectiveSpeedRegions}
						effectiveCursorTelemetry={effectiveCursorTelemetry}
						effectiveShowCursor={effectiveShowCursor}
						setDuration={setDuration}
						setIsPreviewReady={setIsPreviewReady}
						setCurrentTime={setCurrentTime}
						setIsPlaying={setIsPlaying}
						setError={setError}
						handlers={{
							onSelectZoom: zoomCommands.handleSelectZoom,
							onZoomFocusChange: zoomCommands.handleZoomFocusChange,
							onEditAutoCaption: handleSaveAutoCaptionEdit,
							onSelectAnnotation: handleSelectAnnotation,
							onAnnotationPositionChange:
								annotationCommands.handleAnnotationPositionChange,
							onAnnotationSizeChange:
								annotationCommands.handleAnnotationSizeChange,
						}}
					/>
				</div>
			</div>

			{/* Transport Footer — OpenCut-style 3-column grid */}
			<div className="grid grid-cols-[1fr_auto_1fr] h-12 flex-shrink-0 items-center border-t border-foreground/[0.06] bg-foreground/[0.02] px-3.5">
				{/* Left: Timecode */}
				<div className="flex items-center gap-1 font-mono text-xs tabular-nums text-muted-foreground select-none">
					<span className="font-semibold text-foreground/90">
						{formatTime(projection.timelinePlayheadTime)}
					</span>
					<span className="text-muted-foreground/40">/</span>
					<span>{formatTime(projection.timelineDuration)}</span>
				</div>

				{/* Center: Playback Controls */}
				<div className="flex items-center gap-1.5">
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 rounded-full text-muted-foreground transition-all hover:bg-foreground/10 hover:text-foreground"
						title={t("editor.playback.skipBack")}
						onClick={playback.handlePreviewSkipBack}
					>
						<SkipBack className="h-3.5 w-3.5" weight="fill" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className={`h-8 w-8 rounded-full border border-foreground/10 shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all ${
							isPlaying
								? "bg-foreground/10 text-foreground hover:bg-foreground/20"
								: "bg-neutral-800 text-white hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-white/90"
						}`}
						onClick={playback.togglePlayPause}
						title={isPlaying ? "Pause" : "Play"}
					>
						{isPlaying ? (
							<Pause className="h-4 w-4" weight="fill" />
						) : (
							<Play className="h-4 w-4 ml-0.5" weight="fill" />
						)}
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 rounded-full text-muted-foreground transition-all hover:bg-foreground/10 hover:text-foreground"
						title={t("editor.playback.skipForward")}
						onClick={playback.handlePreviewSkipForward}
					>
						<SkipForward className="h-3.5 w-3.5" weight="fill" />
					</Button>
				</div>

				{/* Right: Volume + Fullscreen */}
				<div className="flex items-center justify-end gap-2">
					<button
						type="button"
						className="text-muted-foreground transition-colors hover:text-foreground"
						title={t("editor.playback.muteUnmute")}
						onClick={() => setPreviewVolume(previewVolume <= 0.001 ? 1 : 0)}
					>
						{previewVolume <= 0.001 ? (
							<SpeakerX className="h-3.5 w-3.5" />
						) : previewVolume < 0.5 ? (
							<SpeakerLow className="h-3.5 w-3.5" />
						) : (
							<SpeakerHigh className="h-3.5 w-3.5" />
						)}
					</button>
					<div className="relative flex h-6 w-20 select-none items-center overflow-hidden rounded-full border border-foreground/[0.08] bg-editor-bg/80">
						<div
							className="absolute inset-y-[2px] left-[2px] right-auto rounded-full bg-foreground/[0.12]"
							style={{
								width:
									previewVolume > 0
										? `max(calc(${previewVolume * 100}% - 4px), 0.8rem)`
										: 0,
							}}
						/>
						<div
							className="pointer-events-none absolute bottom-[15%] top-[15%] z-10 w-0.5 rounded-full bg-foreground/95"
							style={{ left: `calc(${previewVolume * 100}% - 6px)` }}
						/>
						<span className="pointer-events-none relative z-10 pl-2 text-[9px] font-medium text-muted-foreground">
							{Math.round(previewVolume * 100)}%
						</span>
						<input
							type="range"
							aria-label={t("editor.playback.volume", "Preview volume")}
							min="0"
							max="1"
							step="0.01"
							value={previewVolume}
							onChange={(event) => setPreviewVolume(Number(event.target.value))}
							className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
