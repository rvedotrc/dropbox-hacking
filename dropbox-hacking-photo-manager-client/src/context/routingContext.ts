import { Payload } from "dropbox-hacking-photo-manager-shared";
import { createContext, useContext } from "react";

export type Router = {
  switchToPage(payload: Payload): void;
};

const nullRouter: Router = {
  switchToPage: (_: Payload) => undefined,
};

const context = createContext<Router>(nullRouter);

export const useRouter = (): Router => useContext(context);

export default {
  context,
};
