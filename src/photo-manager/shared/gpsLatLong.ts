import { ExifTags } from "ts-exif-parser";

export type GPSLatNLongE = {
  readonly lat: number;
  readonly long: number;
};

export type GPSLatLongWithDirection = {
  readonly lat: number;
  readonly long: number;
  readonly latRef: "N" | "S";
  readonly longRef: "E" | "W";
};

export default class GPSLatLong {
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
}
