// components/Link.tsx

/* eslint-disable jsx-a11y/anchor-has-content */
import Link from 'next/link';
import type { AnchorHTMLAttributes } from 'react';

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement>;

const CustomLink = ({ href, ...rest }: AnchorProps) => {
  if (!href) {
    return <a {...rest} />;
  }

  const isInternal = href.startsWith('/');
  const isAnchor = href.startsWith('#');

  if (isInternal) {
    return (
      <Link href={href} {...rest}>
        {rest.children}
      </Link>
    );
  }

  if (isAnchor) {
    return <a href={href} {...rest} />;
  }

  return <a href={href} target="_blank" rel="noopener noreferrer" {...rest} />;
};

export default CustomLink;
