// components/mdx/ResourceBox.tsx

import Link from 'next/link';

type ResourceItem = {
  name: string;
  href: string; // selalu internal: /tools/*
  description?: string;
};

type ResourceBoxProps = {
  title?: string;
  items: ResourceItem[];
  note?: string;
};

export default function ResourceBox({
  title = '📎 Tools terkait dalam konteks ini',
  items,
  note,
}: ResourceBoxProps) {
  if (!items || items.length === 0) return null;

  return (
    <aside className="my-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
      <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
        {title}
      </p>

      <ul className="space-y-1 text-sm">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              {item.name}
            </Link>
            {item.description && (
              <span className="ml-1 text-gray-600 dark:text-gray-400">
                — {item.description}
              </span>
            )}
          </li>
        ))}
      </ul>

      {note && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{note}</p>
      )}
    </aside>
  );
}
