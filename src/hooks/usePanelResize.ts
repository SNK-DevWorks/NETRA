import { useCallback, useEffect, useRef, useState } from "react";

export type PanelResizeDirection = "horizontal" | "vertical";

interface UsePanelResizeOptions {
	storageKey: string;
	defaultSize: number;
	min: number;
	max: number;
	direction: PanelResizeDirection;
	/** If true, the drag increases size when moving left/up (for right/bottom panels) */
	reverse?: boolean;
}

interface UsePanelResizeResult {
	size: number;
	isDragging: boolean;
	dividerProps: {
		onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
	};
}

function loadSize(key: string, fallback: number): number {
	try {
		const stored = localStorage.getItem(key);
		if (stored !== null) {
			const parsed = Number(stored);
			if (Number.isFinite(parsed) && parsed > 0) return parsed;
		}
	} catch {
		// ignore
	}
	return fallback;
}

function saveSize(key: string, value: number): void {
	try {
		localStorage.setItem(key, String(value));
	} catch {
		// ignore
	}
}

export function usePanelResize({
	storageKey,
	defaultSize,
	min,
	max,
	direction,
	reverse = false,
}: UsePanelResizeOptions): UsePanelResizeResult {
	const [size, setSize] = useState(() => {
		const loaded = loadSize(storageKey, defaultSize);
		return Math.max(min, Math.min(max, loaded));
	});
	const [isDragging, setIsDragging] = useState(false);
	const startPosRef = useRef(0);
	const startSizeRef = useRef(0);

	const onPointerDown = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			e.preventDefault();
			(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
			startPosRef.current = direction === "horizontal" ? e.clientX : e.clientY;
			startSizeRef.current = size;
			setIsDragging(true);
		},
		[direction, size],
	);

	useEffect(() => {
		if (!isDragging) return;

		const onPointerMove = (e: PointerEvent) => {
			const pos = direction === "horizontal" ? e.clientX : e.clientY;
			const delta = (pos - startPosRef.current) * (reverse ? -1 : 1);
			const next = Math.max(min, Math.min(max, startSizeRef.current + delta));
			setSize(next);
		};

		const onPointerUp = (e: PointerEvent) => {
			const pos = direction === "horizontal" ? e.clientX : e.clientY;
			const delta = (pos - startPosRef.current) * (reverse ? -1 : 1);
			const next = Math.max(min, Math.min(max, startSizeRef.current + delta));
			setSize(next);
			saveSize(storageKey, next);
			setIsDragging(false);
		};

		window.addEventListener("pointermove", onPointerMove);
		window.addEventListener("pointerup", onPointerUp);
		return () => {
			window.removeEventListener("pointermove", onPointerMove);
			window.removeEventListener("pointerup", onPointerUp);
		};
	}, [isDragging, direction, reverse, min, max, storageKey]);

	return {
		size,
		isDragging,
		dividerProps: { onPointerDown },
	};
}
