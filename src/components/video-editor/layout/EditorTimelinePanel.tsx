import { useRef, useState, type RefObject } from "react";
import type { useVideoEditorAudio } from "../audio/useVideoEditorAudio";
import type { useAnnotationRegionCommands } from "../hooks/useAnnotationRegionCommands";
import type { useAudioRegionCommands } from "../hooks/useAudioRegionCommands";
import type { useCaptionCommands } from "../hooks/useCaptionCommands";
import type { useClipRegionCommands } from "../hooks/useClipRegionCommands";
import type { useEditorPlaybackControls } from "../hooks/useEditorPlaybackControls";
import type { useTimelineProjection } from "../hooks/useTimelineProjection";
import type { useZoomRegionCommands } from "../hooks/useZoomRegionCommands";
import type { useTimelineState } from "../state/useTimelineState";
import TimelineEditor, { type TimelineEditorHandle } from "../timeline/TimelineEditor";

type Props = {
	timelineRef: RefObject<TimelineEditorHandle>;
	timeline: ReturnType<typeof useTimelineState>;
	projection: ReturnType<typeof useTimelineProjection>;
	playback: ReturnType<typeof useEditorPlaybackControls>;
	audio: ReturnType<typeof useVideoEditorAudio>;
	zoomCommands: ReturnType<typeof useZoomRegionCommands>;
	clipCommands: ReturnType<typeof useClipRegionCommands>;
	audioCommands: ReturnType<typeof useAudioRegionCommands>;
	captionCommands: ReturnType<typeof useCaptionCommands>;
	annotationCommands: ReturnType<typeof useAnnotationRegionCommands>;
	videoPath: string | null;
	videoSourcePath: string | null;
	cursorTelemetrySourcePath: string | null;
	normalizedCursorTelemetry: ReturnType<typeof useTimelineState>["cursorTelemetry"];
	autoSuggestZoomsTrigger: number;
	handleAutoSuggestZoomsConsumed: () => void;
	disableSuggestedZooms: boolean;
	currentTime: number;
	handleSelectAnnotation: (id: string | null) => void;
	onDropMedia?: (e: React.DragEvent, timeFromCursorSec?: number) => void;
};

export function EditorTimelinePanel(props: Props) {
	const {
		timelineRef,
		timeline,
		projection,
		playback,
		audio,
		zoomCommands,
		clipCommands,
		audioCommands,
		captionCommands,
		annotationCommands,
		videoPath,
		videoSourcePath,
		cursorTelemetrySourcePath,
		normalizedCursorTelemetry,
		autoSuggestZoomsTrigger,
		handleAutoSuggestZoomsConsumed,
		disableSuggestedZooms,
		currentTime,
		handleSelectAnnotation,
		onDropMedia,
	} = props;

	const containerRef = useRef<HTMLDivElement>(null);
	const [isDragOver, setIsDragOver] = useState(false);
	const [dragIndicatorX, setDragIndicatorX] = useState<number | null>(null);
	const [dropTimePreview, setDropTimePreview] = useState<number>(0);

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(true);
		if (containerRef.current) {
			const rect = containerRef.current.getBoundingClientRect();
			const relX = e.clientX - rect.left;
			setDragIndicatorX(relX);
			const sidebarW = 56;
			const trackWidth = Math.max(1, rect.width - sidebarW);
			const ratio = Math.max(0, Math.min(1, (relX - sidebarW) / trackWidth));
			setDropTimePreview(ratio * (projection.timelineDuration || 10));
		}
	};

	const handleDragLeave = (e: React.DragEvent) => {
		if (e.currentTarget === e.target) {
			setIsDragOver(false);
			setDragIndicatorX(null);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		setIsDragOver(false);
		setDragIndicatorX(null);
		if (onDropMedia) {
			onDropMedia(e, dropTimePreview);
		}
	};

	return (
		<div
			ref={containerRef}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			className="relative flex flex-1 flex-col min-h-0 h-full"
		>
			{/* OpenCut-style DragLine Drop Indicator */}
			{isDragOver && dragIndicatorX !== null && (
				<div
					className="pointer-events-none absolute top-0 bottom-0 z-50 w-0.5 bg-[#2563EB] shadow-[0_0_8px_#2563EB]"
					style={{ left: `${dragIndicatorX}px` }}
				>
					<div className="absolute top-1 left-2 rounded bg-[#2563EB] px-1.5 py-0.5 text-[9px] font-mono font-bold text-white shadow">
						Drop @ {Math.floor(dropTimePreview / 60)}:
						{String(Math.floor(dropTimePreview % 60)).padStart(2, "0")}
					</div>
				</div>
			)}
			<TimelineEditor
				ref={timelineRef}
				videoDuration={projection.timelineDuration}
				currentTime={currentTime}
				playheadTime={projection.timelinePlayheadTime}
				onSeek={playback.handleTimelineSeek}
				videoPath={videoPath}
				videoSourcePath={videoSourcePath}
				cursorTelemetrySourcePath={cursorTelemetrySourcePath}
				cursorTelemetry={normalizedCursorTelemetry}
				autoSuggestZoomsTrigger={autoSuggestZoomsTrigger}
				onAutoSuggestZoomsConsumed={handleAutoSuggestZoomsConsumed}
				disableSuggestedZooms={disableSuggestedZooms}
				zoomRegions={timeline.zoomRegions}
				onZoomAdded={zoomCommands.handleZoomAdded}
				onZoomSuggested={zoomCommands.handleZoomSuggested}
				onZoomSpanChange={zoomCommands.handleZoomSpanChange}
				onZoomDelete={zoomCommands.handleZoomDelete}
				selectedZoomId={timeline.selectedZoomId}
				onSelectZoom={zoomCommands.handleSelectZoom}
				trimRegions={timeline.trimRegions}
				clipRegions={timeline.clipRegions}
				onClipSplit={clipCommands.handleClipSplit}
				onRippleDeleteLeft={clipCommands.handleRippleDeleteLeft}
				onRippleDeleteRight={clipCommands.handleRippleDeleteRight}
				onClipSpanChange={clipCommands.handleClipSpanChange}
				selectedClipId={timeline.selectedClipId}
				onSelectClip={clipCommands.handleSelectClip}
				audioRegions={timeline.audioRegions}
				onAudioAdded={audioCommands.handleAudioAdded}
				onAudioSpanChange={audioCommands.handleAudioSpanChange}
				onAudioDelete={audioCommands.handleAudioDelete}
				selectedAudioId={timeline.selectedAudioId}
				onSelectAudio={audioCommands.handleSelectAudio}
				captionRegions={projection.effectiveCaptionRegions}
				onCaptionSpanChange={(id, span) =>
					captionCommands.handleCaptionRetime(id, {
						startMs: projection.mapTimelineTimeToSourceTime(span.start),
						endMs: projection.mapTimelineTimeToSourceTime(span.end),
					})
				}
				selectedCaptionId={timeline.selectedCaptionId}
				onSelectCaption={captionCommands.handleSelectCaption}
				onCaptionDelete={captionCommands.handleCaptionDelete}
				onCaptionAdded={captionCommands.handleCaptionAdded}
				captionsEnabled={timeline.autoCaptionSettings.enabled}
				captionQuickAddEnabled={timeline.autoCaptionSettings.timelineQuickAdd}
				annotationRegions={timeline.annotationRegions}
				onAnnotationAdded={annotationCommands.handleAnnotationAdded}
				onAnnotationSpanChange={annotationCommands.handleAnnotationSpanChange}
				onAnnotationDelete={annotationCommands.handleAnnotationDelete}
				selectedAnnotationId={timeline.selectedAnnotationId}
				onSelectAnnotation={handleSelectAnnotation}
				showSourceAudioTrack={timeline.clipRegions.some((clip) => clip.showSourceAudio)}
				sourceAudioResourceVersion={timeline.sourceAudioFallbackRefreshKey}
				sourceAudioTrackSettings={audio.activeSourceAudioTrackSettings}
				getSourceAudioTrackSettingsForClip={audio.getSourceAudioTrackSettingsForClip}
				onSourceAudioAvailabilityChange={timeline.setHasClipSourceAudio}
				onSourceAudioTracksMetaChange={audio.onSourceAudioTracksMetaChange}
			/>
		</div>
	);
}
