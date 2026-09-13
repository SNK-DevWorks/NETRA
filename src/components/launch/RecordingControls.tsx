import {
	MicrophoneIcon,
	MicrophoneSlashIcon,
	MinusIcon,
	PauseIcon,
	PlayIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useMemo } from "react";
import { useScopedT } from "@/contexts/I18nContext";
import styles from "./LaunchWindow.module.css";

interface RecordingControlsProps {
	paused: boolean;
	microphoneEnabled: boolean;
	elapsed: number;
	onToggleMicrophone: () => void;
	onPauseResume: () => void;
	onStopRecording: () => void;
	onHideHud: () => void;
	onCancelRecording: () => void;
	formatTime: (seconds: number) => string;
}

export const RecordingControls = ({
	paused,
	microphoneEnabled,
	elapsed,
	onToggleMicrophone,
	onPauseResume,
	onStopRecording,
	onHideHud,
	onCancelRecording,
	formatTime,
}: RecordingControlsProps) => {
	const t = useScopedT("launch");

	const memoizedControls = useMemo(() => {
		return (
			<>
				<div className={styles.recStatusPill}>
					<div
						className={`w-[7px] h-[7px] rounded-full shrink-0 ${
							paused ? "bg-[#fbbf24]" : `bg-[#f43f5e] ${styles.recDotBlink}`
						}`}
					/>
					<span
						className={`text-[11px] font-bold tracking-wider ${
							paused ? "text-[#fbbf24]" : "text-[#f43f5e]"
						}`}
					>
						{paused ? t("recording.paused") : t("recording.rec")}
					</span>
					<span
						className={`font-mono text-[12px] font-semibold min-w-[48px] text-center tracking-normal ${
							paused ? "text-[#fbbf24]" : "text-[var(--launch-text)]"
						}`}
					>
						{formatTime(elapsed)}
					</span>
				</div>

				<div className={styles.sep} />

				<button
					type="button"
					className={`${styles.pillBtn} ${styles.electronNoDrag} ${microphoneEnabled ? styles.pillBtnActive : ""}`}
					title={t("recording.micToggleDisabledTip")}
					aria-label={t("recording.micToggleDisabledTip")}
					disabled
					onClick={onToggleMicrophone}
				>
					{microphoneEnabled ? (
						<MicrophoneIcon size={18} />
					) : (
						<MicrophoneSlashIcon size={18} />
					)}
				</button>

				<div className={styles.sep} />

				<button
					type="button"
					className={`${styles.pillBtn} ${styles.electronNoDrag} ${paused ? styles.pillBtnPaused : ""}`}
					onClick={onPauseResume}
					title={paused ? t("recording.resume") : t("recording.pause")}
					aria-label={paused ? t("recording.resume") : t("recording.pause")}
				>
					{paused ? (
						<PlayIcon size={18} weight="fill" />
					) : (
						<PauseIcon size={18} weight="fill" />
					)}
				</button>

				<button
					type="button"
					onClick={onStopRecording}
					title={t("recording.stop")}
					aria-label={t("recording.stop")}
					className={`${styles.recBtn} ${styles.electronNoDrag}`}
				>
					<span className={styles.stopSquare} />
				</button>

				<button
					type="button"
					onClick={onHideHud}
					title={t("recording.hideHud")}
					aria-label={t("recording.hideHud")}
					className={`${styles.pillBtn} ${styles.electronNoDrag}`}
				>
					<MinusIcon size={16} weight="bold" />
				</button>

				<button
					type="button"
					onClick={onCancelRecording}
					title={t("recording.cancel")}
					aria-label={t("recording.cancel")}
					className={`${styles.pillBtn} ${styles.pillBtnClose} ${styles.electronNoDrag}`}
				>
					<XIcon size={16} weight="bold" />
				</button>
			</>
		);
	}, [
		paused,
		microphoneEnabled,
		elapsed,
		onToggleMicrophone,
		onPauseResume,
		onStopRecording,
		onHideHud,
		onCancelRecording,
		formatTime,
		t,
	]);

	return memoizedControls;
};
