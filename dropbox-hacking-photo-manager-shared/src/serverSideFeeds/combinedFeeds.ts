// import type { ExifFromHash } from "@blaahaj/dropbox-hacking-exif-db";
// import type { MediainfoFromHash } from "@blaahaj/dropbox-hacking-mediainfo-db";
// import { combineLatest, map, Observable, type ObservedValueOf } from "rxjs";

// import {
//   dropboxThumbnailableExtensions,
//   exifableFileExtensions,
//   filenameExtensionIn,
//   mediainfoFileExtensions,
// } from "../fileTypes.js";
// import { GPSLatLong } from "../gpsLatLong.js";
// import type { NamedFile, PhotoDbEntry } from "../ws.js";
// import type { FullDatabaseFeeds } from "./index.js";

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// type Filter<I extends Observable<any>> = (
//   value: ObservedValueOf<I>,
// ) => ObservedValueOf<I>;

// const applyFilter = <T>(
//   observable: Observable<T>,
//   filter: Filter<Observable<T>> | undefined,
// ) => (filter ? observable.pipe(map(filter)) : observable);

// const interestingFile = filenameExtensionIn([
//   ...exifableFileExtensions,
//   ...mediainfoFileExtensions,
//   ...dropboxThumbnailableExtensions,
// ]);

// export const combinedContentFeed = (
//   feeds: FullDatabaseFeeds,
//   filters?: {
//     exifs: Filter<FullDatabaseFeeds["exifsByContentHash"]>;
//     mediaInfos: Filter<FullDatabaseFeeds["mediaInfoByContentHash"]>;
//     photos: Filter<FullDatabaseFeeds["photosByContentHash"]>;
//     files: Filter<FullDatabaseFeeds["allFilesByRev"]>;
//   },
// ) =>
//   combineLatest([
//     applyFilter(
//       feeds.allFilesByRev.pipe(
//         map(
//           (mapOfFiles) =>
//             new Map(
//               mapOfFiles
//                 .entries()
//                 .filter(([_, namedFile]) =>
//                   interestingFile(namedFile.path_lower),
//                 ),
//             ),
//         ),
//       ),
//       filters?.files,
//     ),
//     applyFilter(feeds.exifsByContentHash, filters?.exifs),
//     applyFilter(feeds.mediaInfoByContentHash, filters?.mediaInfos),
//     applyFilter(feeds.photosByContentHash, filters?.photos),
//   ]).pipe(
//     map(([files, exifs, mediaInfos, photos]) => {
//       const byHash = new Map<
//         string,
//         {
//           namedFiles: NamedFile[];
//           exif: ExifFromHash | null;
//           mediaInfo: MediainfoFromHash | null;
//           photoDbEntry: PhotoDbEntry;
//         }
//       >();

//       const getOrCreate = (
//         contentHash: string,
//       ): NonNullable<ReturnType<(typeof byHash)["get"]>> => {
//         let item = byHash.get(contentHash);
//         if (item) return item;

//         item = {
//           namedFiles: [],
//           exif: null,
//           mediaInfo: null,
//           photoDbEntry: {
//             description: "",
//             tags: [],
//           },
//         };
//         byHash.set(contentHash, item);
//         return item;
//       };

//       for (const namedFile of files.values())
//         getOrCreate(namedFile.content_hash).namedFiles.push(namedFile);

//       for (const [k, v] of exifs.entries()) getOrCreate(k).exif = v;
//       for (const [k, v] of mediaInfos.entries()) getOrCreate(k).mediaInfo = v;
//       for (const [k, v] of photos.entries()) getOrCreate(k).photoDbEntry = v;

//       return new Map(
//         byHash
//           .entries()
//           .filter(([_k, v]) => v.namedFiles.length > 0)
//           .map(([k, v]) => [
//             k,
//             {
//               ...v,
//               gps: v.exif
//                 ? GPSLatLong.fromExif(v.exif)
//                 : v.mediaInfo
//                   ? GPSLatLong.fromMediaInfo(v.mediaInfo)
//                   : null,
//               timestamp: v.namedFiles[0].client_modified,
//             },
//           ]),
//       );
//     }),
//   );
