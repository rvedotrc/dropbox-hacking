import type { ExifFromHash } from "@blaahaj/dropbox-hacking-exif-db";
import type {
  MediainfoFromHash,
  Track,
} from "@blaahaj/dropbox-hacking-mediainfo-db";
import { geoHackUrl } from "@blaahaj/geometry/geoHack";
import type {
  GPSLatLongWithDirection,
  GPSLatNLongE,
} from "@blaahaj/geometry/latlong";
import { ExifTags } from "ts-exif-parser";

export { GPSLatNLongE } from "@blaahaj/geometry/latlong";

export class GPSLatLong {
  public static fromExif(exif: ExifFromHash): GPSLatLong | null {
    const tags = exif.exifData.tags;
    return tags ? GPSLatLong.fromExifTags(tags) : null;
  }

  public static fromExifTags(tags: ExifTags): GPSLatLong | null {
    const lat = tags.GPSLatitude;
    const long = tags.GPSLongitude;
    const latRef = tags.GPSLatitudeRef;
    const longRef = tags.GPSLongitudeRef;

    if (lat === undefined || long === undefined) return null;
    if (latRef !== "N" && latRef !== "S") return null;
    if (longRef !== "E" && longRef !== "W") return null;

    return new GPSLatLong({ lat, long, latRef, longRef });
  }

  public static fromMediaInfo(mediaInfo: MediainfoFromHash): GPSLatLong | null {
    const tracks = mediaInfo.mediainfoData.media?.track;
    const generalTrack = tracks?.find((t) => t["@type"] === "General");
    const recordedLocation = (
      generalTrack as Track & { Recorded_Location?: string }
    ).Recorded_Location;
    return GPSLatLong.fromMediaInfoRecordedAt(recordedLocation);
  }

  public static fromMediaInfoRecordedAt(
    at: string | null | undefined,
  ): GPSLatLong | null {
    if (!at) return null;

    const m = at.match(/^([+-]\d+\.\d+)([+-]\d+\.\d+)([+-]\d+\.\d+)\/$/);
    if (!m) return null;

    // The altitude is discarded
    return new GPSLatLong({
      lat: Number(m[1]),
      long: Number(m[2]),
      latRef: "N",
      longRef: "E",
    });
  }

  constructor(private readonly pos: GPSLatLongWithDirection) {}

  public asUnsigned(): GPSLatLongWithDirection {
    return this.pos;
  }

  public asSigned(): GPSLatNLongE {
    return {
      lat: this.pos.latRef === "N" ? this.pos.lat : -this.pos.lat,
      long: this.pos.longRef === "E" ? this.pos.long : -this.pos.long,
    };
  }

  public googleMapsUrl(_args: { zoom: number }): string {
    const s = this.asSigned();
    return `https://www.google.com/maps/search/?api=1&query=${s.lat}%2C${s.long}`;
  }

  public geoHackUrl(args: { title: string }): string {
    return geoHackUrl({
      position: this.pos,
      pageName: args.title,
      encodeURIComponent,
    });
  }
}
