type PolicySection = {
  title: string;
  body: string;
};

const privacySections: PolicySection[] = [
  {
    title: "1. 계정과 입력 정보",
    body: "현재 K-TEXT 공개 베타는 회원가입, 댓글, 결제, 문의 양식을 운영하지 않습니다. 따라서 이름, 연락처, 결제정보를 직접 입력받지 않습니다.",
  },
  {
    title: "2. 기기에 저장되는 정보",
    body: "이어 읽기 기능을 위해 읽던 회차와 문단, 진행률, 완료 회차, 글자 크기, 밝은·야간 모드 설정을 브라우저 저장공간에 보관합니다. 이 정보는 계정과 연결되지 않으며 K-TEXT 서버로 전송해 독자 프로필을 만들지 않습니다.",
  },
  {
    title: "3. 저장 정보 삭제",
    body: "브라우저 설정에서 이 사이트의 데이터 또는 로컬 저장공간을 삭제하면 독서 기록과 화면 설정도 함께 초기화됩니다.",
  },
  {
    title: "4. 호스팅 과정의 기술 정보",
    body: "사이트 제공과 보안을 위해 호스팅 사업자가 IP 주소, 브라우저 종류, 접속 시각 같은 표준 기술 로그를 처리할 수 있습니다. K-TEXT는 이를 맞춤형 광고나 독자 프로파일링에 사용하지 않습니다.",
  },
  {
    title: "5. 향후 기능 추가",
    body: "계정, 댓글, 구독, 결제 또는 문의 기능을 추가하는 경우 수집 항목과 이용 목적, 보관 기간을 사전에 명확히 알리고 이 안내를 갱신합니다.",
  },
];

const termsSections: PolicySection[] = [
  {
    title: "1. 서비스의 성격",
    body: "K-TEXT는 소설과 웹툰 콘텐츠를 제공하는 공개 베타 독서 서비스입니다. 현재 회원가입, 댓글, 유료 결제 기능은 제공하지 않습니다.",
  },
  {
    title: "2. 콘텐츠 이용",
    body: "공개된 작품은 개인적인 감상을 위해 이용할 수 있습니다. 권리자의 사전 허락 없이 원문·이미지를 복제, 재배포, 판매하거나 별도의 콘텐츠·학습 데이터로 제공할 수 없습니다.",
  },
  {
    title: "3. 저작권과 제작 방식",
    body: "작품의 서사, 문장, 캐릭터와 편집 결과물의 권리는 K-TEXT 및 해당 권리자에게 있습니다. 일부 기획·교정·번역 준비·이미지 제작 과정에는 생성형 AI가 보조 도구로 사용되었습니다.",
  },
  {
    title: "4. 베타 운영",
    body: "안정성과 작품 품질을 개선하기 위해 기능, 공개 회차, 화면 구성이 변경될 수 있습니다. 점검이나 불가피한 사유로 서비스가 일시 중단될 수 있습니다.",
  },
  {
    title: "5. 금지 행위",
    body: "서비스 운영을 방해하는 자동화 요청, 보안 우회, 콘텐츠의 무단 수집·배포, 타인의 권리를 침해하는 방식의 이용을 금지합니다.",
  },
  {
    title: "6. 약관 변경",
    body: "정식 서비스 전환이나 기능 추가 시 본 약관은 변경될 수 있으며, 중요한 변경은 이 페이지에 시행일과 함께 알립니다.",
  },
];

export default function PolicyApp() {
  const isPrivacy = window.location.pathname.endsWith("privacy.html");
  const title = isPrivacy ? "개인정보 안내" : "이용약관";
  const kicker = isPrivacy ? "PRIVACY NOTICE" : "PUBLIC BETA POLICY";
  const sections = isPrivacy ? privacySections : termsSections;

  return (
    <main className="policy-page">
      <a className="skip-link" href="#policy-content">
        본문으로 건너뛰기
      </a>
      <header className="policy-header">
        <a href={import.meta.env.BASE_URL} className="wordmark">
          K-TEXT
        </a>
        <a href={import.meta.env.BASE_URL}>작품으로 돌아가기</a>
      </header>
      <article id="policy-content">
        <p className="section-kicker">{kicker}</p>
        <h1>{title}</h1>
        <p className="policy-lead">시행일: 2026년 7월 24일</p>
        {sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </article>
      <footer className="policy-footer">© 2026 K-TEXT</footer>
    </main>
  );
}
