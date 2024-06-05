import {EventEmitter} from "events";

export class Socket extends EventEmitter {
    private websocket: WebSocket | undefined;

    constructor(private readonly url: string) {
        super();
    }

    public open(): void {
        if (this.websocket) return;

        this.websocket = new WebSocket(this.url);
        this.websocket.addEventListener("open", this.socketOpen.bind(this));
        this.websocket.addEventListener("message", this.socketMessage.bind(this));
        this.websocket.addEventListener("error", this.socketError.bind(this));
        this.websocket.addEventListener("close", this.socketClose.bind(this));
    }

    public close(): void {
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
    public  emit(eventName: "offline"): boolean;
    public  emit(eventName: string, ...args: any[]): boolean {
        return super.emit(eventName, ...args);
    }

    private socketOpen(ev: Event) {
        console.log("socketOpen", ev);
    }

    private socketMessage(ev: MessageEvent) {
        console.log("socketMessage", ev);
    }

    private socketError(ev: Event) {
        console.log("socketError", ev);
    }

    private socketClose(ev: CloseEvent) {
        console.log("socketClose", ev);
    }
}
