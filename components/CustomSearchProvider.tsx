// components/CustomSearchProvider.tsx

'use client';

import {
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarAnimator,
  KBarSearch,
  KBarResults,
  useMatches,
  Action,
} from 'kbar';
import { ReactNode, useEffect, useState } from 'react';

function RenderResults() {
  const { results } = useMatches();

  console.log('🔍 [RenderResults] Current search results:', results);

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === 'string' ? (
          <div className="px-4 py-2 text-xs uppercase text-gray-500 dark:text-gray-400">
            {item}
          </div>
        ) : (
          <div
            className={`rounded px-4 py-2 ${
              active
                ? 'bg-blue-600 text-white'
                : 'bg-white text-black dark:bg-gray-900 dark:text-white'
            }`}
          >
            <div className="space-y-1 px-4 py-2">
              <div className="font-medium">{item.name}</div>
              {item.subtitle && (
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {item.subtitle}
                </div>
              )}
            </div>
          </div>
        )
      }
    />
  );
}

export function CustomSearchProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<Action[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const url = `${basePath}/search-kbar.json`;
        console.log(
          '📦 [CustomSearchProvider] Fetching search data from:',
          url
        );

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`[HTTP ${res.status}] ${res.statusText}`);
        }

        const rawData = await res.json();
        console.log('📄 [CustomSearchProvider] Raw data:', rawData);

        const normalized: Action[] = rawData.map((item: any) => ({
          ...item,
          keywords: Array.isArray(item.keywords)
            ? item.keywords.join(' ')
            : item.keywords,
          perform: () => {
            const isLocal =
              typeof window !== 'undefined' &&
              window.location.hostname === 'localhost';
            const finalHref = isLocal
              ? item.href.replace(/^\/kawruhnology/, '') // strip jika lokal
              : item.href; // biarkan untuk production

            console.log(`🚀 Navigating to: ${finalHref}`);
            window.location.href = finalHref;
          },
        }));

        console.log(
          '✅ [CustomSearchProvider] Normalized Actions:',
          normalized
        );
        setActions(normalized);
      } catch (err) {
        console.error(
          '❌ [CustomSearchProvider] Failed to load search-kbar.json:',
          err
        );
      }
    };

    load();
  }, []);

  return (
    <KBarProvider actions={actions} key={actions.length}>
      <KBarPortal>
        <KBarPositioner className="z-50 bg-black/40">
          <KBarAnimator className="w-full max-w-xl overflow-hidden rounded-xl bg-white p-4 text-black shadow-xl dark:bg-gray-800 dark:text-white">
            <KBarSearch
              className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              onChange={(e) =>
                console.log('⌨️ [KBarSearch] Search changed:', e.target.value)
              }
            />
            <RenderResults />
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>

      {children}
    </KBarProvider>
  );
}
