import Head from 'next/head'

export default function MBTI() {
  return (
    <>
      <Head>
        <title>귓속말 게임</title>
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
