// app/page.tsx

import Link from 'next/link';
import { allBlogs } from 'contentlayer/generated';
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer';
import Tag from '@/components/Tag';

const MAX_DISPLAY = 3;

export default function Home() {
  const sortedPosts = allCoreContent(sortPosts(allBlogs));
  const recentPosts = sortedPosts.slice(0, MAX_DISPLAY);

  const uniqueTags = Array.from(
    new Set(sortedPosts.flatMap((post) => post.tags || []))
  );

  return (
    <main className="min-h-screen bg-[#111827] text-white">
      {/* ----- Hero Section ----- */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-6 py-24 md:px-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-orange-500 md:text-6xl">
            Kawruhnology
          </h1>
          <p className="mt-6 text-xl text-gray-300 md:text-2xl">
            Perpaduan antara nalar lokal dan teknologi modern: tempat berbagi
            pengetahuan, refleksi, dan eksperimen digital.
          </p>
          <p className="text-md mt-4 text-gray-400 md:text-lg">
            Catatan dari seorang praktisi tentang AI, IoT, Software, dan
            kehidupan dalam jaringan.
          </p>
          <div className="mt-8">
            <Link
              href="/blog"
              className="rounded-md bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
            >
              Jelajahi Wawasan
            </Link>
          </div>
        </div>
      </section>

      {/* ----- Core Values / Features ----- */}
      <section className="bg-[#1f2937] px-6 py-20 md:px-20">
        <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-3">
          {[
            {
              title: 'Berbasis Pengetahuan',
              desc: 'Ditulis dari pengalaman langsung dan eksplorasi pribadi di bidang teknologi.',
            },
            {
              title: 'Reflektif & Terbuka',
              desc: 'Mengajak pembaca untuk berpikir, tidak hanya menghafal solusi.',
            },
            {
              title: 'Dibangun untuk Tumbuh',
              desc: 'Struktur konten fleksibel, siap berkembang jadi portofolio & dokumentasi hidup.',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="rounded-lg bg-gray-800 p-6 shadow transition hover:shadow-lg"
            >
              <h3 className="mb-2 text-lg font-bold text-orange-400">
                {feature.title}
              </h3>
              <p className="text-gray-300">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ----- Tag Cloud Section ----- */}
      <section className="border-t border-gray-700 bg-[#111827] px-6 py-16 md:px-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-2xl font-semibold text-orange-400">
            Eksplorasi Berdasarkan Tag
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {uniqueTags.map((tag) => (
              <Tag key={tag} text={tag} />
            ))}
          </div>
        </div>
      </section>

      {/* ----- Recent Blog Posts ----- */}
      <section className="bg-[#1f2937] px-6 py-20 md:px-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-2xl font-semibold text-orange-400">
            Tulisan Terbaru
          </h2>
          <ul className="space-y-10">
            {recentPosts.map((post) => (
              <li key={post.slug}>
                <article>
                  <h3 className="mb-2 text-xl font-bold text-white">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="hover:underline"
                    >
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mb-2 text-gray-400">{post.summary}</p>
                  <div className="text-sm text-gray-500">{post.date}</div>
                </article>
              </li>
            ))}
          </ul>

          {sortedPosts.length > MAX_DISPLAY && (
            <div className="mt-10 text-center">
              <Link
                href="/blog"
                className="font-medium text-orange-500 underline hover:text-orange-600"
              >
                Lihat Semua Artikel →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ----- Footer CTA ----- */}
      <section className="border-t border-gray-700 bg-[#111827] py-16 text-center">
        <h2 className="text-2xl font-bold text-white">
          Teknologi berkembang, begitu juga pemahaman kita.
        </h2>
        <p className="mt-3 text-gray-400">
          Temukan kombinasi antara akal lokal dan teknologi global di
          Kawruhnology.
        </p>
        <div className="mt-6">
          <Link
            href="/blog"
            className="rounded-md bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
          >
            Mulai Membaca
          </Link>
        </div>
      </section>
    </main>
  );
}
