// app/sitemap.ts

import { allBlogs } from 'contentlayer/generated';
import type { MetadataRoute } from 'next';
import siteMetadata from '@/data/siteMetadata';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteMetadata.siteUrl.replace(/\/$/, '');

  const blogRoutes = allBlogs
    .filter((blog) => blog.draft !== true)
    .map((blog) => ({
      url: `${baseUrl}/${blog._raw.flattenedPath}`,
      lastModified: blog.lastmod ?? blog.date,
    }));

  const toolRoutes = [
    '/tools',
    '/tools/vercel',
    '/tools/openai',
    '/tools/notion',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
    },
    ...toolRoutes,
    ...blogRoutes,
  ];
}
