import Head from 'next/head';

import {
  BASE_URL,
  METADATA_DESCRIPTION,
  METADATA_TITLE,
} from '@/lib/constants';
import Script from 'next/script';

const defaultMeta = {
  title: METADATA_TITLE,
  siteName: 'Menu-Bridge',
  description: METADATA_DESCRIPTION,
  url: BASE_URL,
  type: 'website',
  robots: 'follow, index',
  // TODO: Replace Image and icons
  image: 'http://localhost:3000/images/logo.png',
};
const favicons: Array<React.ComponentPropsWithoutRef<'link'>> = [
  {
    rel: 'apple-touch-icon',
    sizes: '180x180',
    href: '/images/logo.png',
  },
];

type SeoProps = {
  templateTitle?: string;
} & Partial<typeof defaultMeta>;
/**
 * Seo Component
 *
 * @param {SeoProps} props Component Props
 * @returns {JSX} JSX
 */
export default function Seo(props: SeoProps) {
  const meta = {
    ...defaultMeta,
    ...props,
  };
  // Use siteName if there is templateTitle
  // but show full title if there is none
  meta['title'] = props.templateTitle
    ? `${props.templateTitle} | ${meta.siteName}`
    : meta.title;

  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="robots" content={meta.robots} />
        <meta content={meta.description} name="description" />
        <link rel="canonical" href={`${meta.url} `} />
        {/* // TODO: add App id */}
        <meta property="fb:app_id" content="" />
        <meta property="og:type" content={meta.type} />
        <meta property="og:site_name" content={meta.siteName} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:url" content={`${meta.url}`} />
        <meta name="image" property="og:image" content={meta.image} />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        {/* // TODO: Change twitter handle */}
        {/* <meta name='twitter:site' content='@th_clarence' /> */}
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
        {/* Favicons */}
        {favicons.map((linkProps) => (
          // eslint-disable-next-line react/jsx-props-no-spreading
          <link key={linkProps.href} {...linkProps} />
        ))}
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <Script type="application/javascript" async />
    </>
  );
}
