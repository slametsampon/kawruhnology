// components/SectionContainer.tsx

import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function SectionContainer({ children }: Props) {
  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      {children}
    </section>
  );
}
