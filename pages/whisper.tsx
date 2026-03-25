import Head from 'next/head'
import { getCanonicalUrl } from '../lib/site'

export default function MBTI() {
  const canonicalUrl = getCanonicalUrl('/whisper')

  return (
    <>
      <Head>
        <title>귓속말 게임</title>
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:url" content={canonicalUrl} />
      </Head>

      <main
        style={{
          width: '100%',
          minHeight: '100dvh',
          background: '#090606',
        }}
      >
        <iframe
          src="/whisper-game/index.html"
          title="귓속말 게임"
          style={{
            display: 'block',
            width: '100%',
            minHeight: '100dvh',
            border: 0,
          }}
        />
      </main>
    </>
  )
}
