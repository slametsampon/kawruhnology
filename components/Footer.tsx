// components/Footer.tsx

import Link from './Link';
import siteMetadata from '@/data/siteMetadata';
import SocialIcon from '@/components/social-icons';

export default function Footer() {
  return (
    <footer>
      <div className="mt-16 flex flex-col items-center">
        {/* Social Icons */}
        <div className="mb-4 flex space-x-4">
          <SocialIcon
            kind="mail"
            href={`mailto:${siteMetadata.email}`}
            size={6}
          />
          <SocialIcon kind="github" href={siteMetadata.github} size={6} />
          <SocialIcon kind="facebook" href={siteMetadata.facebook} size={6} />
          <SocialIcon kind="youtube" href={siteMetadata.youtube} size={6} />
          <SocialIcon kind="linkedin" href={siteMetadata.linkedin} size={6} />
          <SocialIcon kind="twitter" href={siteMetadata.twitter} size={6} />
        </div>

        {/* Footer Text & Links */}
        <div className="mb-2 flex flex-wrap justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{siteMetadata.author}</span>
          <span>•</span>
          <span>© {new Date().getFullYear()}</span>
          <span>•</span>
          <Link
            href="https://github.com/slametsampon/kawruhnology"
            className="text-blue-600 underline transition-colors duration-200 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            aria-label="Source code on GitHub"
          >
            {siteMetadata.title}
            <span> V-</span>
            {siteMetadata.version}
          </Link>
          <span>•</span>
          <Link
            href="/about"
            className="text-blue-600 underline transition-colors duration-200 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            aria-label="About page"
          >
            About
          </Link>
        </div>
      </div>
    </footer>
  );
}
