type DashSegment = {
  index: number;
  url: string;
  startSeconds: number;
  durationSeconds: number;
};

export type DashManifestModel = {
  mimeType: string;
  codecs: string;
  initializationUrl: string;
  segments: DashSegment[];
  totalDurationSeconds: number;
};

function parseIsoDurationSeconds(value: string | null): number {
  if (!value) {
    return 0;
  }

  const match = /^P(?:\d+Y)?(?:\d+M)?(?:\d+D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(
    value.trim()
  );
  if (!match) {
    return 0;
  }

  const hours = match[1] ? Number.parseFloat(match[1]) : 0;
  const minutes = match[2] ? Number.parseFloat(match[2]) : 0;
  const seconds = match[3] ? Number.parseFloat(match[3]) : 0;
  return hours * 3600 + minutes * 60 + seconds;
}

function resolveNumberTemplate(template: string, value: number): string {
  return template.replace(/\$Number(?:%0(\d+)d)?\$/g, (_full, widthText: string | undefined) => {
    if (!widthText) {
      return String(value);
    }
    return String(value).padStart(Number.parseInt(widthText, 10), "0");
  });
}

function normalizeRelativePath(pathValue: string): string {
  return pathValue.replace(/^\.\//, "").replace(/^\/+/, "");
}

function toSegmentApiUrl(videoId: string, pathValue: string): string {
  const normalized = normalizeRelativePath(pathValue);
  const encodedPath = normalized
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `/api/dash/${videoId}/segment/${encodedPath}`;
}

export function findSegmentIndexByTime(segments: DashSegment[], target: number): number {
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (target < segment.startSeconds + segment.durationSeconds || index === segments.length - 1) {
      return index;
    }
  }
  return 0;
}

export function getBufferedSeconds(videoEl: HTMLVideoElement): number {
  let total = 0;
  for (let index = 0; index < videoEl.buffered.length; index += 1) {
    total += videoEl.buffered.end(index) - videoEl.buffered.start(index);
  }
  return total;
}

export function getBufferedUntil(videoEl: HTMLVideoElement, currentTime: number): number {
  const buffered = videoEl.buffered;
  let maxEnd = 0;

  for (let index = 0; index < buffered.length; index += 1) {
    const start = buffered.start(index);
    const end = buffered.end(index);
    if (end > maxEnd) {
      maxEnd = end;
    }
    if (currentTime >= start && currentTime <= end) {
      return end;
    }
  }

  return maxEnd;
}

export function parseDashManifest(mpdText: string, videoId: string): DashManifestModel {
  const parser = new DOMParser();
  const xml = parser.parseFromString(mpdText, "application/xml");
  if (xml.querySelector("parsererror")) {
    throw new Error("Invalid MPD");
  }

  const mpd = xml.querySelector("MPD");
  const period = mpd?.querySelector("Period");
  const adaptationSet = period?.querySelector("AdaptationSet") ?? null;
  const representation = adaptationSet?.querySelector("Representation") ?? null;
  const segmentTemplate =
    representation?.querySelector("SegmentTemplate") ?? adaptationSet?.querySelector("SegmentTemplate") ?? null;

  if (!mpd || !period || !adaptationSet || !representation || !segmentTemplate) {
    throw new Error("Missing DASH representation details");
  }

  const mimeType = representation.getAttribute("mimeType") ?? adaptationSet.getAttribute("mimeType") ?? "video/mp4";
  const codecs = representation.getAttribute("codecs") ?? adaptationSet.getAttribute("codecs") ?? "";
  if (!codecs) {
    throw new Error("Missing codecs in MPD");
  }

  const initializationTemplate = segmentTemplate.getAttribute("initialization");
  const mediaTemplate = segmentTemplate.getAttribute("media");
  if (!initializationTemplate || !mediaTemplate) {
    throw new Error("Missing DASH segment template");
  }

  const representationId = representation.getAttribute("id") ?? "0";
  const timescale = Number.parseInt(segmentTemplate.getAttribute("timescale") ?? "1", 10) || 1;
  const startNumber = Number.parseInt(segmentTemplate.getAttribute("startNumber") ?? "1", 10) || 1;
  const durationTicks = Number.parseInt(segmentTemplate.getAttribute("duration") ?? "0", 10) || 0;

  const timelineEntries = segmentTemplate.querySelectorAll("SegmentTimeline > S");
  const timelineValues: { start: number; durationTicks: number }[] = [];

  if (timelineEntries.length > 0) {
    let current = 0;
    timelineEntries.forEach((entry) => {
      const duration = Number.parseInt(entry.getAttribute("d") ?? "0", 10);
      if (!duration) {
        return;
      }

      const explicitTime = entry.getAttribute("t");
      if (explicitTime) {
        current = Number.parseInt(explicitTime, 10);
      }

      const repeat = Number.parseInt(entry.getAttribute("r") ?? "0", 10);
      const repeatSafe = repeat >= 0 && Number.isFinite(repeat) ? repeat : 0;
      for (let index = 0; index <= repeatSafe; index += 1) {
        timelineValues.push({ start: current, durationTicks: duration });
        current += duration;
      }
    });
  }

  const mpdDuration =
    parseIsoDurationSeconds(mpd.getAttribute("mediaPresentationDuration")) ||
    parseIsoDurationSeconds(period.getAttribute("duration"));

  if (timelineValues.length === 0) {
    if (!durationTicks || !mpdDuration) {
      throw new Error("Unable to derive DASH segment timeline");
    }
    const count = Math.ceil((mpdDuration * timescale) / durationTicks);
    for (let index = 0; index < count; index += 1) {
      timelineValues.push({ start: index * durationTicks, durationTicks });
    }
  }

  const initializationPath = initializationTemplate.replace(/\$RepresentationID\$/g, representationId);
  const segments: DashSegment[] = timelineValues.map((segment, index) => {
    const mediaPath = resolveNumberTemplate(
      mediaTemplate.replace(/\$RepresentationID\$/g, representationId).replace(/\$Time\$/g, String(segment.start)),
      startNumber + index
    );
    return {
      index,
      url: toSegmentApiUrl(videoId, mediaPath),
      startSeconds: segment.start / timescale,
      durationSeconds: segment.durationTicks / timescale
    };
  });

  return {
    mimeType,
    codecs,
    initializationUrl: toSegmentApiUrl(videoId, initializationPath),
    segments,
    totalDurationSeconds: segments.reduce((sum, segment) => sum + segment.durationSeconds, 0)
  };
}
