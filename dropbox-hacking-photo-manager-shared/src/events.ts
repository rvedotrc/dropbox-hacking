export type DPMEvent<N extends string = string, R extends string = string> = {
  event_name: N;
  event_resource: R;
  event_timestamp: number;
};

export type DPMPingEvent = DPMEvent<"ping", "events">;
export type DPMConnectEvent = DPMEvent<"connect", "events">;
export type DPMLsChangeEvent = DPMEvent<"change", "ls">;
export type DPMExifChangeEvent = DPMEvent<"change", "exif">;
export type DPMDaysChangeEvent = DPMEvent<"change", "days">;
export type DPMChangeEvent =
  | DPMLsChangeEvent
  | DPMExifChangeEvent
  | DPMDaysChangeEvent;
export type DPMAnyEvent = DPMPingEvent | DPMConnectEvent | DPMChangeEvent;
