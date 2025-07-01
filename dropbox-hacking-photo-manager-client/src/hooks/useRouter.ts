import { RouteState } from "dropbox-hacking-photo-manager-shared";
import { createContext, useContext } from "react";

export type Router = {
  switchToPage(payload: RouteState): void;
};

const nullRouter: Router = {
  switchToPage: (_: RouteState) => undefined,
};

export const context = createContext<Router>(nullRouter);

const useRouter = (): Router => useContext(context);

export default useRouter;
