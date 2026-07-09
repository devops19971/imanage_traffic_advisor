import Head from 'next/head'

export default function SeoHead({
  title = 'iManage Traffic Advisor — Know When to Leave',
  description = 'Real-time traffic advisor. Enter your destination, check live traffic conditions, and get notified when it\'s the best time to leave.',
  canonical = '/',
}) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="canonical" href={`https://imanage-traffic-advisor.vercel.app${canonical}`} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`https://imanage-traffic-advisor.vercel.app${canonical}`} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🗺️</text></svg>" />
    </Head>
  )
}
