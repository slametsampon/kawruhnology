// app/tools/layout.tsx

import type { ReactNode } from 'react';

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <div className="prose prose-neutral max-w-none">{children}</div>
    </section>
  );
}
