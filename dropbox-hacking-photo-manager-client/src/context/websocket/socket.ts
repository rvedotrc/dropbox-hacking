import { EventEmitter } from "events";

const PING_INTERVAL_MILLIS = 25 * 1000;

export class Socket extends EventEmitter {
  private websocket: WebSocket | undefined;
  private _wantOpen = false;
  private pingTimer: NodeJS.Timeout | undefined = undefined;

  constructor(private readonly url: string) {
    super();
  }

  public get wantOpen(): boolean {
    return this._wantOpen;
  }

  public set wantOpen(value: boolean) {
    this._wantOpen = value;
    value ? this.ensureOpen() : this.ensureClose();
  }

  private ensureOpen(): void {
    if (this.websocket) return;

    this.websocket = new WebSocket(this.url);
    this.websocket.addEventListener("open", this.socketOpen.bind(this));
    this.websocket.addEventListener("message", this.socketMessage.bind(this));
    this.websocket.addEventListener("error", this.socketError.bind(this));
    this.websocket.addEventListener("close", this.socketClose.bind(this));
  }

  private ensureClose(): void {
    this.websocket?.close();
    this.websocket = undefined;
  }

  public on(eventName: "online", listener: () => void): this;
  public on(eventName: "offline", listener: () => void): this;
  public on(eventName: string, listener: (...args: any[]) => void): this {
    return super.on(eventName, listener);
  }

  public off(eventName: "online", listener: () => void): this;
  public off(eventName: "offline", listener: () => void): this;
  public off(eventName: string, listener: (...args: any[]) => void): this {
    return super.off(eventName, listener);
  }

  public emit(eventName: "online"): boolean;
  public emit(eventName: "offline"): boolean;
  public emit(eventName: string, ...args: any[]): boolean {
    return super.emit(eventName, ...args);
  }

  private socketOpen(ev: Event) {
    console.log("socketOpen", ev);
    this.emit("online");
    this.pingTimer = setInterval(() => this.sendPing(), PING_INTERVAL_MILLIS);
  }

  private socketMessage(ev: MessageEvent) {
    console.log("socketMessage", ev);
  }

  private socketError(ev: Event) {
    console.log("socketError", ev);
  }

  private socketClose(ev: CloseEvent) {
    console.log("socketClose", ev);
    this.emit("offline");
    this.pingTimer && clearInterval(this.pingTimer);
    this.pingTimer = undefined;
    this.websocket = undefined;
    if (this._wantOpen) this.ensureOpen();
  }

  private sendPing(): void {
    this.websocket?.send("hello i am still here kthxbye\n");
  }
}
