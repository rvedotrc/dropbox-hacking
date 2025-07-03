import type { IOHandler } from "dropbox-hacking-photo-manager-shared";
import { createContext } from "react";

export type T = IOHandler<unknown, unknown>;
export const context = createContext<T | undefined>(undefined);
export const Provider = context.Provider;
