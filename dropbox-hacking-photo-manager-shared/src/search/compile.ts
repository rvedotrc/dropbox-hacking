import {
  isAudioTrack,
  isVideoTrack,
} from "@blaahaj/dropbox-hacking-mediainfo-db/types";

import { ensureNever } from "../ensureNever.js";
import type { ContentHashCollection } from "../serverSideFeeds/index.js";
import type { FilterNode } from "./filterNode.js";

type Predicate<T> = (candidate: T) => boolean;

export const compile = (
  filter: FilterNode,
): Predicate<ContentHashCollection> => {
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
    if (filter.mediaType === "image") return (c) => !!c.exif;
    if (filter.mediaType === "audio")
      return (c) =>
        !!c.mediaInfo?.mediainfoData.media?.track.some(isAudioTrack);
    if (filter.mediaType === "video")
      return (c) =>
        !!c.mediaInfo?.mediainfoData.media?.track.some(isVideoTrack);
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
    if (operand === "<") return (c) => (c.photo?.tags?.length ?? 0) < tagCount;
    if (operand === ">") return (c) => (c.photo?.tags?.length ?? 0) > tagCount;
    ensureNever(operand);
    throw new Error();
  }

  if (filter.type === "has_gps") return (c) => !!c.gps.effective;

  if (filter.type === "tag")
    return (c) => !!c.photo?.tags?.includes(filter.tag);

  if (filter.type === "tag-loose")
    return (c) => !!c.photo?.tags?.some((t) => t.includes(filter.q));

  // FIXME: also search day-description
  if (filter.type === "text")
    return (c) => !!c.photo?.description?.includes(filter.text);

  if (filter.type === "timestamp") {
    const { operand, timestamp } = filter;
    if (operand === "<") return (c) => c.timestamp.localeCompare(timestamp) < 0;
    if (operand === ">") return (c) => c.timestamp.localeCompare(timestamp) > 0;
    ensureNever(operand);
    throw new Error();
  }

  if (filter.type === "path") {
    return (c) =>
      c.namedFiles.some((namedFile) =>
        namedFile.path_lower.includes(filter.path),
      );
  }

  if (filter.type === "file-id")
    return (c) => c.namedFiles.some((namedFile) => namedFile.id === filter.id);

  if (filter.type === "file-rev")
    return (c) =>
      c.namedFiles.some((namedFile) => namedFile.rev === filter.rev);

  ensureNever(filter);
  throw new Error();
};
