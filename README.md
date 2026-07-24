# K-TEXT — 안드로이드는 쇼핑백을 든다

K-TEXT의 첫 번째 오리지널 작품을 소설과 세로형 웹툰으로 함께 읽는 공개 베타 서비스입니다.

- 한국어 소설 1~10화
- 웹툰 파일럿 1화
- 회차 이동과 이어 읽기
- 글자 크기와 야간 모드
- 모바일·태블릿·데스크톱 반응형 화면
- 이용약관과 개인정보 안내

## 공개 서비스

- GitHub Pages: <https://ocusun.github.io/androidshoppingbag/>
- K-TEXT 공개 베타: <https://k-text-global.ocusun.chatgpt.site>

## 로컬 실행

Node.js 22 이상이 필요합니다.

```bash
npm install
npm run dev
```

배포용 정적 파일은 다음 명령으로 `dist/`에 생성됩니다.

```bash
npm run build
```

`npm run build`는 `dist/`를 만든 뒤 현재 저장소의 Pages 설정과 호환되는
정적 파일을 저장소 루트에도 동기화합니다. `main` 브랜치에 반영되면
GitHub Actions 배포와 브랜치 기반 Pages 배포 모두 같은 화면을 제공합니다.

## 저작권

© 2026 K-TEXT. All rights reserved.

작품의 서사, 문장, 캐릭터, 이미지와 편집 결과물은 권리자의 허락 없이 복제·재배포·판매하거나 별도의 콘텐츠 또는 학습 데이터로 이용할 수 없습니다. 일부 기획·교정·번역 준비·이미지 제작 과정에는 생성형 AI가 보조 도구로 사용되었습니다.
