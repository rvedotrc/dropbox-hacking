import { useEffect } from "react";

export const useStyleSheet = ({ cssText }: { cssText: string }) => {
  useEffect(() => {
    const head = document.getElementsByTagName("head")[0];
    if (!head) return;

    const style = document.createElement("style");
    style.appendChild(document.createTextNode(cssText));
    style.setAttribute("type", "text/css");
    head.appendChild(style);

    return () => void head.removeChild(style);
  }, [cssText]);
};
