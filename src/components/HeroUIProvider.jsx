import { NextUIProvider as Provider } from "@nextui-org/react";

export function HeroUIProvider({ children }) {
  return (
    <Provider>
      {children}
    </Provider>
  );
}
