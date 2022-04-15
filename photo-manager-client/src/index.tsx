import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Calendar from "./calendar";

document.addEventListener('DOMContentLoaded', () => {
    ReactDOM.render(
        <Calendar/>,
        document.getElementById("react_container")
    );
});
