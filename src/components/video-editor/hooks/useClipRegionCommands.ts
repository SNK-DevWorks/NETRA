import type { Span } from "dnd-timeline";
import { type Dispatch, type MutableRefObject, type SetStateAction, useCallback, useRef } from "react";
import { toast } from "sonner";
import { planClipSpeedChange } from "../clipSpeedChange";
import { planClipSplit } from "../clipSplit";
import type {
	AnnotationRegion,
	AudioRegion,
	ClipRegion,
	EditorEffectSection,
	SpeedRegion,
	ZoomRegion,
} from "../types";
import { getClipSourceStartMs } from "../types";

type Translator = (
	key: string,
	fallback?: string,
	params?: Record<string, string | number>,
) => string;

interface UseClipRegionCommandsParams {
	clipRegions: ClipRegion[];
	setClipRegions: Dispatch<SetStateAction<ClipRegion[]>>;
	zoomRegions: ZoomRegion[];
	setZoomRegions: Dispatch<SetStateAction<ZoomRegion[]>>;
	setAnnotationRegions: Dispatch<SetStateAction<AnnotationRegion[]>>;
	setSpeedRegions: Dispatch<SetStateAction<SpeedRegion[]>>;
	setAudioRegions: Dispatch<SetStateAction<AudioRegion[]>>;
	selectedClipId: string | null;
	setSelectedClipId: Dispatch<SetStateAction<string | null>>;
	setSelectedZoomId: Dispatch<SetStateAction<string | null>>;
	setSelectedAnnotationId: Dispatch<SetStateAction<string | null>>;
	setSelectedAudioId: Dispatch<SetStateAction<string | null>>;
	setSelectedCaptionId: Dispatch<SetStateAction<string | null>>;
	setActiveEffectSection: Dispatch<SetStateAction<EditorEffectSection>>;
	nextClipIdRef: MutableRefObject<number>;
	t: Translator;
	handleSeek?: (seconds: number) => void;
}

export function useClipRegionCommands({
	clipRegions,
	setClipRegions,
	zoomRegions,
	setZoomRegions,
	setAnnotationRegions,
	setSpeedRegions,
	setAudioRegions,
	selectedClipId,
	setSelectedClipId,
	setSelectedZoomId,
	setSelectedAnnotationId,
	setSelectedAudioId,
	setSelectedCaptionId,
	setActiveEffectSection,
	nextClipIdRef,
	t,
	handleSeek,
}: UseClipRegionCommandsParams) {
	const handleSelectClip = useCallback(
		(id: string | null) => {
			setSelectedClipId(id);
			if (id) {
				setActiveEffectSection("clip");
				setSelectedZoomId(null);
				setSelectedAnnotationId(null);
				setSelectedAudioId(null);
				setSelectedCaptionId(null);
			} else {
				setActiveEffectSection((section) => (section === "clip" ? "scene" : section));
			}
		},
		[
			setActiveEffectSection,
			setSelectedAnnotationId,
			setSelectedAudioId,
			setSelectedCaptionId,
			setSelectedClipId,
			setSelectedZoomId,
		],
	);

	const handleClipSplit = useCallback(
		(splitMs: number) => {
			const plan = planClipSplit({
				clipRegions,
				splitMs,
				createId: () => `clip-${nextClipIdRef.current++}`,
			});
			if (!plan) return;
			setClipRegions((current) =>
				current.flatMap((clip) =>
					clip.id === plan.targetId ? [plan.left, plan.right] : [clip],
				),
			);
			setSelectedClipId(plan.right.id);
		},
		[clipRegions, nextClipIdRef, setClipRegions, setSelectedClipId],
	);

	const handleClipSpanChange = useCallback(
		(id: string, span: Span) => {
			const oldClip = clipRegions.find((clip) => clip.id === id);
			const newStart = Math.round(span.start);
			const newEnd = Math.round(span.end);
			const removedSegments = oldClip
				? [
						...(newStart > oldClip.startMs
							? [{ startMs: oldClip.startMs, endMs: newStart }]
							: []),
						...(newEnd < oldClip.endMs
							? [{ startMs: newEnd, endMs: oldClip.endMs }]
							: []),
					]
				: [];

			if (oldClip) {
				const startDelta = newStart - oldClip.startMs;
				const endDelta = newEnd - oldClip.endMs;
				if (Math.abs(startDelta - endDelta) < 1 && Math.abs(startDelta) > 0) {
					setZoomRegions((current) =>
						current.map((zoom) =>
							zoom.startMs < oldClip.endMs && zoom.endMs > oldClip.startMs
								? {
										...zoom,
										startMs: zoom.startMs + startDelta,
										endMs: zoom.endMs + startDelta,
									}
								: zoom,
						),
					);
				}
			}

			if (removedSegments.length > 0) {
				const removeTrimmedRegions = <T extends { startMs: number; endMs: number }>(
					regions: T[],
				) =>
					regions.filter(
						(region) =>
							!removedSegments.some(
								(segment) =>
									region.startMs < segment.endMs &&
									region.endMs > segment.startMs,
							),
					);
				setZoomRegions((current) => removeTrimmedRegions(current));
				setAnnotationRegions((current) => removeTrimmedRegions(current));
				setSpeedRegions((current) => removeTrimmedRegions(current));
				setAudioRegions((current) => removeTrimmedRegions(current));
			}

			setClipRegions((current) =>
				current.map((clip) => {
					if (clip.id !== id) return clip;
					const speed = Number.isFinite(clip.speed) && clip.speed > 0 ? clip.speed : 1;
					const startDelta = newStart - clip.startMs;
					const endDelta = newEnd - clip.endMs;
					// A move carries its footage along; trimming the left edge skips
					// into the source by however much source that edge covered.
					const isMove = Math.abs(startDelta - endDelta) < 1;
					const sourceStartMs = isMove
						? getClipSourceStartMs(clip)
						: Math.max(0, Math.round(getClipSourceStartMs(clip) + startDelta * speed));
					return { ...clip, startMs: newStart, endMs: newEnd, sourceStartMs };
				}),
			);
		},
		[
			clipRegions,
			setAnnotationRegions,
			setAudioRegions,
			setClipRegions,
			setSpeedRegions,
			setZoomRegions,
		],
	);

	const handleClipSpeedChange = useCallback(
		(speed: number) => {
			if (!selectedClipId || !Number.isFinite(speed) || speed <= 0) return;
			const plan = planClipSpeedChange({ clipRegions, zoomRegions, selectedClipId, speed });
			if (!plan) return;
			if ("blockedReason" in plan) {
				toast.warning(
					plan.blockedReason === "clip-overlap"
						? t(
								"editor.timeline.speedClipOverlap",
								"Speed change would overlap the next clip. Move or split clips before slowing this section.",
							)
						: t(
								"editor.timeline.speedZoomOverlap",
								"Speed change would overlap another zoom. Move or delete the overlapping zoom first.",
							),
				);
				return;
			}
			setClipRegions(plan.clipRegions);
			setZoomRegions(plan.zoomRegions);
		},
		[clipRegions, selectedClipId, setClipRegions, setZoomRegions, t, zoomRegions],
	);

	const handleClipMutedChange = useCallback(
		(muted: boolean) => {
			if (!selectedClipId) return;
			setClipRegions((current) =>
				current.map((clip) => (clip.id === selectedClipId ? { ...clip, muted } : clip)),
			);
		},
		[selectedClipId, setClipRegions],
	);
	const handleClipShowSourceAudioChange = useCallback(
		(showSourceAudio: boolean) => {
			if (!selectedClipId) return;
			setClipRegions((current) =>
				current.map((clip) =>
					clip.id === selectedClipId ? { ...clip, showSourceAudio } : clip,
				),
			);
		},
		[selectedClipId, setClipRegions],
	);

	const handleClipDelete = useCallback(
		(id: string) => {
			const deletedClip = clipRegions.find((clip) => clip.id === id);
			setClipRegions((current) => current.filter((clip) => clip.id !== id));
			if (deletedClip) {
				const outsideDeletedClip = (region: { startMs: number; endMs: number }) =>
					region.endMs <= deletedClip.startMs || region.startMs >= deletedClip.endMs;
				setZoomRegions((current) => current.filter(outsideDeletedClip));
				setAnnotationRegions((current) => current.filter(outsideDeletedClip));
				setSpeedRegions((current) => current.filter(outsideDeletedClip));
				setAudioRegions((current) => current.filter(outsideDeletedClip));
			}
			if (selectedClipId === id) setSelectedClipId(null);
		},
		[
			clipRegions,
			selectedClipId,
			setAnnotationRegions,
			setAudioRegions,
			setClipRegions,
			setSelectedClipId,
			setSpeedRegions,
			setZoomRegions,
		],
	);

	const handleRippleDeleteLeft = useCallback(
		(currentMs: number) => {
			const splitAt = Math.round(currentMs);
			const targetClip =
				(selectedClipId
					? clipRegions.find(
							(c) => c.id === selectedClipId && splitAt > c.startMs && splitAt < c.endMs,
						)
					: null) ??
				clipRegions.find((c) => splitAt > c.startMs && splitAt < c.endMs);

			if (!targetClip) return;

			const deleteStart = targetClip.startMs;
			const deleteEnd = splitAt;
			const delta = deleteEnd - deleteStart;
			if (delta <= 0) return;

			const speed = Number.isFinite(targetClip.speed) && targetClip.speed > 0 ? targetClip.speed : 1;
			const newSourceStartMs = Math.max(0, Math.round((targetClip.sourceStartMs ?? 0) + delta * speed));

			// 1. Ripple video clips
			setClipRegions((current) =>
				current
					.map((c) => {
						if (c.id === targetClip.id) {
							return {
								...c,
								startMs: deleteStart,
								endMs: c.endMs - delta,
								sourceStartMs: newSourceStartMs,
							};
						}
						if (c.startMs >= targetClip.endMs) {
							return {
								...c,
								startMs: c.startMs - delta,
								endMs: c.endMs - delta,
							};
						}
						return c;
					})
					.filter((c) => c.endMs > c.startMs),
			);

			// 2. Ripple other timeline regions (zooms, annotations, captions, audio, speed)
			const rippleRegions = <T extends { startMs: number; endMs: number }>(regions: T[]): T[] => {
				return regions
					.filter((r) => !(r.startMs >= deleteStart && r.endMs <= deleteEnd))
					.map((r) => {
						if (r.startMs < deleteStart && r.endMs > deleteStart && r.endMs <= deleteEnd) {
							return { ...r, endMs: deleteStart };
						}
						if (r.startMs >= deleteStart && r.startMs < deleteEnd && r.endMs > deleteEnd) {
							return { ...r, startMs: deleteStart, endMs: r.endMs - delta };
						}
						if (r.startMs < deleteStart && r.endMs > deleteEnd) {
							return { ...r, endMs: r.endMs - delta };
						}
						if (r.startMs >= deleteEnd) {
							return { ...r, startMs: r.startMs - delta, endMs: r.endMs - delta };
						}
						return r;
					})
					.filter((r) => r.endMs > r.startMs);
			};

			setZoomRegions((current) => rippleRegions(current));
			setAnnotationRegions((current) => rippleRegions(current));
			setSpeedRegions((current) => rippleRegions(current));
			setAudioRegions((current) => rippleRegions(current));

			// 3. Move playhead to the cut point
			handleSeek?.(deleteStart / 1000);
			setSelectedClipId(targetClip.id);
		},
		[
			clipRegions,
			handleSeek,
			selectedClipId,
			setAnnotationRegions,
			setAudioRegions,
			setClipRegions,
			setSelectedClipId,
			setSpeedRegions,
			setZoomRegions,
		],
	);

	const handleRippleDeleteRight = useCallback(
		(currentMs: number) => {
			const splitAt = Math.round(currentMs);
			const targetClip =
				(selectedClipId
					? clipRegions.find(
							(c) => c.id === selectedClipId && splitAt > c.startMs && splitAt < c.endMs,
						)
					: null) ??
				clipRegions.find((c) => splitAt > c.startMs && splitAt < c.endMs);

			if (!targetClip) return;

			const deleteStart = splitAt;
			const deleteEnd = targetClip.endMs;
			const delta = deleteEnd - deleteStart;
			if (delta <= 0) return;

			// 1. Ripple video clips
			setClipRegions((current) =>
				current
					.map((c) => {
						if (c.id === targetClip.id) {
							return {
								...c,
								endMs: splitAt,
							};
						}
						if (c.startMs >= targetClip.endMs) {
							return {
								...c,
								startMs: c.startMs - delta,
								endMs: c.endMs - delta,
							};
						}
						return c;
					})
					.filter((c) => c.endMs > c.startMs),
			);

			// 2. Ripple other timeline regions
			const rippleRegions = <T extends { startMs: number; endMs: number }>(regions: T[]): T[] => {
				return regions
					.filter((r) => !(r.startMs >= deleteStart && r.endMs <= deleteEnd))
					.map((r) => {
						if (r.startMs < deleteStart && r.endMs > deleteStart && r.endMs <= deleteEnd) {
							return { ...r, endMs: deleteStart };
						}
						if (r.startMs >= deleteStart && r.startMs < deleteEnd && r.endMs > deleteEnd) {
							return { ...r, startMs: deleteStart, endMs: r.endMs - delta };
						}
						if (r.startMs < deleteStart && r.endMs > deleteEnd) {
							return { ...r, endMs: r.endMs - delta };
						}
						if (r.startMs >= deleteEnd) {
							return { ...r, startMs: r.startMs - delta, endMs: r.endMs - delta };
						}
						return r;
					})
					.filter((r) => r.endMs > r.startMs);
			};

			setZoomRegions((current) => rippleRegions(current));
			setAnnotationRegions((current) => rippleRegions(current));
			setSpeedRegions((current) => rippleRegions(current));
			setAudioRegions((current) => rippleRegions(current));

			setSelectedClipId(targetClip.id);
		},
		[
			clipRegions,
			selectedClipId,
			setAnnotationRegions,
			setAudioRegions,
			setClipRegions,
			setSelectedClipId,
			setSpeedRegions,
			setZoomRegions,
		],
	);

	const clipClipboardRef = useRef<Omit<ClipRegion, "id"> | null>(null);

	const handleClipCopy = useCallback(
		(targetClipId?: string | null) => {
			const id = targetClipId ?? selectedClipId;
			const target = clipRegions.find((c) => c.id === id);
			if (!target) {
				toast.error(t("editor.clipboard.noSelection", "No clip selected to copy"));
				return;
			}
			const { id: _id, ...clipData } = target;
			clipClipboardRef.current = clipData;
			toast.success(t("editor.clipboard.copied", "Clip copied to clipboard"));
		},
		[clipRegions, selectedClipId, t],
	);

	const handleClipPaste = useCallback(
		(pasteAtMs?: number) => {
			const clipData = clipClipboardRef.current;
			if (!clipData) {
				toast.error(t("editor.clipboard.empty", "Clipboard is empty"));
				return;
			}
			const targetStartMs = pasteAtMs ?? 0;
			const durationMs = clipData.endMs - clipData.startMs;
			const newId = `clip-${nextClipIdRef.current++}`;

			const newClip: ClipRegion = {
				...clipData,
				id: newId,
				startMs: targetStartMs,
				endMs: targetStartMs + durationMs,
			};

			setClipRegions((current) => {
				const updated = current.map((c) => {
					if (c.startMs >= targetStartMs) {
						return { ...c, startMs: c.startMs + durationMs, endMs: c.endMs + durationMs };
					}
					return c;
				});
				return [...updated, newClip].sort((a, b) => a.startMs - b.startMs);
			});

			setSelectedClipId(newId);
			toast.success(t("editor.clipboard.pasted", "Clip pasted"));
		},
		[nextClipIdRef, setClipRegions, setSelectedClipId, t],
	);

	const handleClipDuplicate = useCallback(
		(targetClipId?: string | null) => {
			const id = targetClipId ?? selectedClipId;
			const target = clipRegions.find((c) => c.id === id);
			if (!target) return;

			const durationMs = target.endMs - target.startMs;
			const newId = `clip-${nextClipIdRef.current++}`;
			const newClip: ClipRegion = {
				...target,
				id: newId,
				startMs: target.endMs,
				endMs: target.endMs + durationMs,
			};

			setClipRegions((current) => {
				const updated = current.map((c) => {
					if (c.id === target.id) return c;
					if (c.startMs >= target.endMs) {
						return { ...c, startMs: c.startMs + durationMs, endMs: c.endMs + durationMs };
					}
					return c;
				});
				return [...updated, newClip].sort((a, b) => a.startMs - b.startMs);
			});

			setSelectedClipId(newId);
			toast.success(t("editor.clipboard.duplicated", "Clip duplicated"));
		},
		[clipRegions, nextClipIdRef, selectedClipId, setClipRegions, setSelectedClipId, t],
	);

	return {
		handleSelectClip,
		handleClipSplit,
		handleClipSpanChange,
		handleClipSpeedChange,
		handleClipMutedChange,
		handleClipShowSourceAudioChange,
		handleClipDelete,
		handleRippleDeleteLeft,
		handleRippleDeleteRight,
		handleClipCopy,
		handleClipPaste,
		handleClipDuplicate,
	};
}
