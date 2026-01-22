// app/sitemap.ts

import { allBlogs } from 'contentlayer/generated';
import type { MetadataRoute } from 'next';
import siteMetadata from '@/data/siteMetadata';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteMetadata.siteUrl.replace(/\/$/, '');

  // Blog & content routes (dynamic, from Contentlayer)
  const blogRoutes = allBlogs
    .filter((blog) => blog.draft !== true)
    .map((blog) => ({
      url: `${baseUrl}/${blog._raw.flattenedPath}`,
      lastModified: blog.lastmod ?? blog.date,
    }));

  // Static routes (explicit, sesuai struktur app/)
  const staticRoutes = [
    '/',
    '/blog',
    '/posts',
    '/tags',
    '/author',

    '/tools',
    '/tools/ai',
    '/tools/cloudmqtt',
    '/tools/github-pages',
    '/tools/notion',
    '/tools/openai',
    '/tools/supabase',
    '/tools/vercel',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...blogRoutes];
}
