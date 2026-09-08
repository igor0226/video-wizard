"use client";

import { TimeSlider, type TimeSliderInstance } from "@vidstack/react";
import {
	useDefaultLayoutContext,
	useDefaultLayoutWord,
} from "@vidstack/react/player/layouts/default";
import { useEffect, useState } from "react";

function isExplanationCue(cue: { text: string }): boolean {
	return cue.text.trim().length > 0;
}

export function PhraseTimeSlider() {
	const [instance, setInstance] = useState<TimeSliderInstance | null>(null);
	const [width, setWidth] = useState(0);
	const {
		sliderChaptersMinWidth,
		disableTimeSlider,
		seekStep,
		noScrubGesture,
	} = useDefaultLayoutContext();
	const label = useDefaultLayoutWord("Seek");

	useEffect(() => {
		const element = instance?.el;
		if (!element) {
			return;
		}

		const observer = new ResizeObserver(() => {
			setWidth(element.clientWidth);
		});

		observer.observe(element);
		setWidth(element.clientWidth);

		return () => observer.disconnect();
	}, [instance]);

	return (
		<TimeSlider.Root
			className="vds-time-slider vds-slider"
			aria-label={label}
			disabled={disableTimeSlider}
			noSwipeGesture={noScrubGesture}
			keyStep={seekStep}
			ref={setInstance}
		>
			<TimeSlider.Chapters
				className="vds-slider-chapters"
				disabled={width < (sliderChaptersMinWidth ?? 325)}
			>
				{(cues, forwardRef) =>
					cues.map((cue) => (
						<div
							className="vds-slider-chapter"
							data-explanation={isExplanationCue(cue) ? "" : undefined}
							key={cue.startTime}
							ref={forwardRef}
						>
							<TimeSlider.Track className="vds-slider-track" />
							<TimeSlider.TrackFill className="vds-slider-track-fill vds-slider-track" />
							<TimeSlider.Progress className="vds-slider-progress vds-slider-track" />
						</div>
					))
				}
			</TimeSlider.Chapters>
			<TimeSlider.Thumb className="vds-slider-thumb" />
			<TimeSlider.Preview className="vds-slider-preview">
				<TimeSlider.ChapterTitle className="vds-slider-chapter-title" />
				<TimeSlider.Value className="vds-slider-value" />
			</TimeSlider.Preview>
		</TimeSlider.Root>
	);
}
