import * as React from 'react';
import {useState} from "react";
import {CountsByDate} from "../../src/photo-manager/shared/types";
import MonthBox from "./monthBox";
import TwelveMonths from "./twelveMonths";

type Year = { yearString: string, yearNumber: number, counts: Map<string, number> };

export default () => {
    const [countsByDate, setCountsByDate] = useState<CountsByDate>();

    console.log("render", { countsByDate });

    if (!countsByDate) {
        fetch("/api/counts_by_date")
            .then(r => {
                console.log({ r });
                return r;
            })
            .then(r => r.json())
            .then(data => {
                console.log({ data });
                return data;
            })
            .then(data => setCountsByDate(data.counts_by_date));

        return <div>Loading...</div>;
    }

    if (countsByDate.length === 0) return <div>No data</div>;

    const years = new Map<string, Year>();

    const getYear = (id: string): Year => {
        let y = years.get(id);
        if (y) return y;

        y = { yearString: id, yearNumber: parseInt(id), counts: new Map() };
        years.set(id, y);
        return y;
    };

    for (const entry of countsByDate) {
        const year = getYear(entry.date.substring(0, 4));
        year.counts.set(entry.date, entry.count);
    }

    const zeroPad = (num: number, places: number): string => String(num).padStart(places, '0');

    // const monthNames = 'jan feb mar apr maj jun jul aug sep okt nov dec'.split(' ');
    const monthNames = 'Januar Februar Marts April Maj Juni Juli August September Oktober November December'.split(' ');

    return <div>
        <h1>Calendar</h1>
        {
            [...years.keys()].sort()
                .map(key => years.get(key))
                .map((year: Year) =>
                    <div key={year.yearString}>
                        <h2>{year.yearString}</h2>

                        <TwelveMonths
                            year={year.yearNumber}
                            renderMonth={(_, monthNumber) =>
                                <>
                                    <h3 className="monthName">{monthNames[monthNumber]}</h3>

                                    <MonthBox
                                        year={year.yearNumber}
                                        month={monthNumber}
                                        renderDay={(_y, _m, dayNumber): React.ReactFragment => {
                                            const dateString = `${year.yearString}-${zeroPad(monthNumber + 1, 2)}-${zeroPad(dayNumber, 2)}`;
                                            const count = year.counts.get(dateString);
                                            if (count) {
                                                return <div title={dateString}>{count}</div>
                                            } else {
                                                return <div title={dateString}>&nbsp;</div>;
                                            }
                                        }}
                                    />
                                </>
                            }
                        />
                    </div>
                )
        }
    </div>
};
