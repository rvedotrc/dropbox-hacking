import * as React from 'react';
import {useEffect, useState} from "react";
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

    // Load any missing thumbnails
    useEffect(() => {
        if (countsByDate === undefined) return;

        const wantedRevs = new Set(
            [...countsByDate.values()].flatMap(e => e.samplePhotos).map(p => p.rev)
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

            // console.log(`Requesting ${slice.join(',')}`);

            fetch(`/api/thumbnail/128/revs/${slice.join(',')}`)
                .then(res => res.json() as Promise<ThumbnailsByRevResponse>)
                .then(data => {
                    // console.log(`Got response for ${slice.join(',')}`, data);

                    for (const r of data.thumbnails_by_rev) {
                        // console.log(`got thumbnail for ${r.rev}`)
                        revToThumbnail.set(r.rev, r.thumbnail);
                    }

                    setRevToThumbnail(new Map(revToThumbnail));
                    // console.log("fetch complete");
                });
        }

        if (changed) setRevToThumbnail(new Map(revToThumbnail));
    }, [countsByDate, revToThumbnail]);

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
            <a href={"/"}>Calendar</a>
        </p>

        <p>
            Days with; without; percent-with; count ={' '}
            {daysWith}; {daysWithout}; {Math.round(100.0 * daysWith / (daysWith + daysWithout) * 100.0) / 100.0}; {daysWith + daysWithout}
        </p>

        <p>
            Photos with; without; percent-with; count ={' '}
            {photosWith}; {photosWithout}; {Math.round(100.0 * photosWith / (photosWith + photosWithout) * 100.0) / 100.0}; {photosWith + photosWithout}
        </p>

        <ol className={"listOfDays"}>
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
                                return <img
                                    key={photo.rev}
                                    src={thumbnail ? `data:image/jpeg;base64,${thumbnail}` : `/placeholder.png`}
                                    alt={"thumbnail"}
                                    style={{
                                        width: thumbnail ? undefined : '128px',
                                        height: thumbnail ? undefined : '128px',
                                    }}
                                />
                            })}
                        </span>
                    </a>
                </li>
            ))}
        </ol>
    </div>;
};
