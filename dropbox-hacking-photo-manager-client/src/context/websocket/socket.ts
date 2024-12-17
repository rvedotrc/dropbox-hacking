import { EventEmitter } from "events";
import { cancelablePromise, type CancelablePromise } from "./cancelablePromise";
import { generateId } from "./id";
import type {
  PingRequest,
  PingResponse,
  SimpleRequest,
  SimpleResponse,
} from "dropbox-hacking-photo-manager-shared/src/ws";

const PING_INTERVAL_MILLIS = 25 * 1000;

export class Socket extends EventEmitter {
  private websocket: WebSocket | undefined;
  private _wantOpen = false;
  private pingTimer: NodeJS.Timeout | undefined = undefined;
  private simpleRequests: Record<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (error: unknown) => void;
      timeout: NodeJS.Timeout;
    }
  > = {};

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

  public simpleRequest<REQ, RES>(payload: REQ): CancelablePromise<RES> {
    const websocket = this.websocket;

    return cancelablePromise<RES>((resolve, reject, onCancel, _isCanceled) => {
      if (!websocket) {
        reject(new Error("No socket"));
        return;
      }

      const id = generateId();

      this.simpleRequests[id] = {
        resolve,
        reject,
        timeout: setTimeout(() => {
          reject(new Error("Timeout"));
          delete this.simpleRequests[id];
        }, 30 * 1000),
      };

      onCancel(() => {
        reject(new Error("Canceled"));
        delete this.simpleRequests[id];
      });

      const wrapper: SimpleRequest<unknown> = {
        type: "simpleRequest",
        id,
        payload,
      };

      websocket.send(JSON.stringify(wrapper));
    });
  }

  private socketMessage(ev: MessageEvent) {
    console.log("socketMessage", ev);

    if (typeof ev.data === "string") {
      const reply = JSON.parse(ev.data);

      if (
        typeof reply === "object" &&
        reply !== null &&
        "type" in reply &&
        reply.type === "simpleResponse"
      ) {
        const { id, payload } = reply as SimpleResponse<unknown>;
        console.debug({ simpleResponse: reply });

        if (id in this.simpleRequests) {
          const pending = this.simpleRequests[id];
          delete this.simpleRequests[id];

          console.debug({ id, payload });

          clearTimeout(pending.timeout);
          pending.resolve(payload);
        } else {
          console.warn(`No pending simpleRequest with id=${id}`);
        }
      }
    }
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

    for (const resolveReject of Object.values(this.simpleRequests)) {
      clearTimeout(resolveReject.timeout);
      process.nextTick(() =>
        resolveReject.reject(new Error("Connection lost")),
      );
    }

    this.simpleRequests = {};

    if (this._wantOpen) this.ensureOpen();
  }

  private sendPing(): void {
    this.simpleRequest<PingRequest, PingResponse>({ verb: "ping" }).then(
      (ans) => console.debug("pong", ans),
      (err) => console.error(err),
    );
  }
}
