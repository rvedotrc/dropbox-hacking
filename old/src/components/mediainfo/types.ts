export class MediainfoData {
  private readonly data: unknown;

  constructor(jsonData: unknown) {
    this.data = jsonData;
  }

  get jsonData(): unknown {
    return this.data;
  }
}
