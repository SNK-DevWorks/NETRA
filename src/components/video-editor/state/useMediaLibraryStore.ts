/**
 * Media Library Store
 *
 * Manages the collection of imported media files (video, image, audio) that
 * users can drag onto the timeline. Built using React's native useSyncExternalStore
 * for zero-dependency, type-safe global reactive state matching OpenCut Classic.
 */

import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { fromFileUrl, resolveVideoUrl } from "../projectPersistence";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type MediaLibraryItemType = "video" | "image" | "audio";
export type MediaViewMode = "grid" | "list";
export type MediaSortBy = "name" | "date" | "type" | "duration";
export type MediaSortOrder = "asc" | "desc";

export interface MediaLibraryItem {
	/** Unique stable ID for this item in the library */
	id: string;
	/** Original filename */
	name: string;
	/** Media type */
	type: MediaLibraryItemType;
	/** Absolute file path on disk (Electron) */
	filePath: string;
	/** URL for playback (from local media server or file://) */
	url: string;
	/** Duration in seconds (video/audio only) */
	duration?: number;
	/** Native resolution */
	width?: number;
	height?: number;
	/** Base64-encoded thumbnail / image preview */
	thumbnailUrl?: string;
	/** File size in bytes */
	size: number;
	/** Timestamp when added */
	importedAt: number;
}

export interface MediaLibraryState {
	items: MediaLibraryItem[];
	viewMode: MediaViewMode;
	sortBy: MediaSortBy;
	sortOrder: MediaSortOrder;
	isImporting: boolean;
	selectedMediaId: string | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function generateMediaId(): string {
	return `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Detect media type from extension */
export function detectMediaType(fileName: string): MediaLibraryItemType {
	const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
	const videoExts = ["mp4", "mov", "avi", "mkv", "webm", "m4v", "flv", "wmv", "3gp"];
	const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "tiff", "avif"];
	const audioExts = ["mp3", "wav", "ogg", "m4a", "aac", "flac", "opus", "wma"];
	if (videoExts.includes(ext)) return "video";
	if (imageExts.includes(ext)) return "image";
	if (audioExts.includes(ext)) return "audio";
	return "video";
}

/** Format bytes as human-readable string */
export function formatFileSize(bytes: number): string {
	if (!bytes || bytes <= 0) return "";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Format duration in seconds to MM:SS or HH:MM:SS */
export function formatMediaDuration(seconds: number | undefined): string {
	if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return "";
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
	return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Thumbnail & Metadata Generation ──────────────────────────────────────────

/** Generate a thumbnail data-URL from a video URL using an in-memory HTMLVideoElement */
export async function generateVideoThumbnail(url: string): Promise<string | null> {
	return new Promise((resolve) => {
		const video = document.createElement("video");
		video.crossOrigin = "anonymous";
		video.src = url;
		video.muted = true;
		video.preload = "metadata";

		let resolved = false;
		const done = (val: string | null) => {
			if (!resolved) {
				resolved = true;
				try {
					video.pause();
					video.removeAttribute("src");
					video.load();
				} catch {
					// Ignore cleanup errors
				}
				resolve(val);
			}
		};

		video.addEventListener(
			"loadeddata",
			() => {
				video.currentTime = Math.min(1, Math.max(0.1, (video.duration || 1) * 0.1));
			},
			{ once: true },
		);

		video.addEventListener(
			"seeked",
			() => {
				try {
					const canvas = document.createElement("canvas");
					const W = 200;
					const ratio = (video.videoHeight || 9) / (video.videoWidth || 16);
					canvas.width = W;
					canvas.height = Math.max(20, Math.round(W * ratio));
					const ctx = canvas.getContext("2d");
					if (!ctx) {
						done(null);
						return;
					}
					ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
					done(canvas.toDataURL("image/jpeg", 0.75));
				} catch {
					done(null);
				}
			},
			{ once: true },
		);

		video.addEventListener("error", () => done(null), { once: true });
		setTimeout(() => done(null), 5000);
	});
}

/** Get duration of a video/audio from URL */
export async function getMediaDuration(url: string, type: MediaLibraryItemType): Promise<number> {
	return new Promise((resolve) => {
		const el = type === "audio" ? document.createElement("audio") : document.createElement("video");
		el.src = url;
		el.preload = "metadata";
		let resolved = false;
		const done = (dur: number) => {
			if (!resolved) {
				resolved = true;
				try {
					el.pause();
					el.removeAttribute("src");
					el.load();
				} catch {
					// Ignore cleanup errors
				}
				resolve(dur);
			}
		};

		el.addEventListener("loadedmetadata", () => done(el.duration || 0), { once: true });
		el.addEventListener("error", () => done(0), { once: true });
		setTimeout(() => done(0), 4000);
	});
}

/** Get image dimensions */
export async function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
		img.onerror = () => resolve({ width: 0, height: 0 });
		img.src = url;
	});
}

// ─── Process a file path → MediaLibraryItem ───────────────────────────────────

export async function processMediaFile(
	rawPath: string,
	overrideType?: MediaLibraryItemType,
): Promise<MediaLibraryItem | null> {
	try {
		const filePath = fromFileUrl(rawPath);
		const name = filePath.split(/[\\/]/).pop() ?? filePath;
		const type = overrideType ?? detectMediaType(name);
		const url = await resolveVideoUrl(filePath);

		let duration: number | undefined;
		let width: number | undefined;
		let height: number | undefined;
		let thumbnailUrl: string | undefined;

		if (type === "video") {
			duration = await getMediaDuration(url, "video");
			thumbnailUrl = (await generateVideoThumbnail(url)) ?? undefined;
		} else if (type === "audio") {
			duration = await getMediaDuration(url, "audio");
		} else if (type === "image") {
			const dims = await getImageDimensions(url);
			width = dims.width;
			height = dims.height;
			thumbnailUrl = url;
		}

		return {
			id: generateMediaId(),
			name,
			type,
			filePath,
			url,
			duration,
			width,
			height,
			thumbnailUrl,
			size: 0,
			importedAt: Date.now(),
		};
	} catch {
		return null;
	}
}

// ─── Storage Persistence ──────────────────────────────────────────────────────

const STORAGE_KEY = "netra:media-library:v1";

function loadInitialState(): MediaLibraryState {
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			const parsed = JSON.parse(saved);
			return {
				items: Array.isArray(parsed.items) ? parsed.items : [],
				viewMode: parsed.viewMode === "list" ? "list" : "grid",
				sortBy: parsed.sortBy || "date",
				sortOrder: parsed.sortOrder || "desc",
				isImporting: false,
				selectedMediaId: null,
			};
		}
	} catch {
		// Ignore storage load errors
	}
	return {
		items: [],
		viewMode: "grid",
		sortBy: "date",
		sortOrder: "desc",
		isImporting: false,
		selectedMediaId: null,
	};
}

function persistState(state: MediaLibraryState) {
	try {
		const data = {
			items: state.items,
			viewMode: state.viewMode,
			sortBy: state.sortBy,
			sortOrder: state.sortOrder,
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch {
		// Ignore storage errors (quota, etc.)
	}
}

// ─── Global State & Subscribers ───────────────────────────────────────────────

let currentState: MediaLibraryState = loadInitialState();
const listeners = new Set<() => void>();

function notify() {
	persistState(currentState);
	for (const listener of listeners) {
		listener();
	}
}

function setState(
	updater: Partial<MediaLibraryState> | ((prev: MediaLibraryState) => Partial<MediaLibraryState>),
) {
	if (typeof updater === "function") {
		currentState = { ...currentState, ...updater(currentState) };
	} else {
		currentState = { ...currentState, ...updater };
	}
	notify();
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

function getSnapshot(): MediaLibraryState {
	return currentState;
}

// ─── Exported Store Actions ───────────────────────────────────────────────────

export const mediaLibraryActions = {
	addItem: (item: MediaLibraryItem) => {
		setState((prev) => ({
			items: [item, ...prev.items.filter((x) => x.filePath !== item.filePath)],
		}));
	},
	addItems: (newItems: MediaLibraryItem[]) => {
		setState((prev) => {
			const existingPaths = new Set(newItems.map((n) => n.filePath));
			const kept = prev.items.filter((x) => !existingPaths.has(x.filePath));
			return { items: [...newItems, ...kept] };
		});
	},
	removeItem: (id: string) => {
		setState((prev) => ({
			items: prev.items.filter((x) => x.id !== id),
			selectedMediaId: prev.selectedMediaId === id ? null : prev.selectedMediaId,
		}));
	},
	updateItem: (id: string, updates: Partial<MediaLibraryItem>) => {
		setState((prev) => ({
			items: prev.items.map((x) => (x.id === id ? { ...x, ...updates } : x)),
		}));
	},
	setViewMode: (viewMode: MediaViewMode) => {
		setState({ viewMode });
	},
	setSortBy: (sortBy: MediaSortBy) => {
		setState((prev) => ({
			sortBy,
			sortOrder: prev.sortBy === sortBy ? (prev.sortOrder === "asc" ? "desc" : "asc") : "asc",
		}));
	},
	setSortOrder: (sortOrder: MediaSortOrder) => {
		setState({ sortOrder });
	},
	setSelectedMediaId: (selectedMediaId: string | null) => {
		setState({ selectedMediaId });
	},
	setIsImporting: (isImporting: boolean) => {
		setState({ isImporting });
	},
	clear: () => {
		setState({ items: [], selectedMediaId: null });
	},
};

// ─── Import Logic via Electron IPC ────────────────────────────────────────────

export async function importMediaFiles() {
	try {
		mediaLibraryActions.setIsImporting(true);

		const result = await window.electronAPI.openVideoFilePicker({ includeProjects: false });

		if (result.canceled || !result.path) {
			mediaLibraryActions.setIsImporting(false);
			return;
		}

		const filePath = fromFileUrl(result.path);
		const item = await processMediaFile(filePath);
		if (item) {
			mediaLibraryActions.addItem(item);
			toast.success(`Imported "${item.name}"`);
		} else {
			toast.error("Failed to read media file");
		}
	} catch (err) {
		toast.error(`Import failed: ${String(err)}`);
	} finally {
		mediaLibraryActions.setIsImporting(false);
	}
}

// ─── React Hook ───────────────────────────────────────────────────────────────

export function useMediaLibraryStore<T = MediaLibraryState>(
	selector?: (state: MediaLibraryState) => T,
): T {
	const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
	return selector ? selector(state) : (state as unknown as T);
}

// ─── Sorted Items Selector ────────────────────────────────────────────────────

export function getSortedMediaItems(
	items: MediaLibraryItem[],
	sortBy: MediaSortBy,
	sortOrder: MediaSortOrder,
): MediaLibraryItem[] {
	return [...items].sort((a, b) => {
		let valA: string | number;
		let valB: string | number;

		switch (sortBy) {
			case "name":
				valA = a.name.toLowerCase();
				valB = b.name.toLowerCase();
				break;
			case "type":
				valA = a.type;
				valB = b.type;
				break;
			case "duration":
				valA = a.duration || 0;
				valB = b.duration || 0;
				break;
			case "date":
			default:
				valA = a.importedAt;
				valB = b.importedAt;
				break;
		}

		if (valA < valB) return sortOrder === "asc" ? -1 : 1;
		if (valA > valB) return sortOrder === "asc" ? 1 : -1;
		return 0;
	});
}
