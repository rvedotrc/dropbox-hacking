import * as React from 'react';
import {useEffect, useState} from "react";
import {CountsByDate, CountsByDateResponse, DaysMetadataResponse} from "../../src/photo-manager/shared/types";
import {DayMetadata} from "../../src/photo-manager/server/dayDb";

export default () => {
    const [countsByDate, setCountsByDate] = useState<CountsByDate>();
    const [dayMetadata, setDayMetadata] = useState<DayMetadata[]>();

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
                    </a>
                </li>
            ))}
        </ol>
    </div>;
};
