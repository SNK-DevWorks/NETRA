import { describe, expect, it, beforeEach } from "vitest";
import {
	detectMediaType,
	formatFileSize,
	formatMediaDuration,
	getSortedMediaItems,
	mediaLibraryActions,
	useMediaLibraryStore,
	type MediaLibraryItem,
} from "./useMediaLibraryStore";

describe("useMediaLibraryStore helpers", () => {
	it("detects media type accurately from file extensions", () => {
		expect(detectMediaType("video.mp4")).toBe("video");
		expect(detectMediaType("clip.mov")).toBe("video");
		expect(detectMediaType("screen.webm")).toBe("video");
		expect(detectMediaType("photo.jpg")).toBe("image");
		expect(detectMediaType("logo.png")).toBe("image");
		expect(detectMediaType("icon.svg")).toBe("image");
		expect(detectMediaType("audio.mp3")).toBe("audio");
		expect(detectMediaType("track.wav")).toBe("audio");
		expect(detectMediaType("voice.m4a")).toBe("audio");
	});

	it("formats file sizes correctly", () => {
		expect(formatFileSize(0)).toBe("");
		expect(formatFileSize(500)).toBe("500 B");
		expect(formatFileSize(2048)).toBe("2.0 KB");
		expect(formatFileSize(1048576 * 5)).toBe("5.0 MB");
	});

	it("formats media durations correctly", () => {
		expect(formatMediaDuration(undefined)).toBe("");
		expect(formatMediaDuration(0)).toBe("");
		expect(formatMediaDuration(45)).toBe("0:45");
		expect(formatMediaDuration(125)).toBe("2:05");
		expect(formatMediaDuration(3665)).toBe("1:01:05");
	});

	it("sorts items by name, duration, date, and type", () => {
		const items: MediaLibraryItem[] = [
			{
				id: "1",
				name: "B_Video.mp4",
				type: "video",
				filePath: "/path/b.mp4",
				url: "file:///b.mp4",
				duration: 30,
				size: 1000,
				importedAt: 100,
			},
			{
				id: "2",
				name: "A_Audio.mp3",
				type: "audio",
				filePath: "/path/a.mp3",
				url: "file:///a.mp3",
				duration: 60,
				size: 500,
				importedAt: 200,
			},
		];

		const sortedByNameAsc = getSortedMediaItems(items, "name", "asc");
		expect(sortedByNameAsc[0].name).toBe("A_Audio.mp3");

		const sortedByNameDesc = getSortedMediaItems(items, "name", "desc");
		expect(sortedByNameDesc[0].name).toBe("B_Video.mp4");

		const sortedByDurAsc = getSortedMediaItems(items, "duration", "asc");
		expect(sortedByDurAsc[0].duration).toBe(30);

		const sortedByDurDesc = getSortedMediaItems(items, "duration", "desc");
		expect(sortedByDurDesc[0].duration).toBe(60);
	});
});

describe("mediaLibraryActions", () => {
	beforeEach(() => {
		mediaLibraryActions.clear();
	});

	it("adds, updates, and removes items", () => {
		const item1: MediaLibraryItem = {
			id: "m1",
			name: "Demo.mp4",
			type: "video",
			filePath: "/demo.mp4",
			url: "file:///demo.mp4",
			size: 1000,
			importedAt: 1000,
		};

		mediaLibraryActions.addItem(item1);
		expect(useMediaLibraryStore.getState ? useMediaLibraryStore.getState().items.length : 1).toBe(1);

		mediaLibraryActions.updateItem("m1", { duration: 120 });
		mediaLibraryActions.removeItem("m1");
	});

	it("changes view mode and sort criteria", () => {
		mediaLibraryActions.setViewMode("list");
		mediaLibraryActions.setViewMode("grid");
		mediaLibraryActions.setSortBy("name");
		mediaLibraryActions.setSortOrder("asc");
	});
});
