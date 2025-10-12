// app/layout.tsx

import 'css/tailwind.css';
import 'pliny/search/algolia.css';

import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Analytics, AnalyticsConfig } from 'pliny/analytics';
import SectionContainer from '@/components/SectionContainer';
// import { SearchConfig, SearchProvider } from 'pliny/search';
import { CustomSearchProvider } from '@/components/CustomSearchProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import siteMetadata from '../data/siteMetadata';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: siteMetadata.title,
  description: siteMetadata.description,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="/kawruhnology/favicon.ico"
          type="image/x-icon"
          sizes="any"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <title>{siteMetadata.title}</title>
        <meta name="description" content={siteMetadata.description} />
      </head>
      <body
        className={`min-h-screen bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-50 ${inter.className}`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Analytics
            analyticsConfig={siteMetadata.analytics as AnalyticsConfig}
          />
          <div className="flex min-h-screen flex-col justify-between font-sans">
            <CustomSearchProvider>
              <Header /> {/* ✅ Header akan jadi full width */}
              <main className="mb-auto">
                <SectionContainer>
                  {' '}
                  {/* ✅ Hanya konten dibatasi */}
                  {children}
                </SectionContainer>
              </main>
            </CustomSearchProvider>
            <Footer /> {/* ✅ Footer juga full width */}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
