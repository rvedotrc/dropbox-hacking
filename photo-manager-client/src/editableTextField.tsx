import * as React from 'react';
import {useEffect, useRef, useState} from "react";

export default (props: {
    value: string,
    onSave: (newValue: string) => Promise<void>
}) => {
    const [isEditing, setIsEditing] = useState<Boolean>(false);
    const [editingValue, setEditingValue] = useState<string>("");
    const input = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && input.current) input.current.focus();
    }, [isEditing, input.current]);

    const doSave = () => props.onSave(editingValue).then(() => setIsEditing(false));
    const doCancel = () => setIsEditing(false);

    if (!isEditing) {
        return <p
            onClick={() => { setEditingValue(props.value); setIsEditing(true); }}
        >{props.value || '(click to edit)'}</p>;
    } else {
        return <p>
            <input
                ref={input}
                type={"text"}
                value={editingValue}
                style={{width: '40em'}}
                onChange={e => setEditingValue(e.target.value)}
                onKeyDown={e => {
                    if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
                    else if (e.key === 'Enter') doSave();
                    else if (e.key === 'Escape') doCancel();
                }}
                />
            <input type={"submit"} value={"Save"} onClick={doSave}/>
            <input type={"reset"} value={"Cancel"} onClick={doCancel}/>
        </p>;
    }
};
