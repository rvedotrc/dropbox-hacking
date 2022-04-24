import * as React from 'react';
import {useEffect, useRef, useState} from "react";
import {
    CountsByDate,
    CountsByDateResponse,
    DaysMetadataResponse,
    ThumbnailsByRevResponse
} from "../../src/photo-manager/shared/types";
import {DayMetadata} from "../../src/photo-manager/server/dayDb";

export default () => {
    const [countsByDate, setCountsByDate] = useState<CountsByDate>();
    const [dayMetadata, setDayMetadata] = useState<DayMetadata[]>();
    const [revToThumbnail, setRevToThumbnail] = useState(new Map<string, string | undefined>());
    const [visibleDays, setVisibleDays] = useState<[number, number]>();

    useEffect(() => {
        if (!countsByDate) {
            fetch("/api/counts_by_date")
                .then(r => r.json() as Promise<CountsByDateResponse>)
                .then(data => setCountsByDate(data.counts_by_date));
        }
    }, [countsByDate]);

    useEffect(() => {
        if (!dayMetadata) {
            fetch("/api/day/all")
                .then(r => r.json() as Promise<DaysMetadataResponse>)
                .then(data => setDayMetadata(data.days_metadata));
        }

    }, [dayMetadata]);

    // Discard any unwanted thumbnails
    useEffect(() => {
        if (countsByDate) {
            const wantedRevs = new Set(
                [...countsByDate.values()].flatMap(e => e.samplePhotos).map(p => p.rev)
            );

            let changed = false;
            for (const rev of revToThumbnail.keys()) {
                if (!wantedRevs.has(rev)) {
                    revToThumbnail.delete(rev);
                    changed = true;
                }
            }

            if (changed) setRevToThumbnail(new Map(revToThumbnail));
        }
    }, [countsByDate, revToThumbnail]);

    // Load any missing thumbnails (visible days only)
    useEffect(() => {
        console.log("useEffect img load", countsByDate !== undefined, visibleDays);

        if (countsByDate === undefined) return;
        if (!visibleDays) return;

        const wantedRevs = new Set(
            countsByDate.slice(visibleDays[0], visibleDays[1] + 1)
                .flatMap(e => e.samplePhotos).map(p => p.rev)
        );
        let changed = false;

        const needToRequest: string[] = [];

        for (const rev of wantedRevs) {
            if (!revToThumbnail.has(rev)) {
                needToRequest.push(rev);
                // Use undefined to record the fact that we have made the request
                revToThumbnail.set(rev, undefined);
            }
        }

        needToRequest.sort();

        while (true) {
            const slice = needToRequest.splice(0, 25);
            if (slice.length === 0) break;

            console.log(`Requesting ${slice.join(',')}`);

            fetch(`/api/thumbnail/128/revs/${slice.join(',')}`)
                .then(res => res.json() as Promise<ThumbnailsByRevResponse>)
                .then(data => {
                    console.log(`Got response for ${slice.join(',')}`, data);

                    for (const r of data.thumbnails_by_rev) {
                        console.log(`got thumbnail for ${r.rev}`)
                        revToThumbnail.set(r.rev, r.thumbnail);
                    }

                    setRevToThumbnail(new Map(revToThumbnail));
                    // console.log("fetch complete");
                });
        }

        if (changed) setRevToThumbnail(new Map(revToThumbnail));
    }, [countsByDate, revToThumbnail, visibleDays]);

    const olRef = useRef<HTMLOListElement>(null);
    console.log("render", olRef.current, visibleDays, countsByDate ? countsByDate.length : null);
    // console.log("render", olRef.current, visibleDays, (visibleDays && countsByDate) ? [countsByDate[visibleDays[0]].date, countsByDate[visibleDays[1]].date] : null);

    useEffect(() => {
        console.log("use effect scroll", olRef.current);
        const ol = olRef.current;
        if (!ol) return;

        const onScrollStopped = () => {
            console.log("scroll has stopped");
            console.log(`window sY=${window.scrollY} sT=${window.screenTop} iH=${window.innerHeight} oH=${window.outerHeight}`);

            const body = document.body;
            console.log(`body oH/T=${body.offsetHeight}/${body.offsetTop} sH/T=${body.scrollHeight}/${body.scrollTop} cH/T=${body.clientHeight}/${body.clientTop}`);

            console.log(`ol oH/T=${ol.offsetHeight}/${ol.offsetTop} sH/T=${ol.scrollHeight}/${ol.scrollTop} cH/T=${ol.clientHeight}/${ol.clientTop}`);

            const items = [...ol.childNodes] as HTMLLIElement[];

            // Each item is either above the viewport, or below it, or overlapping.
            // Above, overlapping, below, in that order.
            // We need to find the ones which are overlapping.

            const queryItem = (i: number) => {
                // if (i > 20) return +1;

                const element = items[i];
                if (!element) throw 'No item';

                const box = element.getBoundingClientRect();

                const answer = (box.bottom < 0) ? -1 : (box.top > window.innerHeight) ? +1 : 0;
                // console.log(`i=${i} ${answer} date=${countsByDate?.[i].date} box t/b/y/h=${box.top}/${box.bottom}/${box.y}/${box.height}`);
                return answer;
            };

            console.log(`window screenY=${window.screenY} screenTop=${window.screenTop} scrollY=${window.scrollY} innerHeight=${window.innerHeight} outerHeight=${window.outerHeight}`);
            const v = (window as any).visualViewport;
            console.log(`v h=${v.height} oT=${v.offsetTop} pageTop=${v.pageTop}`);
            const q = items.map((_ele, i) => queryItem(i));
            console.log(`q = ${q.join(" ")}`);
            const min = q.indexOf(0);
            const max = q.lastIndexOf(0);
            setVisibleDays([min, max]);
        };

        let timer = window.setTimeout(onScrollStopped, 500);

        const listener = (event: Event) => {
            if (timer) window.clearTimeout(timer);
            timer = window.setTimeout(onScrollStopped, 500);
        };

        window.addEventListener('scroll', listener);
        window.addEventListener('resize', listener);
        ol.addEventListener('resize', listener);

        return () => {
            window.removeEventListener('scroll', listener);
            window.removeEventListener('resize', listener);
            ol.removeEventListener('resize', listener);
            if (timer) window.clearTimeout(timer);
        }
    }, [countsByDate, dayMetadata]);

    if (!countsByDate || !dayMetadata) {
        return <div>Loading...</div>;
    }

    const keyedMetadata = new Map<string, DayMetadata>(
        dayMetadata.map(m => [m.date, m])
    );
    const days = countsByDate.map(e => ({
            ...e,
            description: (keyedMetadata.get(e.date) || {description: ''}).description,
        }));

    let daysWith = 0;
    let daysWithout = 0;
    let photosWith = 0;
    let photosWithout = 0;

    for (const day of days) {
        if (day.description !== '') {
            ++daysWith;
            photosWith += day.count;
        } else {
            ++daysWithout;
            photosWithout += day.count;
        }
    }

    return <div>
        <h1>List of Days</h1>

        <p>
            <a href={"/calendar"}>Calendar</a>
        </p>

        <p>
            Days with; without; percent-with; count ={' '}
            {daysWith}; {daysWithout}; {Math.round(100.0 * daysWith / (daysWith + daysWithout) * 100.0) / 100.0}; {daysWith + daysWithout}
        </p>

        <p>
            Photos with; without; percent-with; count ={' '}
            {photosWith}; {photosWithout}; {Math.round(100.0 * photosWith / (photosWith + photosWithout) * 100.0) / 100.0}; {photosWith + photosWithout}
        </p>

        <ol ref={olRef} className={"listOfDays"}>
            {days.map(day => (
                <li key={day.date}>
                    <a href={`/day.html?date=${day.date}`}>
                        <span className={"date"}>{day.date}</span>
                        <span className={"count"}>{day.count}</span>
                        <span className={"countWithGps"}>{day.countWithGps}</span>
                        <span className={"description"}>{day.description === undefined ? '-' : day.description}</span>
                        <span className={"samples"}>
                            {day.samplePhotos.map(photo => {
                                const thumbnail = revToThumbnail.get(photo.rev);
                                return <span key={photo.id}
                                             style={{
                                                 display: "inline-block",
                                                 height: '128px',
                                                 width: '128px',
                                             }}
                                >
                                    <img
                                    src={thumbnail ? `data:image/jpeg;base64,${thumbnail}` : `/placeholder.png`}
                                    alt={"thumbnail"}
                                    />
                                </span>
                            })}
                        </span>
                    </a>
                </li>
            ))}
        </ol>
    </div>;
};
