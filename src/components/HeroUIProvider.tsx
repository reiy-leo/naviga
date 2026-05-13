import type { ReactNode } from 'react';

interface HeroUIProviderProps {
  children: ReactNode;
}

export function HeroUIProvider({ children }: HeroUIProviderProps): ReactNode {
  return <>{children}</>;
}
