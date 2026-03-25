# CGC Campaign Microsites

간단한 Next.js + TypeScript 프론트엔드 프로토타입입니다. 앱의 배너에서 외부 웹으로 연결되는 캠페인용 마이크로사이트들을 모아둔 레포입니다.

구성
- 메인: `pages/index.tsx` — 세 가지 체험(고기 굽기 / 음식 MBTI / 커플 대화 주제)
- 구현 완료: `pages/meat.tsx` (고기 굽기 — 프론트엔드 타이밍 게임)
- 체험 페이지: `pages/whisper.tsx`, `pages/talkcards.tsx`

로컬 실행
1. 프로젝트 루트로 이동

```bash
cd /Users/minyeol/Desktop/CGC/우주라이크_캠페인_기능_개발/4_1_campaign_date
```

2. 의존성 설치 및 개발 서버 실행

```bash
npm install
cp .env.local.example .env.local
# .env.local 에 NEXT_PUBLIC_KAKAO_JS_KEY 입력
npm run dev
```

카카오 SDK 설정
- 카카오 디벨로퍼스에서 JavaScript 키를 발급받아 `.env.local`의 `NEXT_PUBLIC_KAKAO_JS_KEY`에 넣으면 됩니다.
- 운영 도메인은 `https://blank-idelle-coggiri-1527fb3e.koyeb.app` 입니다.
- 앱 도메인에는 운영 도메인 `https://blank-idelle-coggiri-1527fb3e.koyeb.app`와 로컬 테스트용 `http://localhost:3000`, `http://localhost:3001`, 모바일 테스트용 `http://192.168.0.5:3001`을 함께 등록해두는 편이 안전합니다.
- 설정 후 개발 서버를 다시 실행하면 `미디움 레어로 부탁합니다`의 공유 버튼이 카카오 SDK 공유를 우선 사용합니다.

빌드

```bash
npm run build
npm start
```

권장 환경
- Node.js 18+ (로컬에서 Node 버전 관리 도구 사용 권장)

Koyeb 배포 가이드 (간단)
1. GitHub와 연동된 Koyeb 계정으로 로그인합니다.
2. Koyeb에서 "Create App" → "From Git Repository" 선택 후 이 레포를 연결합니다.
3. Build settings:
	 - Build command: `npm install && npm run build`
	 - Start command: `npm start`
	 - Port: `3000` (Koyeb에 `PORT` 환경변수로 전달되므로 기본값 사용 가능)
4. 런타임: Node.js 18 이상 선택
5. 배포 후 제공되는 URL을 앱 배너에 연결합니다.

팁: Koyeb가 Next.js를 정적으로 export하지 않고 서버 모드로 실행하려면 `npm start` (next start)로 실행하면 됩니다. 만약 정적 사이트로 내보내고 싶다면 `next export` 사용 및 `out` 디렉터리 호스팅 방식으로 변경하세요.

쿠폰/백엔드 통합 (추후)
- 현재는 프론트엔드에서 쿠폰 코드를 생성하여 화면에 보여줍니다. 실제 사용을 위해선 다음 기능이 필요합니다:
	1) 쿠폰 발급 API: 서버(또는 서버리스)에서 고유 코드를 발급 및 저장
	2) 쿠폰 검증 API: 스토어 측에서 쿠폰 유효성 확인
	3) 발급/사용 로그 저장 (분석용)

다음 추천 작업
- `README.md` 보완(브랜치 전략, 작업 규칙)
- Koyeb에 실제 배포 시 환경변수 설정 및 빌드 로그 확인
