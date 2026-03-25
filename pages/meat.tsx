import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import Script from 'next/script'
import { getCanonicalUrl } from '../lib/site'
import { getCouponBundleForDayKey } from '../lib/meatCoupons'

type Status = 'idle' | 'cooking' | 'flipped' | 'success' | 'fail'
type OrderId = 'raw' | 'rare' | 'mediumRare' | 'medium' | 'wellDone' | 'burnt'

type Order = {
  id: OrderId
  label: string
  guest: string
  note: string
  target: number
  tolerance: number
  difficulty: string
}

type RewardTier = {
  kind: 'limited' | 'basic' | 'rare' | 'legend' | 'none'
  code: string | null
  count: number
  label: string
  rarity: 'basic' | 'rare' | 'legend'
  headline: string
  detail: string
}

type DailyAttemptState = {
  resetKey: string
  used: number
  bonusAttempts: number
  sharedCount: number
  limitedClaimed: boolean
  extraRewardCount: number
  claimedBasicCodes: string[]
  claimedRare: boolean
  claimedLegend: boolean
}

type KakaoShareTarget = {
  isInitialized: () => boolean
  init: (appKey: string) => void
  Share?: {
    sendDefault: (options: Record<string, unknown>) => void
  }
  Link?: {
    sendDefault: (options: Record<string, unknown>) => void
  }
}

declare global {
  interface Window {
    Kakao?: KakaoShareTarget
  }
}

const ATTEMPT_STORAGE_KEY = 'meat-daily-attempts-v3'
const DAILY_LIMIT = 5
const MAX_EXTRA_REWARDS = 4
const FORCE_RESET_ATTEMPT_KEYS = new Set(['2026-03-26'])

const ORDERS: Order[] = [
  { id: 'raw', label: '생고기', guest: '빠른 손님', note: '겉만 살짝.', target: 1.2, tolerance: 0.5, difficulty: '쉬움' },
  { id: 'rare', label: '레어', guest: '첫 주문', note: '속은 붉게.', target: 3.9, tolerance: 0.55, difficulty: '보통' },
  { id: 'mediumRare', label: '미디움레어', guest: '인기 테이블', note: '육즙 있게.', target: 6.9, tolerance: 0.4, difficulty: '보통' },
  { id: 'medium', label: '미디움', guest: '신중한 손님', note: '속까지 고르게.', target: 8.8, tolerance: 0.45, difficulty: '약간 어려움' },
  { id: 'wellDone', label: '웰던', guest: '단골 손님', note: '붉은기 없이.', target: 11.0, tolerance: 0.5, difficulty: '어려움' },
  { id: 'burnt', label: '탄 고기', guest: '변칙 주문', note: '바싹 태우기.', target: 12.5, tolerance: 0.6, difficulty: '변칙' },
]

const COOKING_STAGES = [
  { threshold: 0.05, label: '주문 확인.' },
  { threshold: 0.12, label: '열 오르는 중.' },
  { threshold: 0.2, label: '겉면 변화 시작.' },
  { threshold: 0.28, label: '첫 향이 올라와요.' },
  { threshold: 0.36, label: '시어링 진행 중.' },
  { threshold: 0.46, label: '주문 굽기 체크.' },
  { threshold: 0.56, label: '육즙 구간.' },
  { threshold: 0.66, label: '결정이 가까워요.' },
  { threshold: 0.76, label: '미디움권 진입.' },
  { threshold: 0.86, label: '지금이 중요해요.' },
  { threshold: 0.94, label: '늦으면 오버.' },
  { threshold: 1.01, label: '곧 타버려요.' },
]

const STATUS_STEPS = [
  { key: 'preheat', icon: 'F', label: '예열', activeAt: 0.1 },
  { key: 'searing', icon: 'S', label: '굽기', activeAt: 0.32 },
  { key: 'juice', icon: 'J', label: '육즙', activeAt: 0.56 },
  { key: 'decision', icon: 'T', label: '타이밍', activeAt: 0.78 },
]

function randomInt(min: number, max: number){
  return Math.floor(Math.random()*(max-min+1))+min
}

function pickRandomOrder(){
  return ORDERS[randomInt(0, ORDERS.length - 1)]
}

function classifyDoneness(elapsed: number): OrderId{
  if(elapsed < 2.0) return 'raw'
  if(elapsed < 5.1) return 'rare'
  if(elapsed < 7.9) return 'mediumRare'
  if(elapsed < 9.9) return 'medium'
  if(elapsed < 12.0) return 'wellDone'
  return 'burnt'
}

function getDonenessLabel(id: OrderId){
  return ORDERS.find((order)=> order.id === id)?.label ?? id
}

function formatDayKey(date: Date){
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getCampaignResetKey(date = new Date()){
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  })
  const parts = formatter.formatToParts(date)
  const getValue = (type: Intl.DateTimeFormatPartTypes) => parts.find((part)=> part.type === type)?.value ?? '00'
  const year = Number(getValue('year'))
  const month = Number(getValue('month'))
  const day = Number(getValue('day'))
  const hour = Number(getValue('hour'))

  const baseDate = new Date(Date.UTC(year, month - 1, day))
  if(hour < 10){
    baseDate.setUTCDate(baseDate.getUTCDate() - 1)
  }

  return formatDayKey(baseDate)
}

function createAttemptState(resetKey = getCampaignResetKey()): DailyAttemptState{
  return {
    resetKey,
    used: 0,
    bonusAttempts: 0,
    sharedCount: 0,
    limitedClaimed: false,
    extraRewardCount: 0,
    claimedBasicCodes: [],
    claimedRare: false,
    claimedLegend: false,
  }
}

function normalizeAttemptState(state?: DailyAttemptState | null, resetKey = getCampaignResetKey()){
  if(!state || state.resetKey !== resetKey){
    return createAttemptState(resetKey)
  }

  const normalizedState = {
    resetKey,
    used: state.used ?? 0,
    bonusAttempts: state.bonusAttempts ?? 0,
    sharedCount: state.sharedCount ?? 0,
    limitedClaimed: state.limitedClaimed ?? false,
    extraRewardCount: state.extraRewardCount ?? 0,
    claimedBasicCodes: state.claimedBasicCodes ?? [],
    claimedRare: state.claimedRare ?? false,
    claimedLegend: state.claimedLegend ?? false,
  }

  if(FORCE_RESET_ATTEMPT_KEYS.has(resetKey)){
    return {
      ...normalizedState,
      used: 0,
      bonusAttempts: 0,
      sharedCount: 0,
    }
  }

  return normalizedState
}

function pickRandomItem<T>(items: T[]){
  return items[randomInt(0, items.length - 1)]
}

function getRewardForSuccess(state: DailyAttemptState): RewardTier{
  const bundle = getCouponBundleForDayKey(state.resetKey)
  if(!bundle){
    return {
      kind: 'none',
      code: null,
      count: 0,
      label: '쿠폰 준비 중',
      rarity: 'basic',
      headline: '오늘 쿠폰 준비 중',
      detail: '오늘 사용할 쿠폰 구성이 아직 등록되지 않았어요.',
    }
  }

  if(!state.limitedClaimed){
    return {
      kind: 'limited',
      code: bundle.limited,
      count: 1,
      label: '캠페인 한정 쿠폰',
      rarity: 'basic',
      headline: '오늘 첫 성공 보상',
      detail: '매일 첫 성공에는 캠페인 한정 쿠폰 코드가 열려요.',
    }
  }

  const availableBasicCodes = bundle.basic.filter((code)=> !state.claimedBasicCodes.includes(code))
  const roll = Math.random() * 100

  if(!state.claimedLegend && roll < 1){
    return {
      kind: 'legend',
      code: bundle.legend,
      count: 5,
      label: '5종 쿠폰',
      rarity: 'legend',
      headline: '1% 희귀 보상 등장',
      detail: '추가 성공 보상에서 1% 확률 코드가 나왔어요. 이 성공도 4회 한도에 포함됩니다.',
    }
  }

  if(!state.claimedRare && roll < 6){
    return {
      kind: 'rare',
      code: bundle.rare,
      count: 3,
      label: '3종 쿠폰',
      rarity: 'rare',
      headline: '5% 희귀 보상 등장',
      detail: '추가 성공 보상에서 5% 확률 코드가 나왔어요. 이 성공도 4회 한도에 포함됩니다.',
    }
  }

  if(availableBasicCodes.length > 0){
    return {
      kind: 'basic',
      code: pickRandomItem(availableBasicCodes),
      count: 1,
      label: '기본 1종 쿠폰',
      rarity: 'basic',
      headline: '추가 성공 보상 지급',
      detail: '추가 성공 보상은 하루 최대 4번까지 받을 수 있고, 기본 4종 코드는 매번 랜덤 순서로 열려요.',
    }
  }

  if(!state.claimedRare){
    return {
      kind: 'rare',
      code: bundle.rare,
      count: 3,
      label: '3종 쿠폰',
      rarity: 'rare',
      headline: '5% 희귀 보상 등장',
      detail: '기본 코드가 모두 소진되어 남아 있는 희귀 코드가 지급됐어요.',
    }
  }

  if(!state.claimedLegend){
    return {
      kind: 'legend',
      code: bundle.legend,
      count: 5,
      label: '5종 쿠폰',
      rarity: 'legend',
      headline: '1% 희귀 보상 등장',
      detail: '기본 코드가 모두 소진되어 남아 있는 초희귀 코드가 지급됐어요.',
    }
  }

  return {
    kind: 'none',
    code: null,
    count: 0,
    label: '오늘 보상 마감',
    rarity: 'basic',
    headline: '오늘 받을 수 있는 쿠폰을 모두 열었어요',
    detail: '오늘은 더 이상 새로운 쿠폰 코드가 남아 있지 않아요.',
  }
}

function applyRewardToAttemptState(state: DailyAttemptState, reward: RewardTier){
  if(reward.kind === 'none'){
    return state
  }

  if(reward.kind === 'limited'){
    return {
      ...state,
      limitedClaimed: true,
    }
  }

  const nextState: DailyAttemptState = {
    ...state,
    extraRewardCount: Math.min(MAX_EXTRA_REWARDS, state.extraRewardCount + 1),
  }

  if(reward.kind === 'basic' && reward.code){
    nextState.claimedBasicCodes = [...state.claimedBasicCodes, reward.code]
  }

  if(reward.kind === 'rare'){
    nextState.claimedRare = true
  }

  if(reward.kind === 'legend'){
    nextState.claimedLegend = true
  }

  return nextState
}

const APP_STORE_URL = 'https://apps.apple.com/kr/app/wouldulike/id6740640251'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.coggiri.new1'

async function copyText(text: string){
  if(typeof window === 'undefined') return false

  if(navigator.clipboard?.writeText){
    try{
      await navigator.clipboard.writeText(text)
      return true
    } catch {}
  }

  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.setAttribute('readonly', 'true')
  textArea.style.position = 'fixed'
  textArea.style.top = '0'
  textArea.style.left = '-9999px'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try{
    const copied = document.execCommand('copy')
    document.body.removeChild(textArea)
    return copied
  } catch {
    document.body.removeChild(textArea)
    return false
  }
}

export default function MeatGrill(){
  const canonicalUrl = getCanonicalUrl('/meat')
  const [attemptState, setAttemptState] = useState<DailyAttemptState>(createAttemptState)
  const [storageReady, setStorageReady] = useState(false)
  const [status,setStatus] = useState<Status>('idle')
  const [time,setTime] = useState(0)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [lastResult, setLastResult] = useState<OrderId | null>(null)
  const [coupon,setCoupon] = useState<string | null>(null)
  const [rewardTier, setRewardTier] = useState<RewardTier | null>(null)
  const [copied, setCopied] = useState(false)
  const [showConfetti,setShowConfetti] = useState(false)
  const [closedUiReady, setClosedUiReady] = useState(false)
  const [soldOutUiReady, setSoldOutUiReady] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [orderPulse, setOrderPulse] = useState(false)
  const [confetti, setConfetti] = useState<Array<{left:number, bg:string, delay:number, rot:number}>>([])
  const [sharePending, setSharePending] = useState(false)
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
  const [progressTextFrame, setProgressTextFrame] = useState(0)
  const timerRef = useRef<number|undefined>(undefined)
  const resetRef = useRef<number|undefined>(undefined)
  const startRef = useRef<number|undefined>(undefined)
  const currentAttemptState = normalizeAttemptState(attemptState)
  const todayBundle = getCouponBundleForDayKey(currentAttemptState.resetKey)

  useEffect(()=>{
    if(typeof window === 'undefined') return
    const saved = window.localStorage.getItem(ATTEMPT_STORAGE_KEY)

    if(saved){
      try{
        const parsed = JSON.parse(saved) as DailyAttemptState
        setAttemptState(normalizeAttemptState(parsed))
        setStorageReady(true)
        return
      } catch {}
    }

    setAttemptState(createAttemptState())
    setStorageReady(true)
  }, [])

  useEffect(()=>{
    if(typeof window === 'undefined' || !storageReady) return
    const syncReset = ()=>{
      setAttemptState((prev)=> normalizeAttemptState(prev))
    }

    syncReset()
    const timer = window.setInterval(syncReset, 60 * 1000)
    return ()=> window.clearInterval(timer)
  }, [storageReady])

  useEffect(()=>{
    if(typeof window === 'undefined' || !storageReady || !currentAttemptState.resetKey) return
    window.localStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(currentAttemptState))
  }, [currentAttemptState, storageReady])

  useEffect(()=>{
    if(status==='cooking'){
      startRef.current = Date.now()
      timerRef.current = window.setInterval(()=>{
        const secs = ((Date.now()) - (startRef.current||Date.now()))/1000
        setTime(Number(secs.toFixed(1)))
      },100)
    }
    return ()=>{
      if(timerRef.current) window.clearInterval(timerRef.current)
    }
  },[status])

  useEffect(()=>{
    if(showConfetti){
      const pieceCount = rewardTier?.rarity === 'legend' ? 42 : rewardTier?.rarity === 'rare' ? 28 : 18
      const palette = rewardTier?.rarity === 'legend'
        ? ['#ffcf66','#fff0a8','#ff8f5a','#ffd6e8','#fff7da']
        : rewardTier?.rarity === 'rare'
          ? ['#ffd199','#ff7a59','#ffe0ad','#ffc4dd']
          : ['#ff7a59','#ffd199','#7de0b8','#7ac4ff']
      const pieces = Array.from({length:pieceCount}).map(()=>({
        left: randomInt(10,260),
        bg: palette[randomInt(0,palette.length - 1)],
        delay: randomInt(0,420),
        rot: randomInt(0,360)
      }))
      setConfetti(pieces)
      const t = setTimeout(()=>{ setShowConfetti(false); setConfetti([]) }, rewardTier?.rarity === 'legend' ? 2400 : rewardTier?.rarity === 'rare' ? 1900 : 1600)
      return ()=>clearTimeout(t)
    }
  },[rewardTier, showConfetti])

  useEffect(()=>{
    if(!copied) return
    const t = window.setTimeout(()=> setCopied(false), 1800)
    return ()=> window.clearTimeout(t)
  }, [copied])

  useEffect(()=>{
    if(!shareFeedback) return
    const t = window.setTimeout(()=> setShareFeedback(null), 2200)
    return ()=> window.clearTimeout(t)
  }, [shareFeedback])

  useEffect(()=>{
    if(status !== 'cooking'){
      setProgressTextFrame(0)
      return
    }

    const timer = window.setInterval(()=>{
      setProgressTextFrame((prev)=> prev + 1)
    }, 320)

    return ()=> window.clearInterval(timer)
  }, [status])

  useEffect(()=>{
    return ()=>{
      if(timerRef.current) window.clearInterval(timerRef.current)
      if(resetRef.current) window.clearTimeout(resetRef.current)
    }
  },[])

  function start(){
    if(timerRef.current) window.clearInterval(timerRef.current)
    if(resetRef.current) window.clearTimeout(resetRef.current)
    if(remainingAttempts <= 0 || isCouponSoldOut) return

    const nextOrder = pickRandomOrder()
    setAttemptState((prev)=>{
      const base = normalizeAttemptState(prev)
      if(base.used >= DAILY_LIMIT && base.bonusAttempts > 0){
        return {
          ...base,
          bonusAttempts: base.bonusAttempts - 1,
        }
      }
      return {
        ...base,
        used: Math.min(DAILY_LIMIT, base.used + 1),
      }
    })
    setCurrentOrder(nextOrder)
    setOrderPulse(true)
    setTime(0)
    setCoupon(null)
    setRewardTier(null)
    setCopied(false)
    setClosedUiReady(false)
    setSoldOutUiReady(false)
    setLastResult(null)
    setIsFlipping(false)
    setStatus('cooking')
    window.setTimeout(()=> setOrderPulse(false), 700)
  }

  function flip(){
    if(status !== 'cooking' || isFlipping || !currentOrder) return

    const elapsed = ((Date.now()) - (startRef.current||Date.now()))/1000
    const achieved = classifyDoneness(elapsed)
    const isSuccess = elapsed >= (currentOrder.target - currentOrder.tolerance) && elapsed <= (currentOrder.target + currentOrder.tolerance)

    setIsFlipping(true)
    setStatus('flipped')
    setLastResult(achieved)

    if(timerRef.current) window.clearInterval(timerRef.current)

    window.setTimeout(()=>{
      if(isSuccess){
        const nextReward = getRewardForSuccess(currentAttemptState)
        setAttemptState((prev)=> applyRewardToAttemptState(normalizeAttemptState(prev), nextReward))
        setStatus('success')
        setRewardTier(nextReward)
        setCoupon(nextReward.code)
        setShowConfetti(Boolean(nextReward.code))
      } else {
        setStatus('fail')
        resetRef.current = window.setTimeout(()=>{
          setStatus('idle')
        }, remainingAttempts <= 0 ? 1200 : 2200)
      }
      setIsFlipping(false)
    }, 360)
  }

  async function copyCoupon(){
    if(!coupon) return
    const didCopy = await copyText(coupon)
    if(didCopy){
      setCopied(true)
      setShareFeedback('쿠폰 코드가 복사됐어요.')
    } else {
      setCopied(false)
      setShareFeedback('코드 복사에 실패했어요. 길게 눌러 직접 복사해주세요.')
    }
  }

  function getSharePayload(){
    const shareUrl = canonicalUrl
    const shareText = [
      '🔥 [미디움 레어로 부탁합니다]',
      '친구가 고기 굽기에 재도전 중이에요 🥩',
      '굽기 시작 → 뒤집기 타이밍만 잘 맞추면 끝!',
      '공유 보너스로 추가 도전 1회를 받을 수 있어요 👀',
      '한 번만 도와줘',
      shareUrl,
    ].join('\n')
    return { shareUrl, shareText }
  }

  function sendKakaoInvite(shareUrl: string, shareText: string){
    if(typeof window === 'undefined') return false

    const kakao = window.Kakao
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
    if(!kakao || !kakaoKey) return false

    if(!kakao.isInitialized()){
      kakao.init(kakaoKey)
    }

    const sendDefault = kakao.Share?.sendDefault ?? kakao.Link?.sendDefault
    if(!sendDefault){
      return false
    }

    sendDefault({
      objectType: 'text',
      text: shareText,
      link: {
        mobileWebUrl: shareUrl,
        webUrl: shareUrl,
      },
      buttonTitle: '게임 하러 가기',
    })

    return true
  }

  function awardBonusAttempt(){
    setAttemptState((prev)=>{
      const base = normalizeAttemptState(prev)
      return {
        ...base,
        bonusAttempts: base.bonusAttempts + 1,
        sharedCount: base.sharedCount + 1,
      }
    })
  }

  async function shareForExtraAttempt(){
    if(sharePending || typeof window === 'undefined') return

    setSharePending(true)
    const { shareUrl, shareText } = getSharePayload()

    try{
      const didOpenKakao = sendKakaoInvite(shareUrl, shareText)

      if(!didOpenKakao && navigator.share){
        await navigator.share({
          title: '미디움 레어로 부탁합니다',
          text: shareText,
          url: shareUrl,
        })
      } else if(!didOpenKakao){
        const didCopy = await copyText(`${shareText}\n${shareUrl}`)
        if(!didCopy){
          throw new Error('copy failed')
        }
      }

      awardBonusAttempt()
      setShareFeedback('친구 초대가 완료되어 추가 기회 1회가 생겼어요.')
    } catch (error) {
      if(error instanceof DOMException && error.name === 'AbortError'){
        setShareFeedback('친구 초대가 취소되어 추가 기회가 지급되지 않았어요.')
      } else {
        setShareFeedback('친구 초대를 열지 못했어요. 다시 시도해주세요.')
      }
    } finally {
      setSharePending(false)
    }
  }

  const total = 13.5
  const progress = Math.min(1, time / total)
  const baseRemainingAttempts = Math.max(0, DAILY_LIMIT - currentAttemptState.used)
  const remainingAttempts = baseRemainingAttempts + currentAttemptState.bonusAttempts
  const totalClaimedCoupons = (currentAttemptState.limitedClaimed ? 1 : 0) + currentAttemptState.extraRewardCount
  const isCouponSoldOut = totalClaimedCoupons >= 5
  useEffect(()=>{
    if(remainingAttempts > 0){
      setClosedUiReady(false)
      return
    }

    if(status === 'success'){
      const timer = window.setTimeout(()=> setClosedUiReady(true), 1700)
      return ()=> window.clearTimeout(timer)
    }

    if(status === 'fail' || status === 'idle'){
      setClosedUiReady(true)
      return
    }

    setClosedUiReady(false)
  }, [remainingAttempts, status])
  useEffect(()=>{
    if(!isCouponSoldOut){
      setSoldOutUiReady(false)
      return
    }

    if(status === 'success'){
      const timer = window.setTimeout(()=> setSoldOutUiReady(true), 950)
      return ()=> window.clearTimeout(timer)
    }

    if(status === 'idle' || status === 'fail'){
      setSoldOutUiReady(true)
      return
    }

    setSoldOutUiReady(false)
  }, [isCouponSoldOut, status])
  const showSoldOutOverlay = isCouponSoldOut && status !== 'cooking' && status !== 'flipped' && status !== 'success' && soldOutUiReady
  const showClosedOverlay = !isCouponSoldOut && remainingAttempts <= 0 && status !== 'cooking' && status !== 'flipped' && status !== 'success' && closedUiReady
  const showShareBonusPanel = !isCouponSoldOut && remainingAttempts <= 0 && status !== 'cooking' && status !== 'flipped' && closedUiReady
  const couponBoardTopRow = todayBundle ? [
    {
      key: `limited-${todayBundle.limited}`,
      label: '첫 성공',
      display: currentAttemptState.limitedClaimed ? todayBundle.limited : '미획득',
      tone: 'limited',
      claimed: currentAttemptState.limitedClaimed,
    },
    {
      key: `rare-${todayBundle.rare}`,
      label: '3종 쿠폰 (5%)',
      display: currentAttemptState.claimedRare ? todayBundle.rare : '미획득',
      tone: 'rare',
      claimed: currentAttemptState.claimedRare,
    },
    {
      key: `legend-${todayBundle.legend}`,
      label: '5종 쿠폰 (1%)',
      display: currentAttemptState.claimedLegend ? todayBundle.legend : '미획득',
      tone: 'legend',
      claimed: currentAttemptState.claimedLegend,
    },
  ] : []
  const couponBoardBottomRow = todayBundle ? todayBundle.basic.map((code, index)=> ({
    key: `basic-${code}`,
    label: `1종 쿠폰 ${index + 1}`,
    display: currentAttemptState.claimedBasicCodes.includes(code) ? code : '미획득',
    tone: 'basic',
    claimed: currentAttemptState.claimedBasicCodes.includes(code),
  })) : []

  const meatStage = (()=>{
    if(status === 'cooking'){
      if(progress < 0.16) return 'raw'
      if(progress < 0.3) return 'rare'
      if(progress < 0.48) return 'medium-rare'
      if(progress < 0.68) return 'medium'
      if(progress < 0.88) return 'well-done'
      return 'burnt'
    }
    if(lastResult) return lastResult.replace(/([A-Z])/g, '-$1').toLowerCase()
    return 'raw'
  })()

  const cookingMessage = useMemo(()=>{
    if(status === 'success' && currentOrder) return `${currentOrder.guest} 주문 성공. ${rewardTier?.headline ?? '쿠폰이'} 열렸어요.`
    if(status === 'fail' && currentOrder && lastResult) return `${currentOrder.label} 주문, 결과는 ${getDonenessLabel(lastResult)}.`
    if(status === 'flipped') return '뒤집는 중...'
    if(status !== 'cooking') return '주문을 기다리는 중.'
    const stage = COOKING_STAGES.find((item)=> progress < item.threshold)
    return stage?.label ?? '지금 뒤집을지 판단해보세요.'
  }, [currentOrder, lastResult, progress, rewardTier, status])

  const donenessLabel = useMemo(()=>{
    if(status === 'success') return currentOrder ? `${currentOrder.label} 완성` : '주문 성공'
    if(status === 'fail') return lastResult ? `${getDonenessLabel(lastResult)}로 완성됨` : '주문 실패'
    if(status === 'flipped') return '플레이팅 직전'
    if(status !== 'cooking') return '주문 대기'
    if(progress < 0.08) return '차가운 중심'
    if(progress < 0.16) return '겉면 예열'
    if(progress < 0.24) return '수분 반응 시작'
    if(progress < 0.34) return '은은한 레어권'
    if(progress < 0.44) return '레어 안정권'
    if(progress < 0.56) return '미디움레어 후보'
    if(progress < 0.66) return '미디움 진입'
    if(progress < 0.76) return '중심 열 확산'
    if(progress < 0.86) return '웰던에 가까움'
    if(progress < 0.94) return '강한 시어링'
    return '탄 향 직전'
  }, [currentOrder, lastResult, progress, status])

  const guestReaction = useMemo(()=>{
    if(status === 'success' && currentOrder) return { mood: 'happy', line: `"딱 좋아요. 제가 원한 굽기예요!"` }
    if(status === 'fail' && currentOrder && lastResult){
      const underCooked = ORDERS.findIndex((item)=> item.id === lastResult) < ORDERS.findIndex((item)=> item.id === currentOrder.id)
      return {
        mood: 'sad',
        line: underCooked
          ? `"조금 덜 익었어요."`
          : `"조금 더 익었어요."`
      }
    }
    if(status === 'cooking' && currentOrder) return { mood: 'waiting', line: `"${currentOrder.label} 부탁해요."` }
    return { mood: 'neutral', line: '주문 오면 바로 시작해요.' }
  }, [currentOrder, lastResult, status])

  const meatClass = `meat ${meatStage} ${status==='flipped' || status==='success' || status==='fail' ? 'flipped' : ''} ${status==='cooking' ? 'sizzling' : ''} ${isFlipping ? 'is-flipping' : ''}`
  const flameCount = status === 'cooking' ? 3 : 2
  const appPrimaryUrl = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)
    ? APP_STORE_URL
    : PLAY_STORE_URL
  const activeProgressStep = useMemo(()=>{
    if(status !== 'cooking') return null
    return STATUS_STEPS.filter((step)=> progress >= step.activeAt).at(-1) ?? STATUS_STEPS[0]
  }, [progress, status])
  const progressStepLabel = useMemo(()=>{
    if(!activeProgressStep) return ''
    const label = activeProgressStep.label
    const building = Array.from({ length: label.length }, (_, index)=> label.slice(0, index + 1))
    const frames = [...building, label, `${label}.`, `${label}..`, `${label}...`]
    return frames[progressTextFrame % frames.length]
  }, [activeProgressStep, progressTextFrame])

  return (
    <>
      <Script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js" strategy="afterInteractive" />
      <Head>
        <title>미디움 레어로 부탁합니다</title>
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:url" content={canonicalUrl} />
      </Head>

      <div className="container meat-page">
        <div className="space-decor space-decor-a" />
        <div className="space-decor space-decor-b" />
        <div className="spark spark-a" />
        <div className="spark spark-b" />

        <section className="hero card meat-hero mobile-shell">
          <div className="hero-topline">
            <div className="campaign-label">우주라이크 데이트 캠페인</div>
            <div className="eyebrow">Event Game</div>
          </div>
          <h1>미디움 레어로 부탁합니다</h1>
        </section>

        <section className="card grill-stage-card mobile-shell">
          <div className="grill-stage-layout">
            <div className="control-panel">
              <div className="utility-row">
                <button type="button" className="btn ghost info-trigger" onClick={()=> setShowGuide(true)}>
                  게임 설명 자세히 보기
                </button>
                <div className="control-meta">
                  <div className="attempt-pill">오늘 {remainingAttempts}회 남음</div>
                </div>
              </div>
              <p className="attempt-caption">매일 오전 10시에 도전 횟수와 오늘의 7종 코드가 바뀝니다.</p>
              {todayBundle && (
                <>
                  <p className="attempt-caption coupon-board-heading">획득 가능한 쿠폰</p>
                  <div className="coupon-board">
                    <div className="coupon-board-row coupon-board-row-top">
                      {couponBoardTopRow.map((item)=> (
                        <div
                          key={item.key}
                          className={`coupon-board-item ${item.tone} ${item.claimed ? 'claimed' : 'available'}`}
                        >
                          <span className="coupon-board-label">{item.label}</span>
                          <strong>{item.display}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="coupon-board-row coupon-board-row-bottom">
                      {couponBoardBottomRow.map((item)=> (
                        <div
                          key={item.key}
                          className={`coupon-board-item ${item.tone} ${item.claimed ? 'claimed' : 'available'}`}
                        >
                          <span className="coupon-board-label">{item.label}</span>
                          <strong>{item.display}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {shareFeedback && <p className="share-feedback">{shareFeedback}</p>}
              {remainingAttempts <= 0 && (
                <p className="attempt-caption">오늘 도전 5회를 모두 사용했어요. 다음 기회는 오전 10시에 열립니다.</p>
              )}

            </div>

            <div className="stage-visual-panel">
              <div className="live-cook-card">
                <div className={`order-ticket ${orderPulse ? 'pop' : ''}`}>
                  <div className="ticket-label">ORDER SLIP</div>
                  {currentOrder ? (
                    <>
                      <div className="ticket-main">
                        <strong>{currentOrder.label}</strong>
                        <div className="ticket-side">
                          <span>{currentOrder.difficulty}</span>
                          <p className="ticket-copy">{currentOrder.guest} · {currentOrder.note}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="ticket-copy">`굽기 시작`으로 주문 받기</p>
                  )}
                </div>

                <div className="summary-grid compact">
                  <div className="summary-card">
                    <span className="summary-label">현재 상태</span>
                    <strong>{donenessLabel}</strong>
                  </div>
                  <div className="summary-card">
                    <span className="summary-label">대기 중인 손님</span>
                    <strong>{currentOrder ? currentOrder.guest : '손님 대기'}</strong>
                  </div>
                  <div className="summary-card">
                    <span className="summary-label">진행도</span>
                    <strong>{Math.round(progress * 100)}%</strong>
                  </div>
                </div>

                <div className="grill-wrap">
                  <div className={`grill ${status === 'cooking' ? 'active' : ''}`}>
                    <div className="ember-glow ember-left" />
                    <div className="ember-glow ember-right" />
                    <div className="grill-lid-light" />
                    <div className="grill-bars">
                      {Array.from({length: 6}).map((_, i)=> <span key={i} />)}
                    </div>
                    <div className={`spatula ${isFlipping ? 'active' : ''}`}>
                      <div className="spatula-head" />
                      <div className="spatula-handle" />
                    </div>
                    <div className="grill-surface">
                      <div className={meatClass} style={{transformStyle:'preserve-3d'}}>
                        <div className="meat-inner">
                          <span className="fat fat-a" />
                          <span className="fat fat-b" />
                          <span className="fat fat-c" />
                          <span className="marbling marbling-a" />
                          <span className="marbling marbling-b" />
                          <span className="marbling marbling-c" />
                          <span className="grill-mark grill-mark-a" />
                          <span className="grill-mark grill-mark-b" />
                          <span className="grill-mark grill-mark-c" />
                        </div>
                        <div className="meat-sear" />
                        <div className="meat-sear meat-sear-2" />
                      </div>
                      {status === 'cooking' && (
                        <div className="smoke-layer">
                          <span className="smoke smoke-a" />
                          <span className="smoke smoke-b" />
                          <span className="smoke smoke-c" />
                        </div>
                      )}
                      <div className="flames">
                        {Array.from({length: flameCount}).map((_, i)=> <span key={i} className={`flame flame-${i + 1}`} />)}
                      </div>
                    </div>
                    <div className="grill-front-panel">
                      <span />
                      <span />
                      <span />
                    </div>
                    {showConfetti && confetti.map((p,i)=> (
                      <div key={i} className="confetti-piece" style={{left:p.left, background:p.bg, top:10 + -randomInt(0,40), transform:`rotate(${p.rot}deg)`, animationDelay: `${p.delay}ms`}} />
                    ))}
                    {status === 'success' && (
                      <div className={`success-burst ${rewardTier?.rarity ?? 'basic'}`} aria-hidden="true">
                        <span className="success-kanji success-kanji-left">微</span>
                        <span className="success-kanji success-kanji-right">微</span>
                        <span className="burst-ring" />
                        <span className="burst-ring burst-ring-2" />
                        <span className="burst-ring burst-ring-3" />
                        <span className="burst-star burst-star-a" />
                        <span className="burst-star burst-star-b" />
                        <span className="burst-star burst-star-c" />
                        <span className="burst-star burst-star-d" />
                        <span className="burst-star burst-star-e" />
                        <span className="firework firework-a" />
                        <span className="firework firework-b" />
                        <span className="firework firework-c" />
                        <span className="firework firework-d" />
                      </div>
                    )}
                    {showSoldOutOverlay && (
                      <div className="grill-soldout-overlay">
                        <div className="shutter-door shutter-door-left" />
                        <div className="shutter-door shutter-door-right" />
                        <div className="soldout-sign">
                          <span className="soldout-sign-kicker">TODAY SOLD OUT</span>
                          <strong>재고 소진</strong>
                          <p>오늘 획득 가능한 쿠폰을 모두 받으셨어요.</p>
                          <span>내일도 맛있게 준비해둘게요. 다시 들러주세요.</span>
                        </div>
                      </div>
                    )}
                    {showClosedOverlay && (
                      <div className="grill-closed-overlay">
                        <div className="closed-sign-wrap" aria-hidden="true">
                          <div className="closed-sign-hanger">
                            <div className="closed-sign-swing">
                              <span className="closed-sign-rope closed-sign-rope-left" />
                              <span className="closed-sign-rope closed-sign-rope-right" />
                              <div className="closed-sign">
                                <span className="closed-sign-kicker">TODAY ONLY</span>
                                <strong>영업 정지</strong>
                                <span className="closed-sign-copy">오전 10시에 다시 열려요</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="play-controls-panel">
                  {showSoldOutOverlay ? (
                    <a className="btn play-store-suggestion-btn" href={appPrimaryUrl} target="_blank" rel="noreferrer">
                      이건 어때요?
                    </a>
                  ) : showShareBonusPanel ? (
                    <div className="share-bonus-panel compact grill-share-panel play-share-panel">
                      <div>
                        <strong>친구 초대하고 한 번 더 도전</strong>
                        <p className="attempt-caption">추가 기회 {currentAttemptState.bonusAttempts}회, 초대한 횟수 {currentAttemptState.sharedCount}회</p>
                      </div>
                      <button
                        type="button"
                        className="btn secondary share-bonus-btn"
                        onClick={shareForExtraAttempt}
                        disabled={sharePending}
                      >
                        {sharePending ? '초대 준비 중...' : '카카오톡으로 친구 초대'}
                      </button>
                    </div>
                  ) : (
                    <div className="button-row play-button-row">
                      <button className="btn" onClick={start} disabled={remainingAttempts <= 0 || isCouponSoldOut}>굽기 시작</button>
                      <div className="panel-timer play-panel-timer">
                        {time.toFixed(1)}s
                      </div>
                      <button className="btn secondary" onClick={flip}>뒤집기</button>
                    </div>
                  )}
                </div>

                <div className="status-panel">
                  <div>
                    <div className="panel-label">현재 상태</div>
                    <div className="panel-value">{donenessLabel}</div>
                  </div>
                  <p className="muted status-copy">{cookingMessage}</p>
                </div>

                <div className="progress meat-progress">
                  <span className={`progress-step-label visible ${progress < 0.5 ? 'light' : 'dark'}`}>{progressStepLabel}</span>
                  <i style={{width: `${Math.min(100,(time/total)*100)}%`}} />
                </div>

              </div>

              <div className={`guest-panel ${guestReaction.mood}`}>
                <div className={`guest-avatar ${guestReaction.mood}`}>
                  <span className="eye eye-left" />
                  <span className="eye eye-right" />
                  <span className="mouth" />
                </div>
                <div className="guest-bubble">
                  <div className="guest-name">{currentOrder ? currentOrder.guest : '대기 중인 손님'}</div>
                  <div>{guestReaction.line}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="result-card">
            {status==='success' && (
              <div className="success-card">
                <div className="success-kicker">COUPON UNLOCKED</div>
                <h2>주문 성공! 쿠폰 오픈</h2>
                <p className="muted">{rewardTier ? rewardTier.headline : '아래 코드로 바로 사용 가능해요.'}</p>
                <div className={`coupon-showcase ${rewardTier?.rarity ?? 'basic'}`}>
                  <div className="coupon-chip">{rewardTier ? rewardTier.label : 'REWARD'}</div>
                  <div className="coupon-code">{coupon}</div>
                  {rewardTier && (
                    <p className="coupon-rare-copy">{rewardTier.detail}</p>
                  )}
                  <button type="button" className={`copy-btn ${copied ? 'done' : ''}`} onClick={copyCoupon}>
                    {copied ? '복사 완료' : '코드 복사'}
                  </button>
                  <a className="btn secondary coupon-app-btn" href={appPrimaryUrl} target="_blank" rel="noreferrer">
                    바로 사용하기
                  </a>
                  <p className="coupon-guide">
                    <code>마이페이지 &gt; 추천코드 입력</code>에 붙여넣으면 돼요. {rewardTier ? `${rewardTier.count}종 보상 코드입니다.` : ''} 오늘 구성 안에서만 지급되는 일일 코드예요.
                  </p>
                </div>
              </div>
            )}
            {status==='fail' && currentOrder && lastResult && (
              <div>
                <h3>주문 실패</h3>
                <p className="muted">{currentOrder.label} 주문 / {getDonenessLabel(lastResult)} 결과</p>
              </div>
            )}
            {status==='idle' && (
              <div className="muted">손님 대기 중. 첫 주문을 받아보세요.</div>
            )}

            <div className="result-actions">
              <Link href="/whisper" className="result-nav-card result-nav-card-whisper">
                <span className="result-nav-kicker">NEXT GAME</span>
                <strong>귓속말 게임</strong>
                <span>술자리에서 바로 이어서 하기 좋아요</span>
              </Link>
              <Link href="/" className="result-nav-card result-nav-card-home">
                <span className="result-nav-kicker">HOME</span>
                <strong>메인으로</strong>
                <span>다른 이벤트를 한눈에 둘러보기</span>
              </Link>
              <Link href="/talkcards" className="result-nav-card result-nav-card-talk">
                <span className="result-nav-kicker">TALK CARDS</span>
                <strong>썸·커플 대화 주제모음</strong>
                <span>분위기 이어가기 좋은 질문 카드</span>
              </Link>
            </div>
          </div>

        </section>

        {showGuide && (
          <div className="game-guide-overlay" role="dialog" aria-modal="true" aria-labelledby="meat-guide-title">
            <div className="game-guide-modal">
              <div className="game-guide-head">
                <div>
                  <div className="panel-label">Game Guide</div>
                  <h2 id="meat-guide-title">미디움 레어로 부탁합니다</h2>
                </div>
                <button type="button" className="guide-close" aria-label="설명 닫기" onClick={()=> setShowGuide(false)}>
                  닫기
                </button>
              </div>

              <div className="guide-section">
                <strong>플레이 방법</strong>
                <p>`굽기 시작` 후 주문을 확인하고 타이밍 맞춰 `뒤집기`를 누르면 됩니다.</p>
              </div>

              <div className="guide-section">
                <strong>굽기 종류</strong>
                <p>`생고기`부터 `탄고기`까지 변하니 원하는 굽기 구간을 노려보세요.</p>
              </div>

              <div className="guide-section">
                <strong>보는 포인트</strong>
                <p>`현재 상태`, `손님`, `진행도` 세 가지만 보면 충분해요.</p>
              </div>

              <div className="guide-section">
                <strong>성공 보상</strong>
                <p>하루 5번 도전할 수 있고, 매일 오전 10시에 횟수와 코드가 함께 바뀝니다.</p>
              </div>

              <div className="guide-section">
                <strong>쿠폰 규칙</strong>
                <p>첫 성공은 한정 코드 1개, 이후 성공은 최대 4번까지 랜덤 지급입니다. 추가 보상 안에서 5%와 1% 희귀 코드도 나올 수 있어요.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
