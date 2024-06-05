import * as React from "react";

import {createContext, PropsWithChildren, useContext, useEffect, useMemo} from "react";
import {Socket} from "./socket";

export const context = createContext<Socket | undefined>(undefined);
const Provider = context.Provider;

export const useWebsocket = () => useContext(context);

export const defaultProvider = (props: PropsWithChildren<{}>) => {
    const w = useMemo(() => new Socket("/api/ws"), []);

    useEffect(() => {
        w.open();
        return () => w.close();
    }, []);

    return <Provider value={w}>{props.children}</Provider>;
};
