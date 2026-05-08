// components/Link.tsx

/* eslint-disable jsx-a11y/anchor-has-content */
import Link from 'next/link';
import type { AnchorHTMLAttributes } from 'react';

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement>;

const CustomLink = ({ href = '', children, ...rest }: AnchorProps) => {
  const isInternalLink = href.startsWith('/');
  const isAnchorLink = href.startsWith('#');

  if (isInternalLink) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }

  if (isAnchorLink) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  );
};

export default CustomLink;
