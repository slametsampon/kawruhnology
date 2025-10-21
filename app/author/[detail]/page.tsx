// app/author/[detail]/page.tsx

// import { slug } from 'github-slugger';
// import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer';
import siteMetadata from '@/data/siteMetadata';
// import ListLayout from '@/layouts/ListLayoutWithTags';
import { allAuthors, allBlogs } from 'contentlayer/generated';
import authorData from 'app/author-data.json';
import { genPageMetadata } from 'app/seo';
import CardAuthor from '@/components/CardAuthor';

export async function generateMetadata({
  params,
}: {
  params: { detail: string };
}) {
  const detail = decodeURI(params.detail);
  console.log('🧠 [generateMetadata] Slug detail:', detail);

  return genPageMetadata({
    title: detail,
    description: `${siteMetadata.title} ${detail} tagged content`,
    alternates: {
      canonical: './',
      types: {
        'application/rss+xml': `${siteMetadata.siteUrl}/author/${detail}/feed.xml`,
      },
    },
  });
}

export const generateStaticParams = async () => {
  const authorCounts = authorData as Record<string, number>;
  const authorKeys = Object.keys(authorCounts);
  console.log('📦 [generateStaticParams] Author keys:', authorKeys);

  const paths = authorKeys.map((author) => {
    console.log(
      '🔗 [generateStaticParams] Generating path for author slug:',
      author
    );
    return {
      detail: author, // ✅ Pastikan cocok dengan [detail] di folder
    };
  });

  console.log('🔗 [generateStaticParams] Generating paths:', paths);
  return paths;
};

export default function AuthorPage({ params }: { params: { detail: string } }) {
  const detail = decodeURI(params.detail);
  console.log('📄 [AuthorPage] Rendering page for slug:', detail);

  // Capitalize first letter and convert space to dash
  const title = detail[0].toUpperCase() + detail.split(' ').join('-').slice(1);
  console.log('📝 [AuthorPage] Title generated:', title);

  // const filteredPosts = allCoreContent(
  //   sortPosts(
  //     allBlogs.filter((post) => {
  //       const postAuthors = post.authors?.map((t) => slug(t)) || [];
  //       const matched = postAuthors.includes(detail);
  //       if (matched) {
  //         console.log(
  //           `✅ [AuthorPage] Post matched for "${detail}":`,
  //           post.title
  //         );
  //       }
  //       return matched;
  //     })
  //   )
  // );

  //get author
  const authorResult = allAuthors.find((p) => p.slug === detail);
  if (!authorResult) {
    console.warn(`⚠️ [AuthorPage] Author not found for slug: ${detail}`);
  } else {
    console.log(`👤 [AuthorPage] Author found:`, authorResult.name);
  }

  return (
    <>
      <CardAuthor author={authorResult} />
      {/* <ListLayout posts={filteredPosts} title={title} /> */}
    </>
  );
}
