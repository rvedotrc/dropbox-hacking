import * as React from 'react';
import * as ReactDOM from 'react-dom';

import Calendar from "./calendar";
import Day from "./day";
import Photo from "./photo";
import ListOfDays from "./listOfDays";
import {Payload} from "../../src/photo-manager/shared/types";

const toRender = (payload: Payload) => {
    if (payload.route === 'calendar') return <Calendar/>;
    if (payload.route === 'days') return <ListOfDays/>;
    if (payload.route === 'day') return <Day date={payload.date}/>;
    if (payload.route === 'photo') return <Photo rev={payload.rev}/>;
    return <span>Routing error</span>;
};

document.addEventListener('DOMContentLoaded', () => {
    const ele = document.getElementById('payload-script');

    if (ele) {
        const payload = JSON.parse(ele.getAttribute("data-payload") || 'null');

        ReactDOM.render(
            toRender(payload),
            document.getElementById("react_container")
        );
    }
});
