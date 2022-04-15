import * as React from 'react';
import * as ReactDOM from 'react-dom';

import Calendar from "./calendar";
import Day from "./day";

const toRender = (href: string) => {
    const url = new URL(href);
    const path = url.pathname;
    const queryString = url.search;

    if (path === '/' && queryString === '')
        return <Calendar/>;

    if (path === '/day.html') {
        const m = queryString.match(/^\?date=(?<date>\d\d\d\d-\d\d-\d\d)$/);
        if (m && m.groups) return <Day date={m.groups.date}/>;
    }

    window.location.href = '/';
    return <>Redirecting...</>;
};


document.addEventListener('DOMContentLoaded', () => {
    ReactDOM.render(
        toRender(window.location.href),
        document.getElementById("react_container")
    );
});
