import * as React from 'react';
import {useState} from "react";
import {Photo} from "../../src/photo-manager/shared/types";

export default (props: { rev: string }) => {
    const [photo, setPhoto] = useState<Photo | false | undefined>();

    if (photo === undefined) {
        fetch(`/api/photo/rev/${props.rev}`)
            .then(r => { console.log({ r }); return r; })
            .then(r => r.json())
            .then(data => setPhoto(data.photo));

        return <div>Loading...</div>;
    }

    if (photo === false) {
        return <div>No such photo</div>;
    }

    return <>
        <h1>{props.rev}</h1>
        <pre>{JSON.stringify(photo, null, 2)}</pre>
    </>;
};
