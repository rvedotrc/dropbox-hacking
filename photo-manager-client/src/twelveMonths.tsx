import * as React from 'react';

export default  (props: { year: number, renderMonth: (y: number, m: number) => React.ReactFragment }) =>
    <div className="twelveMonths">
        {
            [...Array(12).keys()].map(month =>
                <div className="oneOfTwelveMonths" key={month}>
                    {props.renderMonth(props.year, month)}
                </div>
            )
        }
    </div>;
