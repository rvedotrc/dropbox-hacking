// TODO: a context which provides 'buildCountsByDate' and 'buildFilesAndExifAndPhotoDb' feeds

import React, { useContext, useEffect, useState } from "react";
import { createContext, type PropsWithChildren } from "react";
import { type ObservedValueOf, ReplaySubject } from "rxjs";

import { buildCountsByDate } from "./buildCountsByDate";
import { buildFilesAndExifAndPhotoDb } from "./buildFilesAndExifAndPhotoDb";
import { useRxFeedsViaMultiplexer } from "./rxRecordFeedContext";

type T = {
  countsByDate: ReturnType<typeof buildCountsByDate>;
  filesAndExifAndPhotoDb: ReturnType<typeof buildFilesAndExifAndPhotoDb>;
};

const context = createContext<T | undefined>(undefined);
const Provider = context.Provider;

export const useAdditionalFeeds = () => useContext(context);

export const defaultProvider = (props: PropsWithChildren) => {
  const feeds = useRxFeedsViaMultiplexer();
  const [value, setValue] = useState<T>();

  useEffect(() => {
    if (!feeds) return;

    const replayFiles = new ReplaySubject<
      ObservedValueOf<ReturnType<typeof buildFilesAndExifAndPhotoDb>>
    >(1);
    const replayCounts = new ReplaySubject<
      ObservedValueOf<ReturnType<typeof buildCountsByDate>>
    >(1);

    const subFiles = buildFilesAndExifAndPhotoDb(feeds).subscribe(replayFiles);
    const subCounts = buildCountsByDate(replayFiles).subscribe(replayCounts);

    setValue({
      filesAndExifAndPhotoDb: replayFiles,
      countsByDate: replayCounts,
    });

    return () => {
      subFiles.unsubscribe();
      subCounts.unsubscribe();
    };
  }, [feeds]);

  return <Provider value={value}>{props.children}</Provider>;
};
