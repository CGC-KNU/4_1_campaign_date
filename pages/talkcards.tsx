import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Head from 'next/head'

type TopicCategory = 'icebreak' | 'balance' | 'flirty' | 'deep' | 'whatif'

type PromptCard = {
  kind: 'prompt'
  title: string
  guide: string
}

type BalanceCard = {
  kind: 'balance'
  title: string
  guide: string
  left: string
  right: string
  leftPercent: number
}

type TopicCard = PromptCard | BalanceCard

type TopicGroup = {
  id: TopicCategory
  label: string
  intro: string
  prompts: TopicCard[]
}

type BalanceChoice = 'left' | 'right'
type BalanceStats = Record<string, { left: number; right: number }>

const APP_STORE_URL = 'https://apps.apple.com/kr/app/wouldulike/id6740640251'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.coggiri.new1'

const ICEBREAK_PROMPTS: PromptCard[] = [
  { kind: 'prompt', title: '오늘 하루 중 제일 웃겼던 순간은?', guide: '짧은 이야기로 시작하기 좋아요.' },
  { kind: 'prompt', title: '요새 가장 큰 행복은 뭐야?', guide: '가볍게 시작해도 지금의 마음이 잘 보여요.' },
  { kind: 'prompt', title: '요즘 가장 자주 듣는 노래는?', guide: '취향 얘기로 자연스럽게 이어집니다.' },
  { kind: 'prompt', title: '요즘 제일 먹고 싶었던 음식은?', guide: '지금 자리와도 잘 어울리는 질문이에요.' },
  { kind: 'prompt', title: '요즘 하루 중 제일 좋아하는 순간은 언제야?', guide: '일상 리듬을 편하게 나누기 좋아요.' },
  { kind: 'prompt', title: '내일 하루 쉬면 제일 먼저 하고 싶은 일은?', guide: '가볍게 상상하면서 대화하기 좋아요.' },
  { kind: 'prompt', title: '요즘 자주 보는 유튜브 채널이나 콘텐츠는?', guide: '일상 취향을 알기 좋은 질문입니다.' },
  { kind: 'prompt', title: '최근에 괜히 기분 좋아졌던 순간이 있었어요?', guide: '부담 없이 분위기를 부드럽게 풀어줘요.' },
  { kind: 'prompt', title: '카페 가면 제일 자주 시키는 메뉴는?', guide: '작은 취향 차이로 대화가 길어져요.' },
  { kind: 'prompt', title: '최근에 새로 좋아하게 된 것 하나만 말해줘.', guide: '요즘 관심사를 빠르게 알 수 있어요.' },
  { kind: 'prompt', title: '지금 당장 여행 갈 수 있으면 어디 가고 싶어요?', guide: '가벼운 여행 상상으로 이어가기 좋습니다.' },
  { kind: 'prompt', title: '내 방이나 집에서 제일 좋아하는 공간은?', guide: '생활 습관을 편하게 알 수 있어요.' },
  { kind: 'prompt', title: '스트레스 받을 때 혼자 푸는 방식이 있어요?', guide: '부담 없이 일상 이야기를 꺼낼 수 있어요.' },
  { kind: 'prompt', title: '평소에 사진 많이 찍는 편이에요?', guide: 'SNS나 추억 이야기로 넘어가기 좋습니다.' },
  { kind: 'prompt', title: '요즘 푹 빠진 간식이나 야식이 있어요?', guide: '음식 이야기라 반응이 빠르게 나와요.' },
  { kind: 'prompt', title: '어릴 때 제일 좋아했던 만화나 캐릭터는?', guide: '추억 얘기가 시작되면 금방 편해져요.' },
  { kind: 'prompt', title: '혼자 있을 때 가장 편한 시간대는 언제예요?', guide: '생활 리듬을 은근히 알 수 있어요.' },
  { kind: 'prompt', title: '평소에 연락 스타일은 빠른 편이에요?', guide: '성향을 가볍게 물어보기 좋아요.' },
  { kind: 'prompt', title: '가장 최근에 저장한 사진은 뭐예요?', guide: '요즘 관심사를 바로 알 수 있어요.' },
  { kind: 'prompt', title: '비 오는 날이 좋아요, 맑은 날이 좋아요?', guide: '가볍지만 취향 차이가 잘 드러나요.' },
  { kind: 'prompt', title: '혼자 영화 보는 거 좋아해요?', guide: '문화생활 취향으로 이어가기 좋습니다.' },
  { kind: 'prompt', title: '핸드폰 배경화면은 자주 바꾸는 편이에요?', guide: '사소하지만 은근 재밌는 질문이에요.' },
  { kind: 'prompt', title: '다시 보고 싶은 계절이 하나 있다면?', guide: '감성적인 대화로 넘어가기 좋습니다.' },
  { kind: 'prompt', title: '최근에 가장 잘 산 소비 하나만 꼽는다면?', guide: '생활 얘기로 이어가기 좋아요.' },
  { kind: 'prompt', title: '아침형이에요, 밤형이에요?', guide: '가장 답하기 쉬운 성향 질문 중 하나예요.' },
  { kind: 'prompt', title: '요즘 한 번쯤 다시 해보고 싶은 취미는?', guide: '관심사와 과거 얘기를 함께 꺼낼 수 있어요.' },
  { kind: 'prompt', title: '메신저 이모티콘 자주 쓰는 편이에요?', guide: '연락 습관 이야기로 가볍게 연결돼요.' },
  { kind: 'prompt', title: '나만 아는 소확행 루틴 있어?', guide: '작지만 취향이 드러나는 답이 잘 나와요.' },
  { kind: 'prompt', title: '요즘 제일 많이 듣는 말이랑 제일 듣고 싶은 말은 뭐야?', guide: '가볍게 시작해도 현재 상태가 자연스럽게 보여요.' },
  { kind: 'prompt', title: '갑자기 3일 휴가가 생기면 어떻게 쓸 거예요?', guide: '상상형 질문이라 답하기 편해요.' },
  { kind: 'prompt', title: '자기 전에 꼭 보는 게 있어요?', guide: '하루 마무리 습관 얘기로 이어져요.' },
  { kind: 'prompt', title: '사람들이 나를 처음 보면 어떤 이미지일 것 같아요?', guide: '첫인상 얘기로 연결하기 좋습니다.' },
  { kind: 'prompt', title: '누가 너를 처음 만났을 때 “이 사람 이런 사람이구나”라고 느꼈으면 해?', guide: '부담 없이 자기 이미지를 이야기하기 좋아요.' },
  { kind: 'prompt', title: '요즘 가장 기대하는 일정 하나만 말해준다면?', guide: '현재 감정을 나누기 좋은 질문이에요.' },
]

const BALANCE_PROMPTS: BalanceCard[] = [
  { kind: 'balance', title: '한 달 동안 야식 금지 vs 커피 금지', guide: '가볍게 취향과 생활 습관을 볼 수 있어요.', left: '야식 금지', right: '커피 금지', leftPercent: 61 },
  { kind: 'balance', title: '평생 여행은 국내만 vs 해외만', guide: '여행 취향과 가치관이 보여요.', left: '국내만', right: '해외만', leftPercent: 28 },
  { kind: 'balance', title: '연락은 자주 짧게 vs 길게 가끔', guide: '연락 스타일 이야기를 꺼내기 좋아요.', left: '자주 짧게', right: '길게 가끔', leftPercent: 54 },
  { kind: 'balance', title: '데이트는 계획형 vs 즉흥형', guide: '둘의 리듬을 가볍게 볼 수 있어요.', left: '계획형', right: '즉흥형', leftPercent: 49 },
  { kind: 'balance', title: '평생 회만 먹기 vs 고기만 먹기', guide: '음식 취향은 반응이 빨라요.', left: '회만 먹기', right: '고기만 먹기', leftPercent: 21 },
  { kind: 'balance', title: '하루 종일 비 오는 날 데이트 vs 눈 오는 날 데이트', guide: '분위기 취향이 드러납니다.', left: '비 오는 날', right: '눈 오는 날', leftPercent: 42 },
  { kind: 'balance', title: '바다 보러 가기 vs 산 보러 가기', guide: '여행 취향으로 자연스럽게 이어져요.', left: '바다', right: '산', leftPercent: 67 },
  { kind: 'balance', title: '사진 많이 남기기 vs 눈으로만 오래 보기', guide: '추억 남기는 방식이 보여요.', left: '사진 남기기', right: '눈으로 보기', leftPercent: 58 },
  { kind: 'balance', title: '맛집 웨이팅 1시간 vs 그냥 근처 바로 입장', guide: '음식 앞 성향이 확실히 갈립니다.', left: '웨이팅', right: '바로 입장', leftPercent: 36 },
  { kind: 'balance', title: '영화 먼저 보고 밥 먹기 vs 밥 먼저 먹고 영화 보기', guide: '데이트 루틴 얘기에 좋아요.', left: '영화 먼저', right: '밥 먼저', leftPercent: 41 },
  { kind: 'balance', title: '새벽 감성 드라이브 vs 낮 카페 데이트', guide: '데이트 무드 취향을 알 수 있어요.', left: '새벽 드라이브', right: '낮 카페', leftPercent: 47 },
  { kind: 'balance', title: '평생 양념치킨 vs 후라이드치킨', guide: '무난하지만 항상 재밌는 질문이에요.', left: '양념', right: '후라이드', leftPercent: 52 },
  { kind: 'balance', title: '여름 휴가 바다 vs 겨울 여행 온천', guide: '계절 취향 대화에 좋습니다.', left: '여름 바다', right: '겨울 온천', leftPercent: 39 },
  { kind: 'balance', title: '인생 한 곡만 반복 듣기 vs 한 영화만 반복 보기', guide: '문화 취향을 재밌게 물어볼 수 있어요.', left: '한 곡 반복', right: '한 영화 반복', leftPercent: 57 },
  { kind: 'balance', title: '평생 탄산 금지 vs 초콜릿 금지', guide: '먹는 얘기는 항상 실패가 적어요.', left: '탄산 금지', right: '초콜릿 금지', leftPercent: 33 },
  { kind: 'balance', title: '고백은 직접 듣기 vs 문자로 받기', guide: '연애 감성 차이가 드러납니다.', left: '직접 듣기', right: '문자로 받기', leftPercent: 79 },
  { kind: 'balance', title: '소개팅 첫 만남은 카페 vs 저녁 식사', guide: '첫 만남 스타일을 쉽게 볼 수 있어요.', left: '카페', right: '저녁 식사', leftPercent: 62 },
  { kind: 'balance', title: '일찍 만나 오래 놀기 vs 늦게 만나 진하게 놀기', guide: '에너지 스타일이 보여요.', left: '일찍 오래', right: '늦게 진하게', leftPercent: 56 },
  { kind: 'balance', title: '평생 떡볶이 vs 평생 마라탕', guide: '반응 잘 오는 먹거리 밸런스예요.', left: '떡볶이', right: '마라탕', leftPercent: 44 },
  { kind: 'balance', title: '집 데이트만 가능 vs 밖 데이트만 가능', guide: '데이트 취향을 한 번에 볼 수 있어요.', left: '집 데이트', right: '밖 데이트', leftPercent: 31 },
  { kind: 'balance', title: '연애할 때 서프라이즈 많은 편 vs 안정감 있는 편', guide: '관계 스타일 대화로 이어집니다.', left: '서프라이즈', right: '안정감', leftPercent: 38 },
  { kind: 'balance', title: '평생 메시지로만 연락 vs 평생 전화로만 연락', guide: '연락 방식 취향이 확실하게 갈려요.', left: '메시지', right: '전화', leftPercent: 71 },
  { kind: 'balance', title: '평생 아이스크림 금지 vs 빵 금지', guide: '디저트 취향으로 재밌게 풀 수 있어요.', left: '아이스크림 금지', right: '빵 금지', leftPercent: 45 },
  { kind: 'balance', title: '여행 가서 빡세게 일정 소화 vs 숙소에서 여유롭게', guide: '휴식 방식 이야기에 좋습니다.', left: '일정 소화', right: '여유롭게', leftPercent: 26 },
  { kind: 'balance', title: '커플룩 맞춰 입기 vs 각자 스타일 유지하기', guide: '연애 센스 차이가 드러나요.', left: '커플룩', right: '각자 스타일', leftPercent: 22 },
  { kind: 'balance', title: '평생 노래방 금지 vs 술 금지', guide: '술자리에서 반응이 좋은 질문입니다.', left: '노래방 금지', right: '술 금지', leftPercent: 48 },
  { kind: 'balance', title: '썸에서 확실한 고백이 먼저 vs 행동으로 증명이 먼저', guide: '썸의 진도와 확신 기준이 보여요.', left: '확실한 고백', right: '행동으로 증명', leftPercent: 46 },
  { kind: 'balance', title: '밀당은 양념이다 vs 밀당은 독이다', guide: '관계에서 솔직함과 텐션 기준을 볼 수 있어요.', left: '양념이다', right: '독이다', leftPercent: 27 },
  { kind: 'balance', title: '연락 템포 안 맞으면 끝 vs 맞춰가면 된다', guide: '연락 스타일에 대한 민감도를 가볍게 볼 수 있어요.', left: '안 맞으면 끝', right: '맞춰가면 된다', leftPercent: 34 },
  { kind: 'balance', title: '썸 단계에서 다른 이성 만나는 거 가능 vs 불가', guide: '썸의 경계선을 어디까지 보는지 알 수 있어요.', left: '가능', right: '불가', leftPercent: 24 },
  { kind: 'balance', title: '썸은 서로 책임 없다 vs 썸도 책임 있다', guide: '가벼워 보여도 생각 차이가 크게 나는 질문이에요.', left: '책임 없다', right: '책임 있다', leftPercent: 31 },
  { kind: 'balance', title: '마음 식은 사람은 말하고 끝내야 vs 조용히 멀어져도 된다', guide: '이별 태도와 예의 기준이 드러나요.', left: '말하고 끝내야', right: '조용히 멀어져도 된다', leftPercent: 76 },
  { kind: 'balance', title: '연애 시작 전 과거 연애사 오픈 vs 굳이 공유 안 함', guide: '투명함과 프라이버시 기준을 볼 수 있어요.', left: '오픈', right: '공유 안 함', leftPercent: 43 },
  { kind: 'balance', title: '친구랑 애인 번호 교환 가능 vs 불가능', guide: '경계선이 어디서 시작되는지 가볍게 볼 수 있어요.', left: '가능', right: '불가능', leftPercent: 29 },
  { kind: 'balance', title: '애인과 이성 친구 단둘이 술 가능 vs 불가능', guide: '관계에서 허용 범위가 선명하게 갈려요.', left: '가능', right: '불가능', leftPercent: 18 },
  { kind: 'balance', title: '전 애인과 연락 가능 vs 불가능', guide: '과거 관계와 현재 관계의 거리감을 볼 수 있어요.', left: '가능', right: '불가능', leftPercent: 21 },
  { kind: 'balance', title: '이성 동기나 동료랑 단둘이 밥 괜찮다 vs 선 넘는다', guide: '일상적인 상황에서도 기준 차이가 드러나요.', left: '괜찮다', right: '선 넘는다', leftPercent: 38 },
  { kind: 'balance', title: '애인이 싫어하는 사람이랑 놀 수 있다 vs 없다', guide: '개인 자유와 배려의 균형을 보는 질문이에요.', left: '놀 수 있다', right: '놀 수 없다', leftPercent: 33 },
  { kind: 'balance', title: '애인이 내 친구를 싫어하면 친구를 조정 vs 애인을 설득', guide: '관계 우선순위를 은근히 보여주는 질문이에요.', left: '친구를 조정', right: '애인을 설득', leftPercent: 36 },
  { kind: 'balance', title: '사과는 진심이 중요 vs 재발방지가 중요', guide: '갈등 해결에서 뭘 더 믿는지 보입니다.', left: '진심', right: '재발방지', leftPercent: 41 },
  { kind: 'balance', title: '결혼은 사랑이 먼저 vs 현실이 먼저', guide: '결혼관이 꽤 명확하게 갈리는 질문이에요.', left: '사랑이 먼저', right: '현실이 먼저', leftPercent: 57 },
  { kind: 'balance', title: '결혼 전 동거 찬성 vs 반대', guide: '결혼 전 관계를 바라보는 온도 차이가 보여요.', left: '찬성', right: '반대', leftPercent: 63 },
  { kind: 'balance', title: '결혼하면 개인 시간 우선 vs 가족 시간 우선', guide: '결혼 후 삶의 리듬을 상상해볼 수 있어요.', left: '개인 시간', right: '가족 시간', leftPercent: 28 },
  { kind: 'balance', title: '돈 관리는 합치기 vs 각자와 공동계좌 병행', guide: '현실적인 생활 방식 이야기에 잘 맞아요.', left: '합치기', right: '각자+공동계좌', leftPercent: 35 },
  { kind: 'balance', title: '결혼식은 작게 vs 크게', guide: '결혼 이벤트를 어떤 의미로 보는지 알 수 있어요.', left: '작게', right: '크게', leftPercent: 61 },
  { kind: 'balance', title: '아이는 꼭 vs 선택', guide: '삶의 큰 방향성을 가볍게 꺼내기 좋은 질문입니다.', left: '꼭', right: '선택', leftPercent: 26 },
  { kind: 'balance', title: '부모님과의 거리는 가까울수록 좋다 vs 독립이 답이다', guide: '가족 거리감과 생활 기준이 드러나요.', left: '가까울수록 좋다', right: '독립이 답이다', leftPercent: 32 },
  { kind: 'balance', title: '연애하기 좋은 사람이 더 기분 나쁘다 vs 결혼하기 좋은 사람이 더 기분 나쁘다', guide: '어떤 평가가 더 찔리는지 은근 재밌게 볼 수 있어요.', left: '연애하기 좋은 사람', right: '결혼하기 좋은 사람', leftPercent: 47 },
  { kind: 'balance', title: '착한데 매력 없어 vs 매력 있는데 불안해', guide: '연애에서 안정과 끌림의 기준이 보입니다.', left: '착한데 매력 없어', right: '매력 있는데 불안해', leftPercent: 52 },
  { kind: 'balance', title: '너는 좋은 사람인데 vs 너는 내 스타일이 아니야', guide: '둘 중 덜 아픈 거절이 뭔지 의견이 갈려요.', left: '좋은 사람인데', right: '내 스타일이 아니야', leftPercent: 44 },
  { kind: 'balance', title: '재밌는데 가벼워 보여 vs 진중한데 재미가 없어', guide: '관계에서 포기 못 하는 축이 드러나요.', left: '재밌는데 가벼워 보여', right: '진중한데 재미가 없어', leftPercent: 49 },
  { kind: 'balance', title: '너랑 있으면 편해 vs 너랑 있으면 설레', guide: '둘 중 하나만 들을 수 있다면 어떤 말이 더 남는지 보는 질문이에요.', left: '편해', right: '설레', leftPercent: 46 },
  { kind: 'balance', title: '하루 종일 함께 있기 vs 하루 한 번만 연락하기', guide: '거리감 취향을 가볍게 볼 수 있어요.', left: '계속 함께', right: '하루 한 번 연락', leftPercent: 37 },
  { kind: 'balance', title: '평생 사진 찍히기만 vs 찍어주기만', guide: '데이트 순간을 남기는 방식이 보입니다.', left: '찍히기만', right: '찍어주기만', leftPercent: 53 },
  { kind: 'balance', title: '첫 데이트에 비밀 하나 말하기 vs 끝까지 숨기기', guide: '심리전 느낌으로 재미있어요.', left: '하나 말하기', right: '끝까지 숨기기', leftPercent: 64 },
  { kind: 'balance', title: '기억을 지우기 vs 기억을 더 선명하게 하기', guide: '과거를 다루는 방식이 의외로 잘 드러나요.', left: '기억을 지우기', right: '더 선명하게 하기', leftPercent: 39 },
  { kind: 'balance', title: '완벽한 하루를 1년에 10번 vs 평범하지만 좋은 하루를 매일', guide: '행복의 밀도와 안정감 중 어디에 더 끌리는지 볼 수 있어요.', left: '완벽한 하루 10번', right: '좋은 하루를 매일', leftPercent: 24 },
]

const FLIRTY_PROMPTS: PromptCard[] = [
  { kind: 'prompt', title: '첫인상과 지금 인상, 제일 달라진 점은?', guide: '부담 없이 호감 표현을 꺼내기 좋아요.' },
  { kind: 'prompt', title: '상대가 센스 있다고 느끼는 순간은 언제예요?', guide: '칭찬하기 좋은 질문입니다.' },
  { kind: 'prompt', title: '데이트할 때 은근 중요하게 보는 포인트는?', guide: '연애 스타일을 자연스럽게 물어볼 수 있어요.' },
  { kind: 'prompt', title: '같이 있으면 편한 사람의 기준은 뭐예요?', guide: '관계의 온도를 부드럽게 올릴 수 있어요.' },
  { kind: 'prompt', title: '호감 가는 사람과 대화할 때 달라지는 습관이 있어요?', guide: '귀엽게 분위기를 만들기 좋아요.' },
  { kind: 'prompt', title: '설레는 연락은 어떤 느낌이에요?', guide: '연락 스타일과 감정선을 알 수 있어요.' },
  { kind: 'prompt', title: '누군가에게 반하게 되는 포인트는?', guide: '취향을 돌려서 물어보기 좋아요.' },
  { kind: 'prompt', title: '좋아하는 사람이 생기면 티가 나는 편이에요?', guide: '부끄럽지만 반응이 좋은 질문이에요.' },
  { kind: 'prompt', title: '데이트에서 은근 기억에 남는 배려는 뭐예요?', guide: '칭찬과 이상형 얘기로 연결돼요.' },
  { kind: 'prompt', title: '이상형보다 더 중요한 게 있다면 뭐예요?', guide: '겉보다 관계를 보는 기준이 드러나요.' },
  { kind: 'prompt', title: '호감 있는 사람 앞에서 더 말이 많아져요, 조용해져요?', guide: '답하기 편하고 반응도 좋아요.' },
  { kind: 'prompt', title: '어떤 칭찬을 들으면 오래 기억에 남아요?', guide: '은근히 서로 칭찬하기 좋습니다.' },
  { kind: 'prompt', title: '누군가랑 친해질 때 가장 중요한 건 타이밍이에요, 대화예요?', guide: '관계 시작 방식을 알 수 있어요.' },
  { kind: 'prompt', title: '친해졌다고 느끼는 순간은 보통 언제야?', guide: '관계의 속도와 온도를 자연스럽게 들을 수 있어요.' },
  { kind: 'prompt', title: '썸 탈 때 제일 설레는 순간은?', guide: '데이트 컨셉에 잘 맞는 질문이에요.' },
  { kind: 'prompt', title: '호감 가는 사람한테 먼저 다가가는 편이에요?', guide: '연애 온도 차이를 가볍게 볼 수 있어요.' },
  { kind: 'prompt', title: '내가 누군가를 좋아한다는 걸 스스로 확신하는 순간은 언제야?', guide: '호감이 사랑으로 넘어가는 지점을 이야기하기 좋아요.' },
  { kind: 'prompt', title: '좋아하는 사람이랑 꼭 해보고 싶은 데이트가 있어요?', guide: '자연스럽게 데이트 취향으로 넘어갑니다.' },
  { kind: 'prompt', title: '상대가 나를 편하게 만들어준다고 느끼는 순간은?', guide: '관계에서 중요한 포인트가 드러납니다.' },
  { kind: 'prompt', title: '이 사람 괜찮다 싶을 때 제일 먼저 보는 건?', guide: '첫눈에 보는 기준을 살짝 알 수 있어요.' },
  { kind: 'prompt', title: '연애할 때 말투가 중요한 편이에요?', guide: '작은 취향 차이를 재미있게 볼 수 있어요.' },
  { kind: 'prompt', title: '누군가에게 심쿵했던 한마디가 있었어요?', guide: '가볍게 로맨틱한 분위기를 만들기 좋아요.' },
  { kind: 'prompt', title: '좋아하는 사람과 대화가 잘 통한다고 느끼는 순간은?', guide: '서로의 기준을 비교하기 좋습니다.' },
  { kind: 'prompt', title: '호감이 생기면 먼저 자주 보고 싶어져요, 더 알고 싶어져요?', guide: '감정의 방향이 보여요.' },
  { kind: 'prompt', title: '데이트에서 가장 기억에 남는 작은 순간은 뭐예요?', guide: '감성적인 이야기로 넘어가요.' },
  { kind: 'prompt', title: '연애 초반에 있으면 좋은 건 설렘, 안정감 중 뭐예요?', guide: '관계의 리듬을 알 수 있어요.' },
  { kind: 'prompt', title: '사람을 좋아하게 되는 속도는 빠른 편이에요?', guide: '자신의 스타일을 말하기 쉬운 질문입니다.' },
  { kind: 'prompt', title: '한 사람에게 오래 끌리는 이유는 뭐라고 생각해요?', guide: '가치관도 같이 보여요.' },
  { kind: 'prompt', title: '관심 있는 사람과는 대화를 오래 하고 싶어요, 자주 하고 싶어요?', guide: '연락 취향을 귀엽게 물어볼 수 있어요.' },
  { kind: 'prompt', title: '상대가 날 특별하게 챙겨준다고 느끼는 순간은?', guide: '배려 포인트를 자연스럽게 알 수 있어요.' },
  { kind: 'prompt', title: '누군가를 좋아하게 되면 티를 숨길 수 있어요?', guide: '재미와 부끄러움이 같이 있는 질문입니다.' },
  { kind: 'prompt', title: '썸에서 연애로 넘어가는 결정적 순간은 뭐라고 생각해요?', guide: '연애관을 부드럽게 이야기할 수 있어요.' },
]

const DEEP_PROMPTS: PromptCard[] = [
  { kind: 'prompt', title: '요즘 가장 신경 쓰는 고민 하나만 말해준다면?', guide: '공감이 필요한 타이밍에 좋아요.' },
  { kind: 'prompt', title: '지금의 나를 만들었다고 느끼는 습관은?', guide: '가치관을 깊게 들여다볼 수 있어요.' },
  { kind: 'prompt', title: '최근에 나 좀 괜찮다 싶었던 순간 있어?', guide: '자존감과 요즘 상태를 부드럽게 들을 수 있어요.' },
  { kind: 'prompt', title: '사람에게 오래 남는 말이나 태도는 뭐라고 생각해요?', guide: '관계관을 알 수 있는 질문입니다.' },
  { kind: 'prompt', title: '앞으로 꼭 해보고 싶은 작은 목표가 있어요?', guide: '가볍지만 진심이 보이는 주제예요.' },
  { kind: 'prompt', title: '요즘 내 마음을 가장 많이 차지하는 생각은 뭐예요?', guide: '대화가 무르익었을 때 꺼내기 좋아요.' },
  { kind: 'prompt', title: '사람을 오래 좋아하게 되는 이유는 뭐라고 생각해요?', guide: '연애관과 관계관이 함께 보여요.' },
  { kind: 'prompt', title: '지금까지 살면서 가장 많이 배운 시기는 언제였어요?', guide: '과거 경험을 자연스럽게 들을 수 있어요.' },
  { kind: 'prompt', title: '나를 지치게 하는 사람보다 더 힘든 건 뭐예요?', guide: '스트레스 방식이 보여요.' },
  { kind: 'prompt', title: '혼자 있는 시간이 꼭 필요한 편이에요?', guide: '거리감과 에너지 회복 방식을 알 수 있어요.' },
  { kind: 'prompt', title: '누군가에게 진짜 고마움을 느꼈던 순간은?', guide: '따뜻한 분위기로 이어지기 좋아요.' },
  { kind: 'prompt', title: '지금의 나에게 가장 필요한 건 휴식, 동기부여, 안정 중 뭐예요?', guide: '상태를 조심스럽게 물어볼 수 있어요.' },
  { kind: 'prompt', title: '어릴 때 상상했던 어른의 모습과 지금이 비슷해요?', guide: '생각보다 진솔한 이야기가 잘 나와요.' },
  { kind: 'prompt', title: '관계에서 지키고 싶은 기준이 하나 있다면?', guide: '연애관과 우정관이 자연스럽게 드러나요.' },
  { kind: 'prompt', title: '인간관계에서 절대 못 참는 것 하나와 꼭 필요한 것 하나를 꼽는다면?', guide: '관계 기준이 아주 선명하게 드러나는 질문이에요.' },
  { kind: 'prompt', title: '사람을 믿게 되는 순간은 언제예요?', guide: '깊은 대화로 이어질 수 있어요.' },
  { kind: 'prompt', title: '너는 사람이 변한다 쪽이야, 결국 원래대로 돌아온다 쪽이야?', guide: '사람을 보는 시선이 잘 드러나요.' },
  { kind: 'prompt', title: '지금 돌아보면 꼭 해두길 잘한 선택이 있어요?', guide: '삶의 방향성을 엿볼 수 있어요.' },
  { kind: 'prompt', title: '인생에서 돌이켜보면 잘한 선택 하나만 꼽는다면?', guide: '중요한 선택의 기준을 듣기 좋아요.' },
  { kind: 'prompt', title: '반대로 그때로 돌아가면 다르게 할 것 하나가 있다면?', guide: '후회보다 배운 점을 자연스럽게 끌어낼 수 있어요.' },
  { kind: 'prompt', title: '힘들 때 가장 듣고 싶은 말은 뭐예요?', guide: '위로 방식이 보입니다.' },
  { kind: 'prompt', title: '시간이 지나도 안 바뀌었으면 하는 내 모습은?', guide: '자기다움에 대한 얘기를 꺼내기 좋아요.' },
  { kind: 'prompt', title: '요즘 나를 가장 기쁘게 하는 사람이나 순간은?', guide: '현재의 행복 포인트를 들을 수 있어요.' },
  { kind: 'prompt', title: '요즘 가장 배우고 있는 건 뭐야? 일이든 사람이든 나 자신이든.', guide: '지금 성장하고 있는 방향을 알 수 있어요.' },
  { kind: 'prompt', title: '실패했다고 느꼈는데 결국 도움이 된 경험이 있었어요?', guide: '성장 이야기를 나누기 좋습니다.' },
  { kind: 'prompt', title: '가까운 사람과 오래 잘 지내려면 뭐가 가장 중요할까요?', guide: '관계 가치관을 자연스럽게 나눌 수 있어요.' },
  { kind: 'prompt', title: '내가 가장 나답다고 느끼는 순간은 언제예요?', guide: '자기 이해에 대한 얘기가 나옵니다.' },
  { kind: 'prompt', title: '누군가의 사소한 말이 오래 남았던 적이 있어요?', guide: '정서적인 대화에 잘 어울립니다.' },
  { kind: 'prompt', title: '앞으로 더 잘해보고 싶은 관계가 있어요?', guide: '현재 고민과 희망을 같이 들을 수 있어요.' },
  { kind: 'prompt', title: '살면서 우선순위가 바뀌었다고 느낀 순간은?', guide: '깊지만 부담스럽지 않게 이야기할 수 있어요.' },
  { kind: 'prompt', title: '나를 편하게 만드는 사람의 공통점이 있나요?', guide: '인간관계 취향을 알기 좋아요.' },
  { kind: 'prompt', title: '기억에 남는 칭찬보다 더 오래 남는 건 뭐예요?', guide: '감정선이 은근히 드러납니다.' },
  { kind: 'prompt', title: '너한테 성공은 어떤 모양이야?', guide: '추상적인 답도 좋아서 더 진짜 생각이 나와요.' },
  { kind: 'prompt', title: '인생에서 꼭 지키고 싶은 원칙 하나만 말해줘.', guide: '짧아도 가장 진한 가치관이 보여요.' },
  { kind: 'prompt', title: '요즘 너를 움직이게 하는 건 욕심이야, 애정이야?', guide: '지금 삶의 동력을 자연스럽게 물어볼 수 있어요.' },
  { kind: 'prompt', title: '앞으로 꼭 지키고 싶은 삶의 리듬이 있어요?', guide: '현재의 삶을 어떻게 보고 있는지 알 수 있어요.' },
  { kind: 'prompt', title: '누군가를 더 이해하게 된 경험이 있었어요?', guide: '상대방의 공감 능력을 볼 수 있어요.' },
  { kind: 'prompt', title: '요즘 불안의 정체를 한 문장으로 말하면 뭐야?', guide: '대화가 충분히 무르익었을 때 조심스럽게 꺼내기 좋아요.' },
  { kind: 'prompt', title: '지금의 나에게 한 문장 조언을 한다면 뭐라고 할래요?', guide: '짧지만 인상적인 대화가 됩니다.' },
  { kind: 'prompt', title: '앞으로 어떤 사람으로 기억되고 싶어요?', guide: '가볍게 시작해도 깊게 이어지는 질문입니다.' },
]

const WHATIF_PROMPTS: PromptCard[] = [
  { kind: 'prompt', title: '만약에 내일 당장 한 달간 해외여행을 떠난다면 제일 먼저 어디로 갈래요?', guide: '상상형 질문이라 가볍게 시작하기 좋아요.' },
  { kind: 'prompt', title: '만약에 첫사랑이 다시 연락온다면 어떻게 할 것 같아요?', guide: '썸과 연애 얘기로 자연스럽게 연결됩니다.' },
  { kind: 'prompt', title: '만약에 오늘 밤 바로 무대에 올라 노래해야 한다면 어떤 곡을 고를래요?', guide: '재미있고 답하기 쉬운 상상형입니다.' },
  { kind: 'prompt', title: '만약에 일주일 동안 휴대폰 없이 살아야 한다면 제일 힘든 건 뭐예요?', guide: '생활 습관이 잘 보이는 질문이에요.' },
  { kind: 'prompt', title: '만약에 로또 1등에 당첨되면 가장 먼저 할 일은?', guide: '현실적인 성향 차이를 볼 수 있어요.' },
  { kind: 'prompt', title: '만약에 하루 동안 다른 사람으로 살아볼 수 있다면 누구로 살고 싶어요?', guide: '호기심과 취향이 함께 드러나요.' },
  { kind: 'prompt', title: '만약에 평생 한 도시에서만 살아야 한다면 어디를 고를래요?', guide: '여행 취향과 생활 취향이 같이 보여요.' },
  { kind: 'prompt', title: '만약에 지금 떠오르는 사람에게 한마디만 보낼 수 있다면 뭐라고 보낼래요?', guide: '감정선이 살짝 보이는 질문입니다.' },
  { kind: 'prompt', title: '만약에 다시 스무 살로 돌아간다면 꼭 해보고 싶은 건?', guide: '과거와 현재를 비교하기 좋아요.' },
  { kind: 'prompt', title: '만약에 주말 내내 집 밖에 못 나간다면 어떻게 보낼래요?', guide: '혼자 보내는 방식이 잘 보입니다.' },
  { kind: 'prompt', title: '만약에 지금 한 가지 능력이 생긴다면 뭘 갖고 싶어요?', guide: '가볍지만 상상력이 필요한 질문입니다.' },
  { kind: 'prompt', title: '만약에 오늘 하루를 영화 장면처럼 남길 수 있다면 어느 순간을 고를래요?', guide: '감성적인 이야기로 이어집니다.' },
  { kind: 'prompt', title: '만약에 평생 한 계절만 살 수 있다면 어떤 계절을 고를래요?', guide: '선호와 감성 차이가 보이는 질문이에요.' },
  { kind: 'prompt', title: '만약에 지금 바로 이사해야 한다면 도시가 좋을까요, 조용한 동네가 좋을까요?', guide: '생활 방식 취향을 보기 좋아요.' },
  { kind: 'prompt', title: '만약에 가장 친한 친구가 나를 소개팅해준다면 어떤 사람일 것 같아요?', guide: '자기 이미지와 이상형이 함께 보여요.' },
  { kind: 'prompt', title: '만약에 하루 동안만 투명인간이 된다면 뭘 하고 싶어요?', guide: '술자리에서 반응이 좋은 질문입니다.' },
  { kind: 'prompt', title: '만약에 평생 한 음식만 공짜로 먹을 수 있다면 뭘 고를래요?', guide: '가볍고 바로 답하기 좋아요.' },
  { kind: 'prompt', title: '만약에 오늘 밤 갑자기 드라이브를 떠난다면 누구랑 어디 갈래요?', guide: '데이트 무드와도 잘 맞습니다.' },
  { kind: 'prompt', title: '만약에 지금 하고 있는 일을 잠시 쉬고 새롭게 시작할 수 있다면 뭘 해보고 싶어요?', guide: '꿈과 관심사를 들을 수 있어요.' },
  { kind: 'prompt', title: '돈이 충분하면 절대 안 할 일 하나와 꼭 하고 싶은 일 하나는 뭐야?', guide: '가치관과 진짜 욕망이 같이 보이는 질문이에요.' },
  { kind: 'prompt', title: '지금 당장 2주 휴가가 생기면 진짜 뭐 할래?', guide: '머릿속 우선순위를 바로 들을 수 있어요.' },
  { kind: 'prompt', title: '만약에 연애를 한 문장으로 정의해야 한다면 뭐라고 할래요?', guide: '가볍게 시작해도 인상적인 답이 나와요.' },
  { kind: 'prompt', title: '만약에 기억 하나를 다시 꺼내서 하루만 살아볼 수 있다면 어떤 날을 고를래요?', guide: '추억 이야기를 끌어내기 좋아요.' },
  { kind: 'prompt', title: '만약에 갑자기 유명해진다면 제일 부담스러운 건 뭐예요?', guide: '성향과 사생활 기준이 드러납니다.' },
  { kind: 'prompt', title: '만약에 이번 주말에 깜짝 여행이 잡힌다면 바다, 도시, 산 중 어디가 좋아요?', guide: '데이트 여행 취향으로 이어져요.' },
  { kind: 'prompt', title: '만약에 평생 한 가지 취미만 할 수 있다면 뭘 선택할래요?', guide: '꾸준함과 관심사를 같이 볼 수 있어요.' },
  { kind: 'prompt', title: '만약에 하루 동안 나 대신 누군가 내 일정을 살아준다면 어떤 부분이 제일 놀랄까요?', guide: '일상 리듬을 재미있게 설명할 수 있어요.' },
  { kind: 'prompt', title: '만약에 좋아하는 사람과 영화 한 편만 볼 수 있다면 어떤 장르를 고를래요?', guide: '데이트 취향과 감성이 보입니다.' },
  { kind: 'prompt', title: '만약에 한 달 동안 SNS를 끊어야 한다면 가장 아쉬운 건 뭐예요?', guide: '생활 습관과 성향을 보기 좋아요.' },
  { kind: 'prompt', title: '만약에 친구들이 나를 한 단어로 소개한다면 뭐라고 할 것 같아요?', guide: '자기 이미지 이야기에 적합합니다.' },
  { kind: 'prompt', title: '만약에 올해 안에 꼭 하나 이루어진다면 좋겠는 소원은?', guide: '현재 바람을 편하게 나눌 수 있어요.' },
  { kind: 'prompt', title: '만약에 지금 이 자리에서 비밀 하나를 말해야 한다면 어떤 종류일 것 같아요?', guide: '술자리 감성에 잘 맞는 질문이에요.' },
]

const TOPIC_GROUPS: TopicGroup[] = [
  { id: 'icebreak', label: '분위기 풀기', intro: '어색함 없이 바로 꺼낼 수 있는 가벼운 주제', prompts: ICEBREAK_PROMPTS },
  { id: 'balance', label: '밸런스 게임', intro: '선택하고 바로 비율을 확인하는 실시간 느낌의 질문', prompts: BALANCE_PROMPTS },
  { id: 'flirty', label: '썸·호감 질문', intro: '조금 더 가까워지고 싶을 때 쓰기 좋은 질문', prompts: FLIRTY_PROMPTS },
  { id: 'deep', label: '조금 더 진지하게', intro: '대화가 무르익었을 때 꺼내기 좋은 질문', prompts: DEEP_PROMPTS },
  { id: 'whatif', label: '만약에', intro: '상상하면서 답하다 보면 의외의 취향이 보이는 질문', prompts: WHATIF_PROMPTS },
]

function getGroup(category: TopicCategory){
  return TOPIC_GROUPS.find((group)=> group.id === category) ?? TOPIC_GROUPS[0]
}

function getInitialBalanceStats(): BalanceStats{
  return Object.fromEntries(
    BALANCE_PROMPTS.map((prompt)=> [
      prompt.title,
      { left: prompt.leftPercent, right: 100 - prompt.leftPercent },
    ])
  )
}

export default function Coupons(){
  const [appPrimaryUrl, setAppPrimaryUrl] = useState(PLAY_STORE_URL)
  const [selectedCategory, setSelectedCategory] = useState<TopicCategory>('icebreak')
  const [cardIndex, setCardIndex] = useState(0)
  const [selectedBalance, setSelectedBalance] = useState<Record<string, BalanceChoice>>({})
  const [balanceStats, setBalanceStats] = useState<BalanceStats>(getInitialBalanceStats)
  const touchStartX = useRef<number | null>(null)
  const dragStartX = useRef<number | null>(null)
  const dragDeltaX = useRef(0)

  const currentGroup = useMemo(()=> getGroup(selectedCategory), [selectedCategory])
  const currentPrompt = currentGroup.prompts[cardIndex]

  useEffect(()=>{
    document.body.classList.add('date-page-body')
    return ()=>{
      document.body.classList.remove('date-page-body')
    }
  }, [])

  useEffect(()=>{
    if(typeof navigator === 'undefined') return
    if(/iPhone|iPad|iPod/i.test(navigator.userAgent)){
      setAppPrimaryUrl(APP_STORE_URL)
      return
    }
    setAppPrimaryUrl(PLAY_STORE_URL)
  }, [])

  useEffect(()=>{
    if(typeof window === 'undefined') return

    const savedChoice = window.localStorage.getItem('coupons-balance-choice')
    const savedStats = window.localStorage.getItem('coupons-balance-stats')

    if(savedChoice){
      try{
        setSelectedBalance(JSON.parse(savedChoice))
      } catch {}
    }

    if(savedStats){
      try{
        const parsed = JSON.parse(savedStats) as BalanceStats
        setBalanceStats((prev)=> ({ ...prev, ...parsed }))
      } catch {}
    }
  }, [])

  useEffect(()=>{
    if(typeof window === 'undefined') return
    window.localStorage.setItem('coupons-balance-choice', JSON.stringify(selectedBalance))
  }, [selectedBalance])

  useEffect(()=>{
    if(typeof window === 'undefined') return
    window.localStorage.setItem('coupons-balance-stats', JSON.stringify(balanceStats))
  }, [balanceStats])

  function moveCard(direction: 'prev' | 'next'){
    setCardIndex((prev)=>{
      const total = currentGroup.prompts.length
      if(direction === 'prev') return (prev - 1 + total) % total
      return (prev + 1) % total
    })
  }

  function pickCategory(category: TopicCategory){
    setSelectedCategory(category)
    setCardIndex(0)
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>){
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>){
    if(touchStartX.current === null) return
    const diff = event.changedTouches[0].clientX - touchStartX.current
    if(Math.abs(diff) > 48){
      moveCard(diff > 0 ? 'prev' : 'next')
    }
    touchStartX.current = null
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>){
    dragStartX.current = event.clientX
    dragDeltaX.current = 0
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>){
    if(dragStartX.current === null) return
    dragDeltaX.current = event.clientX - dragStartX.current
  }

  function handlePointerUp(){
    if(dragStartX.current === null) return
    if(Math.abs(dragDeltaX.current) > 48){
      moveCard(dragDeltaX.current > 0 ? 'prev' : 'next')
    }
    dragStartX.current = null
    dragDeltaX.current = 0
  }

  function selectBalance(title: string, choice: BalanceChoice){
    setSelectedBalance((prev)=>{
      const previousChoice = prev[title]
      if(previousChoice === choice) return prev

      setBalanceStats((current)=>{
        const existing = current[title] ?? { left: 50, right: 50 }
        const nextStats = { ...existing }

        if(previousChoice){
          nextStats[previousChoice] = Math.max(0, nextStats[previousChoice] - 1)
        }
        nextStats[choice] += 1

        return {
          ...current,
          [title]: nextStats,
        }
      })

      return { ...prev, [title]: choice }
    })
  }

  const balanceChoice = currentPrompt.kind === 'balance' ? selectedBalance[currentPrompt.title] : undefined
  const balanceSnapshot = currentPrompt.kind === 'balance'
    ? balanceStats[currentPrompt.title] ?? { left: currentPrompt.leftPercent, right: 100 - currentPrompt.leftPercent }
    : { left: 0, right: 0 }
  const balanceTotal = balanceSnapshot.left + balanceSnapshot.right
  const balanceLeft = balanceTotal > 0 ? Math.round((balanceSnapshot.left / balanceTotal) * 100) : 0
  const balanceRight = balanceTotal > 0 ? 100 - balanceLeft : 0
  const leadingChoice = balanceSnapshot.left === balanceSnapshot.right
    ? '팽팽해요'
    : balanceSnapshot.left > balanceSnapshot.right
      ? `${currentPrompt.kind === 'balance' ? currentPrompt.left : ''} 우세`
      : `${currentPrompt.kind === 'balance' ? currentPrompt.right : ''} 우세`

  return (
    <div className="container conversation-page date-theme">
      <Head>
        <title>썸·커플 대화 주제</title>
      </Head>

      <div className="heart-bg heart-a" />
      <div className="heart-bg heart-b" />
      <div className="heart-bg heart-c" />
      <div className="heart-bg heart-d" />

      <section className="card mobile-shell conversation-hero conversation-hero-pink">
        <div className="hero-topline">
          <div className="campaign-label">우주라이크 데이트 캠페인</div>
          <div className="eyebrow">Talk Cards</div>
        </div>

        <h1>썸·커플 대화 주제</h1>
        <p className="hero-copy">식사 전이나 술자리, 데이트 중에
가볍게 꺼내기 좋은 질문만 모았어요.
카드를 넘기며 지금 분위기에 맞는 주제를 골라보세요.</p>
      </section>

      <section className="card mobile-shell conversation-card conversation-card-pink">
        <div className="conversation-chip-row">
          {TOPIC_GROUPS.map((group)=> (
            <button
              key={group.id}
              type="button"
              className={`conversation-chip ${selectedCategory === group.id ? 'active' : ''}`}
              onClick={()=> pickCategory(group.id)}
            >
              {group.label}
            </button>
          ))}
        </div>

        <div className="conversation-intro">
          <div className="panel-label">현재 카테고리</div>
          <strong>{currentGroup.label}</strong>
          <p className="muted">{currentGroup.intro}</p>
          <div className="conversation-intro-meta">
            <span className="conversation-count">{cardIndex + 1} / {currentGroup.prompts.length}</span>
            <span className="swipe-hint">좌우로 밀어서 다음 카드 보기</span>
          </div>
        </div>

        <div
          className="topic-slider"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div className={`topic-card ${currentPrompt.kind === 'balance' ? 'balance-mode' : ''}`} key={`${selectedCategory}-${cardIndex}`}>
            <div className="topic-label">TOPIC CARD</div>
            <h2>{currentPrompt.title}</h2>
            <p className="muted">{currentPrompt.guide}</p>

            {currentPrompt.kind === 'balance' && (
              <div className="balance-panel">
                <div className="balance-live">
                  <span className="balance-live-badge">LIVE</span>
                  <strong>실시간 선택 현황</strong>
                  <span>{leadingChoice}</span>
                </div>

                <div className="balance-options">
                  <button
                    type="button"
                    className={`balance-option ${balanceChoice === 'left' ? 'selected' : ''}`}
                    onClick={()=> selectBalance(currentPrompt.title, 'left')}
                  >
                    {currentPrompt.left}
                  </button>
                  <button
                    type="button"
                    className={`balance-option ${balanceChoice === 'right' ? 'selected' : ''}`}
                    onClick={()=> selectBalance(currentPrompt.title, 'right')}
                  >
                    {currentPrompt.right}
                  </button>
                </div>

                <div className="balance-result">
                  <div className="balance-bar">
                    <span className="left-bar" style={{width: `${balanceLeft}%`}} />
                    <span className="right-bar" style={{width: `${balanceRight}%`}} />
                  </div>
                  <div className="balance-stats">
                    <strong>{currentPrompt.left} {balanceLeft}%</strong>
                    <strong>{currentPrompt.right} {balanceRight}%</strong>
                  </div>
                  <div className="balance-votes">
                    <span>{currentPrompt.left} {balanceSnapshot.left}표</span>
                    <span>{currentPrompt.right} {balanceSnapshot.right}표</span>
                  </div>
                  <p className="muted balance-caption">이 브라우저에서 누적 선택 수를 기억해서 바로 반영합니다.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="conversation-actions">
          <button type="button" className="btn" onClick={()=> moveCard('next')}>다음 카드 보기</button>
          <Link href="/" className="btn ghost">메인으로</Link>
        </div>

        <div className="app-download-panel app-download-panel-pink conversation-download-panel">
          <div>
            <strong>데이트 장소는 우주라이크에서 찾아보세요</strong>
            <p className="attempt-caption">
              근처 대학가 식당 혜택과 데이트 때 쓰기 좋은 장소를 우주라이크 앱에서 더 편하게 둘러볼 수 있어요.
            </p>
          </div>
          <a className="btn secondary conversation-download-btn" href={appPrimaryUrl} target="_blank" rel="noreferrer">
            우주라이크 앱에서 장소 보기
          </a>
        </div>
      </section>
    </div>
  )
}
