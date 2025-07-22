import {
  isAudioTrack,
  isGeneralTrack,
  isVideoTrack,
  type MediainfoFromHash,
} from "@blaahaj/dropbox-hacking-mediainfo-db";
import { combineLatest, map, type ObservedValueOf } from "rxjs";

import type { DayMetadata } from "../types.js";
import type { NamedFile, PhotoDbEntry } from "../ws.js";
import { type FullDatabaseFeeds } from "./index.js";

export type VideoRequest = {
  readonly type: "rx.ng.video";
};

// export type VideoResult = ReturnType<typeof newFunction>;
// export type VideoResult = ObservedValueOf<ReturnType<typeof provideVideo>>;
export type VideoResult = {
  namedFile: NamedFile;
  photoDbEntry: PhotoDbEntry | null;
  day: DayMetadata | null;
  mediaInfoSummary: MediaInfoSummary;
}[];

export type MediaInfoSummary = {
  general: {
    format: string;
    codec: string;
    duration: number;
    gps: string;
  } | null;
  video: {
    format: string;
    codec: string;
    duration: number;
    widthAndHeight: { width: number; height: number };
    contentType: string;
    aspectRatio: { number: number; string: string };
  } | null;
  audio: {
    format: string;
    codec: string;
    duration: number;
    channels: number;
    samplingRate: number;
  } | null;
};

export const summariseMediaInfo = (
  mediaInfo: MediainfoFromHash,
): MediaInfoSummary => {
  const tracks = mediaInfo.mediainfoData.media?.track;
  const generalTrack = tracks?.find(isGeneralTrack);
  const videoTrack = tracks?.find(isVideoTrack);
  const audioTrack = tracks?.find(isAudioTrack);

  return {
    general: generalTrack
      ? {
          format: generalTrack.Format,
          codec: generalTrack.CodecID,
          duration: Number(generalTrack.Duration),
          //
          gps: generalTrack.Recorded_Location,
        }
      : null,
    video: videoTrack
      ? {
          format: videoTrack.Format,
          codec: videoTrack.CodecID,
          duration: Number(videoTrack.Duration),
          widthAndHeight: {
            width: Number(videoTrack.Width),
            height: Number(videoTrack.Height),
          },
          contentType: videoTrack.InternetMediaType,
          aspectRatio: {
            number: Number(videoTrack.DisplayAspectRatio),
            string: videoTrack.DisplayAspectRatio_String,
          },
        }
      : null,
    audio: audioTrack
      ? {
          format: audioTrack.Format,
          codec: audioTrack.CodecID,
          duration: Number(audioTrack.Duration),
          channels: Number(audioTrack.Channels),
          samplingRate: Number(audioTrack.SamplingRate),
        }
      : null,
  };
};

export const provideVideo = (feeds: FullDatabaseFeeds, _req: VideoRequest) =>
  combineLatest([
    feeds.allFilesByRev,
    feeds.mediaInfoByContentHash,
    feeds.daysByDate,
    feeds.photosByContentHash,
  ]).pipe(map(mangle));

const fieldIsNotNullish =
  <O, K extends keyof O>(key: K) =>
  (
    value: O,
  ): value is {
    [S in keyof O]: Exclude<O[S], S extends K ? null | undefined : never>;
  } =>
    value[key] !== null && value[key] !== undefined;

const mangle = ([allFiles, allMediaInfo, allDays, allPhotos]: [
  ObservedValueOf<FullDatabaseFeeds["allFilesByRev"]>,
  ObservedValueOf<FullDatabaseFeeds["mediaInfoByContentHash"]>,
  ObservedValueOf<FullDatabaseFeeds["daysByDate"]>,
  ObservedValueOf<FullDatabaseFeeds["photosByContentHash"]>,
]): VideoResult =>
  allFiles
    .values()
    .map((namedFile) => ({
      namedFile,
      mediaInfo: allMediaInfo.get(namedFile.content_hash) ?? null,
      photoDbEntry: allPhotos.get(namedFile.content_hash) ?? null,
      day: allDays.get(namedFile.client_modified.substring(0, 10)) ?? null,
    }))
    .filter(fieldIsNotNullish("mediaInfo"))
    .map((item) => {
      const mediaInfoSummary = summariseMediaInfo(item.mediaInfo);
      if (!mediaInfoSummary.general?.format) return;

      const out = {
        ...item,
        mediaInfoSummary,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (out as any).mediaInfo;

      return out as Omit<typeof out, "mediaInfo">;
    })
    .filter((v) => v !== undefined)
    .toArray();
