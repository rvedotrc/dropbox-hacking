import * as React from "react";
import {
  ChangeEvent,
  KeyboardEvent,
  MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import logRender from "../logRender";

const EditableTextField = (props: {
  value: string;
  onSave: (newValue: string) => Promise<void>;
}): React.ReactElement | null => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingValue, setEditingValue] = useState<string>(props.value.trim());
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && input.current) input.current.focus();
  }, [isEditing, input.current]);

  const doSave = useMemo(
    () => (event: MouseEvent | KeyboardEvent) => {
      console.log("Saving");
      event.preventDefault();
      props
        .onSave(editingValue)
        .then(() => setIsEditing(false))
        .catch((err) => console.error(err));
    },
    [props.onSave, editingValue],
  );

  const doCancel = useMemo(
    () => (event: MouseEvent | KeyboardEvent) => {
      console.log("Stop editing");
      event.preventDefault();
      setIsEditing(false);
    },
    [],
  );

  const startEditing = useMemo(
    () => (event: MouseEvent | KeyboardEvent) => {
      console.log("Start editing");
      event.stopPropagation();
      event.preventDefault();
      setEditingValue(props.value);
      setIsEditing(true);
    },
    [props.value],
  );

  const onChange = useMemo(
    () => (e: ChangeEvent<HTMLInputElement>) => setEditingValue(e.target.value),
    [],
  );

  const onKeyDown = useMemo(
    () => (e: KeyboardEvent) => {
      if (e.key === "Enter") doSave(e);
      else if (e.key === "Escape") doCancel(e);
    },
    [doSave, doCancel],
  );

  if (!isEditing) {
    return (
      <span
        onClick={startEditing}
        className={props.value ? "hasData" : "noData"}
      >
        {props.value || "(click to edit)"}
      </span>
    );
  } else {
    return (
      <span>
        <input
          ref={input}
          type={"text"}
          value={editingValue}
          style={{ width: "40em" }}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
        <input type={"submit"} value={"Save"} onClick={doSave} />
        <input type={"reset"} value={"Cancel"} onClick={doCancel} />
      </span>
    );
  }
};

export default logRender(EditableTextField);
