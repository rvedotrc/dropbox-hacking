import * as React from "react";
import {
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import logRender from "../logRender";

const EditableTextField = (props: {
  value: string;
  onSave: (newValue: string) => Promise<void>;
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingValue, setEditingValue] = useState<string>(props.value.trim());
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && input.current) input.current.focus();
  }, [isEditing, input.current]);

  const doSave = useMemo(
    () => () => props.onSave(editingValue).then(() => setIsEditing(false)),
    [props.onSave, editingValue],
  );

  const doCancel = useMemo(() => () => setIsEditing(false), []);

  const startEditing = useMemo(
    () => () => {
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
      if (e.key === "Enter") doSave();
      else if (e.key === "Escape") doCancel();
    },
    [doSave, doCancel],
  );

  if (!isEditing) {
    return <p onClick={startEditing}>{props.value || "(click to edit)"}</p>;
  } else {
    return (
      <p>
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
      </p>
    );
  }
};

export default logRender(EditableTextField);
