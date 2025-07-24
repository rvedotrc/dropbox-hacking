import { extname } from "node:path";

import type { ExifFromHash } from "@blaahaj/dropbox-hacking-exif-db";
import {
  isAudioTrack,
  isGeneralTrack,
  isVideoTrack,
  type MediainfoFromHash,
} from "@blaahaj/dropbox-hacking-mediainfo-db";
import { combineLatest, map, type Observable } from "rxjs";

import type { FilterNode } from "../filter.js";
import { GPSLatLong } from "../gpsLatLong.js";
import { type DayMetadata, ensureNever } from "../types.js";
import type { NamedFile, PhotoDbEntry } from "../ws.js";
import { type DayFilesResult, type FullDatabaseFeeds } from "./index.js";

export type SearchRequest = {
  readonly type: "rx.ng.search";
  readonly filter: FilterNode;
};

export type SearchResult = {
  readonly files: DayFilesResult["files"];
  truncated: boolean;
};

interface Candidate {
  hasExif: boolean;
  hasVideoTrack: boolean;
  hasAudioTrack: boolean;
  tagCount: number;
  hasTag: (tag: string) => boolean;
  hasText: (text: string) => boolean;
  hasGPS: boolean;
  duration: number | null;
  timestamp: string;
  pathIncludes: (part: string) => boolean;
}

class CandidateImpl implements Candidate {
  constructor(
    private readonly namedFile: NamedFile,
    private readonly exif: ExifFromHash | undefined,
    private readonly mediaInfo: MediainfoFromHash | undefined,
    private readonly photoDbEntry: PhotoDbEntry | undefined,
    private readonly dayMetadata: DayMetadata | undefined,
  ) {}

  public get hasExif() {
    return !!this.exif;
  }

  public get hasVideoTrack() {
    return !!this.mediaInfo?.mediainfoData.media?.track.find(isVideoTrack);
  }

  public get hasAudioTrack() {
    return !!this.mediaInfo?.mediainfoData.media?.track.find(isAudioTrack);
  }

  public hasTag(tag: string) {
    return !!this.photoDbEntry?.tags?.includes(tag);
  }

  public get tagCount(): number {
    return this.photoDbEntry?.tags?.length ?? 0;
  }

  public hasText(text: string) {
    return (
      !!this.photoDbEntry?.description
        ?.toLocaleLowerCase()
        .includes(text.toLocaleLowerCase()) ||
      !!this.dayMetadata?.description
        ?.toLocaleLowerCase()
        .includes(text.toLocaleLowerCase())
    );
  }

  public get hasGPS() {
    return this.exif
      ? !!GPSLatLong.fromExif(this.exif)
      : this.mediaInfo
        ? !!GPSLatLong.fromMediaInfo(this.mediaInfo)
        : false;
  }

  public get duration() {
    const s =
      this.mediaInfo?.mediainfoData.media?.track.find(isGeneralTrack)?.Duration;
    return s === undefined ? null : Number(s);
  }

  public get timestamp() {
    return this.namedFile.client_modified;
  }

  public pathIncludes(part: string): boolean {
    return this.namedFile.path_lower.includes(part);
  }

  public asResult(): SearchResult["files"][number] {
    return {
      namedFile: this.namedFile,
      exif: this.exif ?? undefined,
      photoDbEntry: this.photoDbEntry ?? undefined,
      content: {
        exif: this.exif ?? undefined,
        mediaInfo: this.mediaInfo ?? undefined,
      },
      // dayMetadata: this.dayMetadata ?? {
      //   date: this.namedFile.client_modified.substring(0, 10),
      //   description: "",
      // },
    };
  }
}

const knownMediaExtensions = [
  ".jpg",
  ".png",
  ".mov",
  ".mp4",
  ".bmp",
  ".jpeg",
  ".cr3",
] as const;

const knownMediaExtension = (name: string): boolean =>
  knownMediaExtensions.includes(extname(name).toLocaleLowerCase() as never);

type Predicate<T> = (candidate: T) => boolean;

export const provideSearch = (
  feeds: FullDatabaseFeeds,
  req: SearchRequest,
): Observable<SearchResult> => {
  const predicate = compile(req.filter);

  return combineLatest([
    feeds.allFilesByRev,
    feeds.exifsByContentHash,
    feeds.mediaInfoByContentHash,
    feeds.daysByDate,
    feeds.photosByContentHash,
  ]).pipe(
    map(
      ([
        allFilesByRev,
        exifsByContentHash,
        mediaInfoByContentHash,
        daysByDate,
        photosByContentHash,
      ]) => {
        const maxResults = 1000;
        const results: CandidateImpl[] = [];
        let truncated = false;

        for (const namedFile of allFilesByRev.values()) {
          const c = new CandidateImpl(
            namedFile,
            exifsByContentHash.get(namedFile.content_hash),
            mediaInfoByContentHash.get(namedFile.content_hash),
            photosByContentHash.get(namedFile.content_hash),
            daysByDate.get(namedFile.client_modified.substring(0, 10)),
          );

          if (
            !c.hasExif &&
            !c.hasVideoTrack &&
            !c.hasAudioTrack &&
            !knownMediaExtension(namedFile.name)
          )
            continue;

          if (!predicate(c)) continue;

          if (results.length >= maxResults) {
            truncated = true;
            break;
          }

          results.push(c);
        }

        return { files: results.map((r) => r.asResult()), truncated };
      },
    ),
  );
};

const compile = (filter: FilterNode): Predicate<Candidate> => {
  if (filter.type === "and") {
    const predicateLeft = compile(filter.left);
    const predicateRight = compile(filter.right);
    return (c) => predicateLeft(c) && predicateRight(c);
  }

  if (filter.type === "or") {
    const predicateLeft = compile(filter.left);
    const predicateRight = compile(filter.right);
    return (c) => predicateLeft(c) || predicateRight(c);
  }

  if (filter.type === "not") {
    const predicateLeft = compile(filter.left);
    return (c) => !predicateLeft(c);
  }

  if (filter.type === "media_type") {
    if (filter.mediaType === "image") return (c) => c.hasExif;
    if (filter.mediaType === "audio") return (c) => c.hasAudioTrack;
    if (filter.mediaType === "video") return (c) => c.hasVideoTrack;
    ensureNever(filter.mediaType);
    throw new Error();
  }

  if (filter.type === "duration") {
    const { operand, durationSeconds } = filter;
    if (operand === "<")
      return (c) => c.duration !== null && c.duration < durationSeconds;
    if (operand === ">")
      return (c) => c.duration !== null && c.duration > durationSeconds;
    ensureNever(operand);
    throw new Error();
  }

  if (filter.type === "tag_count") {
    const { operand, tagCount } = filter;
    if (operand === "<") return (c) => c.tagCount < tagCount;
    if (operand === ">") return (c) => c.tagCount > tagCount;
    ensureNever(operand);
    throw new Error();
  }

  if (filter.type === "has_gps") return (c) => c.hasGPS;

  if (filter.type === "tag") return (c) => c.hasTag(filter.tag);

  if (filter.type === "text") return (c) => c.hasText(filter.text);

  if (filter.type === "timestamp") {
    const { operand, timestamp } = filter;
    if (operand === "<")
      return (c) =>
        c.duration !== null && c.timestamp.localeCompare(timestamp) < 0;
    if (operand === ">")
      return (c) =>
        c.duration !== null && c.timestamp.localeCompare(timestamp) > 0;
    ensureNever(operand);
    throw new Error();
  }

  if (filter.type === "path") {
    return (c) => c.pathIncludes(filter.path);
  }

  ensureNever(filter);
  throw new Error();
};
