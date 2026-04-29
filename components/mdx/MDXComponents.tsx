// components/mdx/MDXComponents.tsx

import React from 'react';
import Image from 'next/image';
import CustomLink from '@/components/Link';
import ResourceBox from './ResourceBox';
import { MermaidDiagram } from './MermaidDiagram';

type CodeElementProps = {
  className?: string;
  children?: React.ReactNode;
};

function getNodeText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getNodeText).join('');
  }

  if (React.isValidElement(node)) {
    const props = node.props as {
      children?: React.ReactNode;
    };

    return getNodeText(props.children);
  }

  return '';
}

function Pre(props: React.HTMLAttributes<HTMLPreElement>) {
  const { children, ...rest } = props;

  if (React.isValidElement(children)) {
    const childProps = children.props as CodeElementProps;
    const className = childProps.className ?? '';

    if (className.includes('language-mermaid')) {
      const chart = getNodeText(childProps.children).trim();

      return <MermaidDiagram chart={chart} />;
    }
  }

  return (
    <pre
      {...rest}
      className="my-6 overflow-x-auto rounded-lg bg-gray-950 p-4 text-sm text-gray-100"
    >
      {children}
    </pre>
  );
}

export const MDXComponents = {
  Image,
  a: CustomLink,
  ResourceBox,
  pre: Pre,
};
