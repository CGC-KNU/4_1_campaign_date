import Link from 'next/link'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { getCanonicalUrl } from '../lib/site'

const APP_STORE_URL = 'https://apps.apple.com/kr/app/wouldulike/id6740640251'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.coggiri.new1'

export default function Home(){
  const [appPrimaryUrl, setAppPrimaryUrl] = useState(PLAY_STORE_URL)
  const canonicalUrl = getCanonicalUrl('/')

  useEffect(()=>{
    if(typeof navigator === 'undefined') return
    if(/iPhone|iPad|iPod/i.test(navigator.userAgent)){
      setAppPrimaryUrl(APP_STORE_URL)
      return
    }
    setAppPrimaryUrl(PLAY_STORE_URL)
  }, [])

  return (
    <div className="container home-page">
      <Head>
        <title>우주라이크 캠페인</title>
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:url" content={canonicalUrl} />
      </Head>

      <section className="mobile-shell home-app-shell">
        <section className="card home-hero home-hero-app">
          <div className="hero-topline">
            <div className="home-brand-block">
              <div className="campaign-label">우주라이크</div>
            </div>
            <div className="eyebrow">데이트 캠페인</div>
          </div>

          <div className="home-promo-card">
            <div className="home-promo-copy">
              <h1>식사 전, 술자리, 데이트 중 가볍게 즐기기 좋은 미니게임</h1>
              <p className="hero-copy">대화 주제 카드, 고기굽기 게임, 귓속말 게임까지 지금 분위기에 맞게 바로 골라 즐겨보세요.</p>
              <div className="home-download-cta">
                <div className="home-download-copy">
                  <strong>우주라이크 앱에서 더 많은 혜택을 만나보세요</strong>
                  <span>대학가 식당 약 30곳에서 사용할 수 있는 쿠폰과 스탬프 혜택을 우주라이크 앱에서 바로 확인해보세요.</span>
                </div>
                <a className="home-store-btn unified" href={appPrimaryUrl} target="_blank" rel="noreferrer">
                  <span className="home-store-kicker">Wouldulike App</span>
                  <strong>우주라이크 앱 다운받기</strong>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="grid home-grid">
          <Link href="/meat" className="tile card event-card featured">
            <div className="event-thumb event-thumb-meat" aria-hidden="true">
              <span className="thumb-chip">Timing Game</span>
              <span className="thumb-top-glow" />
              <span className="thumb-grill-frame" />
              <span className="thumb-grill-bars">
                <span />
                <span />
                <span />
                <span />
                <span />
              </span>
              <span className="thumb-grill-base" />
              <span className="thumb-table-glow" />
              <span className="thumb-steak thumb-steak-main">
                <span className="thumb-sear thumb-sear-a" />
                <span className="thumb-sear thumb-sear-b" />
                <span className="thumb-sear thumb-sear-c" />
              </span>
              <span className="thumb-steak-gloss" />
              <span className="thumb-heat thumb-heat-a" />
              <span className="thumb-heat thumb-heat-b" />
              <span className="thumb-ember thumb-ember-a" />
              <span className="thumb-ember thumb-ember-b" />
              <span className="thumb-ember thumb-ember-c" />
            </div>
            <div className="event-top">
              <span className="event-badge live">타이밍 게임</span>
              <span className="event-status">모바일 최적화</span>
            </div>
            <h3>미디움 레어로 부탁합니다</h3>
            <p className="muted">주문한 굽기에 맞춰 타이밍 좋게 고기를 구워보세요. 짧게 즐기기 좋은 미니게임입니다.</p>
            <div className="event-meta">
              <span>타이밍 게임</span>
              <span>1분 게임</span>
              <span>모바일 최적화</span>
            </div>
            <div className="event-cta">게임 시작하기</div>
          </Link>

          <Link href="/talkcards" className="tile card event-card">
            <div className="event-thumb event-thumb-talk" aria-hidden="true">
              <span className="thumb-chip">Talk Cards</span>
              <span className="thumb-talk-glow" />
              <span className="thumb-phone" />
              <span className="thumb-card thumb-card-a" />
              <span className="thumb-card thumb-card-b" />
              <span className="thumb-card thumb-card-c" />
              <span className="thumb-label thumb-label-a">밸런스 게임</span>
              <span className="thumb-label thumb-label-b">만약에</span>
              <span className="thumb-label thumb-label-c">아이스브레이킹</span>
              <span className="thumb-heart thumb-heart-a" />
              <span className="thumb-heart thumb-heart-b" />
              <span className="thumb-message-line thumb-message-line-a" />
              <span className="thumb-message-line thumb-message-line-b" />
            </div>
            <div className="event-top">
              <span className="event-badge live">대화형</span>
              <span className="event-status">카드형</span>
            </div>
            <h3>썸·커플 토크 카드</h3>
            <p className="muted">분위기에 맞는 질문 카드를 넘기며 자연스럽게 대화를 이어가보세요.</p>
            <div className="event-meta">
              <span>대화형</span>
              <span>밸런스 게임</span>
              <span>상황 질문</span>
            </div>
            <div className="event-cta subtle">카드 보러가기</div>
          </Link>

          <Link href="/whisper" className="tile card event-card">
            <div className="event-thumb event-thumb-whisper" aria-hidden="true">
              <span className="thumb-chip">Whisper Game</span>
              <span className="thumb-whisper-glow" />
              <span className="thumb-ear thumb-ear-left" />
              <span className="thumb-ear thumb-ear-right" />
              <span className="thumb-bubble thumb-bubble-left">
                <span className="thumb-ellipsis">...</span>
              </span>
              <span className="thumb-bubble thumb-bubble-right">
                <span className="thumb-ellipsis">...</span>
              </span>
              <span className="thumb-wave thumb-wave-a" />
              <span className="thumb-wave thumb-wave-b" />
            </div>
            <div className="event-top">
              <span className="event-badge live">파티형</span>
              <span className="event-status">술 게임</span>
            </div>
            <h3>귓속말 게임</h3>
            <p className="muted">귓속말로 질문을 전하고, 어울리는 사람을 지목하며 이어가는 가볍고 웃긴 파티 게임이에요.</p>
            <div className="event-meta">
              <span>지목 게임</span>
              <span>질문 전달</span>
              <span>파티형 게임</span>
            </div>
            <div className="event-cta subtle">게임 시작하기</div>
          </Link>
        </section>
      </section>
    </div>
  )
}
