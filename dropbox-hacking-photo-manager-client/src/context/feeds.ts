import { useEvents } from "./eventEmitterContext";
import useApiResource from "./useApiResource";
import {
  CountsByDateResponse,
  DayMetadataResponse,
  DaysMetadataResponse,
  DPMAnyEvent,
  DPMChangeEvent,
  PhotosResponse,
} from "dropbox-hacking-photo-manager-shared";
import { useEffect, useMemo } from "react";

export const useFeed = <T>({
  url,
  resource,
}: {
  url: string;
  resource: DPMChangeEvent["event_resource"][];
}) => {
  const api = useApiResource<T>({ url });

  const events = useEvents();

  const handler = useMemo(
    () => (event: DPMAnyEvent) => {
      if (event.event_name === "connect" && event.event_resource === "events")
        api.refresh();
      if (
        event.event_name === "change" &&
        resource.includes(event.event_resource)
      )
        api.refresh();
    },
    [],
  );

  useEffect(() => {
    events?.on("connect", handler);
    events?.on("change", handler);
    return () => {
      events?.off("connect", handler);
      events?.off("change", handler);
    };
  }, [events, api, handler]);

  return api.result;
};

export const useCountsByDate = () =>
  useFeed<CountsByDateResponse>({
    url: "/api/counts_by_date",
    resource: ["ls", "exif"],
  });

export const useDays = () =>
  useFeed<DaysMetadataResponse>({
    url: "/api/day/all",
    resource: ["days"],
  });

export const useDay = (date: string) =>
  useFeed<DayMetadataResponse>({
    url: `/api/day/${date}`,
    resource: ["days"],
  });

export const useDayPhotos = (date: string) =>
  useFeed<PhotosResponse>({
    url: `/api/photos/${date}`,
    resource: ["ls", "exif"],
  });
