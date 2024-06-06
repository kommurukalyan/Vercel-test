import React from 'react';

import Seo from '@/components/layout/Seo';
interface PagebaseProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

/**
 * PageBase Component
 *
 * @param {PagebaseProps} props Component Props
 * @returns {JSX} JSX
 */
export default function PageBase(props: PagebaseProps) {
  return (
    <>
      <Seo templateTitle={props.title} description={props.description} />
      <div className="pageContainer">{props.children}</div>
    </>
  );
}
