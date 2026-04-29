// components/mdx/MermaidDiagram.tsx

'use client';

import { useEffect, useId, useState } from 'react';

type MermaidDiagramProps = {
  chart: string;
};

let mermaidInitialized = false;

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const reactId = useId();
  const diagramId = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        setError('');
        setSvg('');

        const mermaid = (await import('mermaid')).default;

        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'strict',
            theme: 'neutral',
            fontFamily: 'inherit',
          });

          mermaidInitialized = true;
        }

        const result = await mermaid.render(diagramId, chart);

        if (!cancelled) {
          setSvg(result.svg);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Gagal merender Mermaid diagram',
          );
        }
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart, diagramId]);

  if (error) {
    return (
      <div className="my-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
        <p className="font-semibold">Mermaid diagram error</p>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{error}</pre>
        <pre className="mt-4 overflow-x-auto rounded bg-white p-3 text-xs text-gray-700">
          {chart}
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-6 rounded-lg border p-4 text-sm text-gray-500">
        Rendering diagram...
      </div>
    );
  }

  return (
    <div className="my-6 overflow-x-auto rounded-xl border bg-white p-4">
      <div
        className="mermaid-diagram"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
