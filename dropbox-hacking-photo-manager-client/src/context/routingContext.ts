import { Payload } from "dropbox-hacking-photo-manager-shared";
import { createContext, useContext } from "react";

export interface Router {
  switchToPage(payload: Payload): void;
}

const nullRouter: Router = {
  switchToPage: (_: Payload) => undefined,
};

const context = createContext<Router>(nullRouter);

export const useRouter = () => useContext(context);

export default {
  context,
};
