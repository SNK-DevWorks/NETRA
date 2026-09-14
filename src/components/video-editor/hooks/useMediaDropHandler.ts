/**
 * Hook to handle adding or dropping media items onto the timeline.
 * Supports audio, image, and video overlay insertion at arbitrary timeline positions,
 * matching OpenCut's drag-and-drop workflow.
 */

import { useCallback } from "react";
import { toast } from "sonner";
import {
	DEFAULT_ANNOTATION_POSITION,
	DEFAULT_ANNOTATION_STYLE,
	type AnnotationRegion,
	type AudioRegion,
	type ClipRegion,
} from "../types";
import {
	mediaLibraryActions,
	processMediaFile,
	useMediaLibraryStore,
	type MediaLibraryItem,
} from "../state/useMediaLibraryStore";

export interface UseMediaDropHandlerParams {
	currentTime: number;
	timelineDuration?: number;
	videoPath: string | null;
	setAudioRegions: React.Dispatch<React.SetStateAction<AudioRegion[]>>;
	setAnnotationRegions: React.Dispatch<React.SetStateAction<AnnotationRegion[]>>;
	setClipRegions?: React.Dispatch<React.SetStateAction<ClipRegion[]>>;
	setSelectedAudioId?: (id: string | null) => void;
	setSelectedAnnotationId?: (id: string | null) => void;
	onImportMedia?: () => void;
}

export function useMediaDropHandler({
	currentTime,
	videoPath,
	setAudioRegions,
	setAnnotationRegions,
	setSelectedAudioId,
	setSelectedAnnotationId,
	onImportMedia,
}: UseMediaDropHandlerParams) {
	const items = useMediaLibraryStore((s) => s.items);

	/**
	 * Adds a media item to the timeline at targetTimeSec (or currentTime if omitted)
	 */
	const addMediaToTimeline = useCallback(
		(item: MediaLibraryItem, targetTimeSec?: number) => {
			const timeSec =
				targetTimeSec !== undefined && Number.isFinite(targetTimeSec)
					? Math.max(0, targetTimeSec)
					: currentTime;
			const startMs = Math.round(timeSec * 1000);

			if (item.type === "audio") {
				const durationMs =
					item.duration && item.duration > 0
						? Math.round(item.duration * 1000)
						: 5000;
				const endMs = startMs + durationMs;
				const newAudioId = `audio_${Date.now()}`;

				const newAudioRegion: AudioRegion = {
					id: newAudioId,
					startMs,
					endMs,
					audioPath: item.filePath || item.url,
					volume: 1,
					normalize: false,
					trackIndex: 0,
				};

				setAudioRegions((prev) => [...prev, newAudioRegion]);
				setSelectedAudioId?.(newAudioId);
				toast.success(`Added "${item.name}" to audio track`);
				return;
			}

			if (item.type === "image") {
				const durationMs = 5000;
				const newAnnotationId = `annotation_${Date.now()}`;

				const newAnnotation: AnnotationRegion = {
					id: newAnnotationId,
					startMs,
					endMs: startMs + durationMs,
					type: "image",
					content: item.url,
					imageContent: item.url,
					position: { ...DEFAULT_ANNOTATION_POSITION },
					size: { width: 35, height: 35 },
					style: { ...DEFAULT_ANNOTATION_STYLE },
					zIndex: 10,
				};

				setAnnotationRegions((prev) => [...prev, newAnnotation]);
				setSelectedAnnotationId?.(newAnnotationId);
				toast.success(`Added image "${item.name}" to timeline`);
				return;
			}

			if (item.type === "video") {
				// If no main video is loaded yet, encourage loading as main recording
				if (!videoPath && onImportMedia) {
					onImportMedia();
					return;
				}

				// Add as secondary video overlay track
				const durationMs =
					item.duration && item.duration > 0
						? Math.round(item.duration * 1000)
						: 10000;
				const newAnnotationId = `annotation_vid_${Date.now()}`;

				const newAnnotation: AnnotationRegion = {
					id: newAnnotationId,
					startMs,
					endMs: startMs + durationMs,
					type: "video",
					content: item.url,
					videoContent: item.url,
					position: { ...DEFAULT_ANNOTATION_POSITION },
					size: { width: 45, height: 45 },
					style: { ...DEFAULT_ANNOTATION_STYLE },
					zIndex: 12,
				};

				setAnnotationRegions((prev) => [...prev, newAnnotation]);
				setSelectedAnnotationId?.(newAnnotationId);
				toast.success(`Added video overlay "${item.name}"`);
			}
		},
		[
			currentTime,
			videoPath,
			onImportMedia,
			setAudioRegions,
			setAnnotationRegions,
			setSelectedAudioId,
			setSelectedAnnotationId,
		],
	);

	/**
	 * Handles native DragEvent drop from the media library or external OS files
	 */
	const handleDropOnTimeline = useCallback(
		async (e: React.DragEvent, timeFromCursorSec?: number) => {
			e.preventDefault();
			e.stopPropagation();

			const targetTime =
				timeFromCursorSec !== undefined ? timeFromCursorSec : currentTime;

			// 1. Try drag data from internal Media Library
			try {
				const rawData = e.dataTransfer.getData("application/json");
				if (rawData) {
					const data = JSON.parse(rawData);
					if (data.type === "netra-media" && data.mediaId) {
						const foundItem = items.find((x) => x.id === data.mediaId) ?? data.item;
						if (foundItem) {
							addMediaToTimeline(foundItem, targetTime);
							return;
						}
					}
				}
			} catch {
				// JSON parse error, continue
			}

			// 2. Try plain text ID
			const textId = e.dataTransfer.getData("text/plain");
			if (textId) {
				const found = items.find((x) => x.id === textId);
				if (found) {
					addMediaToTimeline(found, targetTime);
					return;
				}
			}

			// 3. Fallback: OS file drop directly onto timeline
			if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
				for (let i = 0; i < e.dataTransfer.files.length; i++) {
					const file = e.dataTransfer.files[i];
					// In Electron, File objects have a 'path' property
					const filePath = (file as unknown as { path?: string }).path;
					if (filePath) {
						const item = await processMediaFile(filePath);
						if (item) {
							mediaLibraryActions.addItem(item);
							addMediaToTimeline(item, targetTime);
						}
					}
				}
			}
		},
		[items, currentTime, addMediaToTimeline],
	);

	return {
		addMediaToTimeline,
		handleDropOnTimeline,
	};
}
