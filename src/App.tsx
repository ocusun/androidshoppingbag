import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

const assetUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

type View = "home" | "reader" | "webtoon";
type Theme = "paper" | "night";
type LoadState = "loading" | "ready" | "error";
type ReaderBlock = {
  kind: "prose" | "quote" | "system";
  text: string;
};
type Chapter = {
  number: number;
  title: string;
  blocks: ReaderBlock[];
};
type ReadingState = {
  chapter: number;
  block: number;
  percent: number;
};

const CHAPTER_META = [
  {
    title: "143번의 기적",
    hook: "무심코 받은 번호표가 성훈의 남은 인생을 바꾼다.",
    minutes: 7,
  },
  {
    title: "5억짜리 계약",
    hook: "소비에만 쓸 수 있는 5억 원과 인간보다 인간 같은 파트너.",
    minutes: 9,
  },
  {
    title: "30만 원 식권",
    hook: "석 달의 노동 대가로 식권 오십 장을 받은 남자가 사표를 던진다.",
    minutes: 10,
  },
  {
    title: "265만 원짜리 결계",
    hook: "성훈은 체온보다 타인의 시선을 차단할 외피를 산다.",
    minutes: 11,
  },
  {
    title: "1인분의 고독",
    hook: "가족용 음식을 가득 샀지만 화려한 식탁에는 접시 하나뿐이다.",
    minutes: 10,
  },
  {
    title: "콘크리트 쇼핑백",
    hook: "한강이 보이는 집을 얻자 채워야 할 빈 공간이 더 커진다.",
    minutes: 8,
  },
  {
    title: "취향의 계급",
    hook: "생활을 위한 집이 타인에게 보여주기 위한 무대로 변한다.",
    minutes: 9,
  },
  {
    title: "도로 위의 계급장",
    hook: "새 차 안으로 도착한 한 통의 메시지가 소비의 방향을 돌린다.",
    minutes: 12,
  },
  {
    title: "사라진 8분",
    hook: "도연은 성훈의 예측 불가능한 선택을 연구소에 보내지 않는다.",
    minutes: 11,
  },
  {
    title: "안드로이드의 첫 번째 거짓말",
    hook: "실험의 진실 앞에서 도연은 태어난 뒤 처음으로 거짓말한다.",
    minutes: 12,
  },
] as const;

const WEBTOON_STRIPS = [
  {
    src: "webtoon/ep01-strip-01.webp",
    alt: "여의도의 늦은 오후, 야근으로 지친 성훈이 국가 미래 전략 보고서를 완성하는 장면",
    caption: "2026년 10월 14일 오후 · 여의도",
    lines: [
      { speaker: "상무", text: "김 팀장, 역시 자네야. 회장님이 아주 만족하셨어." },
      { speaker: "성훈", text: "누가 알아주지 않아도… 세상이 조금만 나아진다면." },
    ],
  },
  {
    src: "webtoon/ep01-strip-02.webp",
    alt: "성훈의 보고서와 협회장의 이름, 그리고 씁쓸한 표정으로 퇴근하는 성훈",
    caption: "석 달의 밤이 끝났다. 그러나 표지에 그의 이름은 없었다.",
    lines: [
      { speaker: "상무", text: "토씨 하나 안 바꾸고 장관 보고에 올리기로 했네." },
      { speaker: "성훈", text: "…네. 다행입니다." },
    ],
  },
  {
    src: "webtoon/ep01-strip-03.webp",
    alt: "경호원들이 둘러싼 강남 치킨집과 화장실 옆에서 몰래 촬영하는 성훈",
    caption: "그날 저녁 · 강남의 작은 치킨집",
    lines: [
      { speaker: "성훈", text: "사진 한 장이면 돼. 홍보자료에 쓸 만한 사진 한 장." },
      { speaker: "에이드리언 서", text: "오늘 이 다이내믹한 밤을 기념해 작은 실험을 공개하겠습니다." },
    ],
  },
  {
    src: "webtoon/ep01-strip-04.webp",
    alt: "노바젠 창업자가 투명한 추첨함 앞에서 비밀 휴머노이드 프로젝트를 발표하는 장면",
    caption: "NOVAGEN SECRET PROJECT · Y-143",
    lines: [
      { speaker: "에이드리언 서", text: "인간의 표정과 감정, 모순된 욕망까지 학습하는 휴머노이드 파트너." },
      { speaker: "에이드리언 서", text: "행운의 베타테스터는— 넘버 원 포 쓰리." },
    ],
  },
  {
    src: "webtoon/ep01-strip-05.webp",
    alt: "무관심한 사람들 사이에서 구겨진 143번 번호표를 발견하고 얼어붙은 성훈",
    caption: "사람들은 다시 웃고 떠들었다. 성훈만 움직이지 못했다.",
    lines: [
      { speaker: "성훈", text: "143번……." },
      { speaker: "성훈", text: "나잖아." },
    ],
  },
] as const;

const STORAGE_KEY = "ktext-shopping-bag-reader-v1";
const SETTINGS_KEY = "ktext-reader-settings-v1";

function stripMarkdown(value: string) {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/ {2,}\n/g, "\n")
    .trim();
}

function parseBlocks(section: string): ReaderBlock[] {
  return section
    .split(/\n\s*\n/)
    .map((raw) => raw.trim())
    .filter((raw) => raw && raw !== "---")
    .map((raw) => {
      const quoted = raw
        .split("\n")
        .every((line) => line.trim().startsWith(">"));
      const withoutQuote = raw
        .split("\n")
        .map((line) => line.replace(/^>\s?/, ""))
        .join("\n");
      const text = stripMarkdown(quoted ? withoutQuote : raw);
      const isSystem =
        /^(\[|OBSERVATION LOG|SOCIAL NOISE|ENVIRONMENT SCAN)/.test(text) ||
        /\n(가격|대상|품목|판정|기능|열량|비교|소재):/.test(text);

      return {
        kind: isSystem ? "system" : quoted ? "quote" : "prose",
        text,
      };
    });
}

function parseManuscript(source: string): Chapter[] {
  const story = source.split(/\n## 1~10화 핵심 설정 원장/)[0];
  const heading = /^## 제(\d+)화\.\s+(.+)$/gm;
  const matches = [...story.matchAll(heading)];

  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end =
      index + 1 < matches.length ? matches[index + 1].index ?? story.length : story.length;
    return {
      number: Number(match[1]),
      title: match[2].trim(),
      blocks: parseBlocks(story.slice(start, end)),
    };
  });
}

function formatEpisode(number: number) {
  return String(number).padStart(2, "0");
}

function getStoredReading(): ReadingState {
  if (typeof window === "undefined") return { chapter: 1, block: 0, percent: 0 };
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "");
    return {
      chapter: Math.min(10, Math.max(1, Number(value.chapter) || 1)),
      block: Math.max(0, Number(value.block) || 0),
      percent: Math.min(100, Math.max(0, Number(value.percent) || 0)),
    };
  } catch {
    return { chapter: 1, block: 0, percent: 0 };
  }
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [reading, setReading] = useState<ReadingState>({
    chapter: 1,
    block: 0,
    percent: 0,
  });
  const [completed, setCompleted] = useState<number[]>([]);
  const [fontScale, setFontScale] = useState(1);
  const [theme, setTheme] = useState<Theme>("paper");
  const [showChapters, setShowChapters] = useState(false);
  const [languageNotice, setLanguageNotice] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const readerScrollRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadManuscript = useCallback(() => {
    setLoadState("loading");
    fetch(assetUrl("content/shopping-bag-android-ko.md"))
      .then((response) => {
        if (!response.ok) throw new Error("manuscript unavailable");
        return response.text();
      })
      .then((source) => {
        const parsed = parseManuscript(source);
        if (parsed.length !== CHAPTER_META.length) {
          throw new Error("manuscript incomplete");
        }
        setChapters(parsed);
        setLoadState("ready");
      })
      .catch(() => {
        setChapters([]);
        setLoadState("error");
      });
  }, []);

  useEffect(() => {
    const initializeSettings = window.requestAnimationFrame(() => {
      const stored = getStoredReading();
      setReading(stored);
      try {
        const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "");
        setFontScale(Math.min(1.28, Math.max(0.86, Number(settings.fontScale) || 1)));
        setTheme(settings.theme === "night" ? "night" : "paper");
        setCompleted(
          Array.isArray(settings.completed)
            ? settings.completed.filter((value: unknown) => Number.isInteger(value))
            : [],
        );
      } catch {
        // Use the calm paper defaults when no device preference exists.
      }
    });

    const initializeContent = window.requestAnimationFrame(loadManuscript);

    const handlePopState = () => {
      const readerMatch = window.location.hash.match(/^#read\/(\d{1,2})/);
      const webtoonMatch = window.location.hash.match(/^#webtoon\/(\d{1,2})/);
      setView(webtoonMatch ? "webtoon" : readerMatch ? "reader" : "home");
      if (readerMatch) {
        const chapter = Math.min(10, Math.max(1, Number(readerMatch[1]) || 1));
        const saved = getStoredReading();
        setReading({
          chapter,
          block: saved.chapter === chapter ? saved.block : 0,
          percent: saved.chapter === chapter ? saved.percent : 0,
        });
      }
    };
    handlePopState();
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.cancelAnimationFrame(initializeSettings);
      window.cancelAnimationFrame(initializeContent);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [loadManuscript]);

  useEffect(() => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ fontScale, theme, completed }),
    );
  }, [fontScale, theme, completed]);

  const currentChapter = chapters.find(
    (chapter) => chapter.number === reading.chapter,
  );

  const overallProgress = useMemo(() => {
    const finished = completed.length * 100;
    const current = completed.includes(reading.chapter) ? 0 : reading.percent;
    return Math.min(100, Math.round((finished + current) / CHAPTER_META.length));
  }, [completed, reading]);

  const persistReading = useCallback((next: ReadingState) => {
    setReading(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }, 120);
  }, []);

  const restorePosition = useCallback((block: number) => {
    requestAnimationFrame(() => {
      const container = readerScrollRef.current;
      if (container && block <= 0) {
        container.scrollTo({ top: 0, behavior: "auto" });
        return;
      }
      const target = container?.querySelector<HTMLElement>(
        `[data-reader-block="${block}"]`,
      );
      if (container && target) {
        container.scrollTo({ top: Math.max(0, target.offsetTop - 130), behavior: "auto" });
      } else {
        container?.scrollTo({ top: 0, behavior: "auto" });
      }
    });
  }, []);

  const openReader = useCallback(
    (chapter?: number, fromStart = false) => {
      const nextChapter = chapter ?? reading.chapter;
      const stored = getStoredReading();
      const nextBlock =
        fromStart || stored.chapter !== nextChapter ? 0 : stored.block;
      const nextPercent =
        fromStart || stored.chapter !== nextChapter ? 0 : stored.percent;
      const next = { chapter: nextChapter, block: nextBlock, percent: nextPercent };
      persistReading(next);
      setView("reader");
      setShowChapters(false);
      history.pushState(
        { reader: true },
        "",
        `#read/${formatEpisode(nextChapter)}`,
      );
      restorePosition(nextBlock);
    },
    [persistReading, reading.chapter, restorePosition],
  );

  const closeReader = () => {
    setView("home");
    history.pushState({}, "", window.location.pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openWebtoon = () => {
    setView("webtoon");
    history.pushState({ webtoon: true }, "", "#webtoon/01");
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
  };

  const closeWebtoon = () => {
    setView("home");
    history.pushState({}, "", window.location.pathname);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
  };

  const selectChapter = (number: number) => {
    const stored = getStoredReading();
    const next = {
      chapter: number,
      block: stored.chapter === number ? stored.block : 0,
      percent: stored.chapter === number ? stored.percent : 0,
    };
    persistReading(next);
    setShowChapters(false);
    history.replaceState({ reader: true }, "", `#read/${formatEpisode(number)}`);
    restorePosition(next.block);
  };

  const onReaderScroll = () => {
    const container = readerScrollRef.current;
    if (!container || !currentChapter) return;
    const blocks = [
      ...container.querySelectorAll<HTMLElement>("[data-reader-block]"),
    ];
    const marker = container.scrollTop + Math.min(220, container.clientHeight * 0.32);
    let block = 0;
    for (const item of blocks) {
      if (item.offsetTop <= marker) block = Number(item.dataset.readerBlock || 0);
    }
    const available = Math.max(1, container.scrollHeight - container.clientHeight);
    const percent = Math.min(100, Math.round((container.scrollTop / available) * 100));
    persistReading({ chapter: currentChapter.number, block, percent });
    if (percent >= 92 && !completed.includes(currentChapter.number)) {
      setCompleted((values) => [...values, currentChapter.number]);
    }
  };

  const changeChapter = (direction: -1 | 1) => {
    const next = reading.chapter + direction;
    if (next < 1 || next > CHAPTER_META.length) return;
    if (direction === 1 && !completed.includes(reading.chapter)) {
      setCompleted((values) => [...values, reading.chapter]);
    }
    selectChapter(next);
  };

  const shareService = async () => {
    const shareData = {
      title: "K-TEXT — 안드로이드는 쇼핑백을 든다",
      text: "5억 원짜리 카드와 인간보다 인간 같은 안드로이드. K-TEXT 오리지널 소설과 웹툰 파일럿을 무료로 읽어보세요.",
      url: `${window.location.origin}${window.location.pathname}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus("공유 완료");
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setShareStatus("주소 복사됨");
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") {
        setShareStatus("주소를 복사해 공유해 주세요");
      }
    }

    window.setTimeout(() => setShareStatus(""), 2200);
  };

  if (view === "reader") {
    return (
      <main className={`reading-app theme-${theme}`}>
        <a className="skip-link" href="#reader-content">본문으로 건너뛰기</a>
        <header className="reading-header">
          <button className="reader-wordmark" onClick={closeReader} aria-label="K-TEXT 홈으로">
            K-TEXT
          </button>
          <div className="reading-titlebar">
            <span>안드로이드는 쇼핑백을 든다</span>
            <strong>
              {formatEpisode(reading.chapter)} / {formatEpisode(CHAPTER_META.length)}
            </strong>
          </div>
          <div className="reading-actions">
            <button
              className="mobile-chapter-button"
              onClick={() => setShowChapters((value) => !value)}
              aria-expanded={showChapters}
            >
              회차
            </button>
            <button
              onClick={() => setFontScale((value) => Math.max(0.86, value - 0.07))}
              aria-label="본문 글자 작게"
            >
              A−
            </button>
            <button
              onClick={() => setFontScale((value) => Math.min(1.28, value + 0.07))}
              aria-label="본문 글자 크게"
            >
              A+
            </button>
            <button
              onClick={() => setTheme((value) => (value === "paper" ? "night" : "paper"))}
              aria-label={theme === "paper" ? "야간 독서 모드" : "밝은 독서 모드"}
              aria-pressed={theme === "night"}
            >
              {theme === "paper" ? "◐" : "☀"}
            </button>
            <button className="reader-close" onClick={closeReader} aria-label="독서 화면 닫기">
              ×
            </button>
          </div>
        </header>

        <div className="reading-layout">
          <aside className={`chapter-rail ${showChapters ? "is-open" : ""}`}>
            <div className="rail-book">
              <span>K-TEXT ORIGINAL 01</span>
              <h1>안드로이드는<br />쇼핑백을 든다</h1>
              <p>AI SATIRE · SERIAL FICTION</p>
            </div>
            <nav aria-label="회차 목록">
              {CHAPTER_META.map((chapter, index) => {
                const number = index + 1;
                const isActive = reading.chapter === number;
                return (
                  <button
                    key={chapter.title}
                    className={isActive ? "is-active" : ""}
                    onClick={() => selectChapter(number)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span>{formatEpisode(number)}</span>
                    <strong>{chapter.title}</strong>
                    <i aria-label={completed.includes(number) ? "읽음" : "읽지 않음"}>
                      {completed.includes(number) ? "●" : "○"}
                    </i>
                  </button>
                );
              })}
            </nav>
          </aside>

          <section
            id="reader-content"
            className="reader-scroll"
            ref={readerScrollRef}
            onScroll={onReaderScroll}
            aria-live="polite"
          >
            {currentChapter ? (
              <article
                className="chapter-page"
                style={{ "--reader-scale": fontScale } as CSSProperties}
              >
                <header className="chapter-heading">
                  <div>
                    <span>K-TEXT ORIGINAL · SEASON 01</span>
                    <span>{CHAPTER_META[reading.chapter - 1].minutes} MIN READ</span>
                  </div>
                  <p>EPISODE {formatEpisode(currentChapter.number)}</p>
                  <h2>{currentChapter.title}</h2>
                  <blockquote>{CHAPTER_META[reading.chapter - 1].hook}</blockquote>
                </header>

                <div className="language-status">
                  <strong>한국어 원문</strong>
                  <button onClick={() => setLanguageNotice((value) => !value)}>
                    EN · JA
                  </button>
                  {languageNotice && (
                    <p>영어·일본어판은 작품 원장과 번역 바이블에 따라 검수 중입니다.</p>
                  )}
                </div>

                <div className="chapter-copy">
                  {currentChapter.blocks.map((block, index) => {
                    if (block.kind === "system") {
                      return (
                        <pre key={index} data-reader-block={index} className="system-log">
                          {block.text}
                        </pre>
                      );
                    }
                    if (block.kind === "quote") {
                      return (
                        <blockquote key={index} data-reader-block={index} className="story-quote">
                          {block.text}
                        </blockquote>
                      );
                    }
                    return (
                      <p key={index} data-reader-block={index}>
                        {block.text}
                      </p>
                    );
                  })}
                </div>

                <footer className="chapter-navigation">
                  <button
                    onClick={() => changeChapter(-1)}
                    disabled={reading.chapter === 1}
                  >
                    <span>이전 화</span>
                    <strong>
                      {reading.chapter > 1
                        ? CHAPTER_META[reading.chapter - 2].title
                        : "첫 회차입니다"}
                    </strong>
                  </button>
                  <button
                    className="next-chapter"
                    onClick={() => changeChapter(1)}
                    disabled={reading.chapter === CHAPTER_META.length}
                  >
                    <span>
                      {reading.chapter === CHAPTER_META.length ? "시즌 끝" : "다음 화"}
                    </span>
                    <strong>
                      {reading.chapter < CHAPTER_META.length
                        ? CHAPTER_META[reading.chapter].title
                        : "다음 이야기를 기다려주세요"}
                    </strong>
                  </button>
                </footer>
              </article>
            ) : loadState === "error" ? (
              <div className="reader-error" role="alert">
                <span>STORY UNAVAILABLE</span>
                <h2>원고를 불러오지 못했습니다.</h2>
                <p>연결 상태를 확인한 뒤 다시 시도해 주세요. 읽던 위치는 이 기기에 그대로 남아 있습니다.</p>
                <button onClick={loadManuscript}>다시 불러오기</button>
              </div>
            ) : (
              <div className="reader-loading">
                <span />
                <p>원고를 펼치는 중입니다.</p>
              </div>
            )}
          </section>
        </div>
        <div className="reader-progress-line" aria-label={`현재 회차 ${reading.percent}% 읽음`}>
          <span style={{ width: `${reading.percent}%` }} />
        </div>
      </main>
    );
  }

  if (view === "webtoon") {
    return (
      <main className="webtoon-app">
        <a className="skip-link" href="#webtoon-content">웹툰 본편으로 건너뛰기</a>
        <header className="webtoon-header">
          <button className="webtoon-wordmark" onClick={closeWebtoon} aria-label="K-TEXT 홈으로">
            K-TEXT
          </button>
          <div>
            <span>WEBTOON PILOT</span>
            <strong>EPISODE 01 · 143번의 기적</strong>
          </div>
          <button className="webtoon-exit" onClick={closeWebtoon}>작품 홈</button>
        </header>

        <article className="webtoon-scroll" id="webtoon-content">
          <header className="webtoon-title">
            <p>K-TEXT ORIGINAL · HYBRID EDITION</p>
            <span>01</span>
            <h1>143번의 기적</h1>
            <blockquote>
              무심코 받은 번호표가<br />
              한 남자의 남은 인생을 바꾼다.
            </blockquote>
            <div className="webtoon-direction">
              <i />
              <p>아래로 스크롤해 감상하세요</p>
              <i />
            </div>
          </header>

          <section className="webtoon-canvas" aria-label="웹툰 1화 본편">
            {WEBTOON_STRIPS.map((strip, index) => (
              <figure className={`webtoon-sequence sequence-${index + 1}`} key={strip.src}>
                <figcaption>{strip.caption}</figcaption>
                <img
                  src={assetUrl(strip.src)}
                  alt={strip.alt}
                  width={1024}
                  height={1536}
                  loading={index < 2 ? "eager" : "lazy"}
                  decoding="async"
                />
                <div className="webtoon-dialogues">
                  {strip.lines.map((line, lineIndex) => (
                    <blockquote
                      className={lineIndex % 2 ? "dialogue-right" : "dialogue-left"}
                      key={`${line.speaker}-${line.text}`}
                    >
                      <span>{line.speaker}</span>
                      <p>{line.text}</p>
                    </blockquote>
                  ))}
                </div>
              </figure>
            ))}
          </section>

          <footer className="webtoon-ending">
            <p>TO BE CONTINUED</p>
            <h2>다음 화<br />5억짜리 계약</h2>
            <div>
              <button className="primary-button" onClick={() => openReader(2, true)}>
                소설 2화 계속 읽기
              </button>
              <button className="webtoon-secondary" onClick={() => openReader(1, true)}>
                소설 1화 원문 보기
              </button>
            </div>
            <small>
              그림과 분리된 대사 구조로 제작되어, 같은 장면을 여러 언어로 확장할 수 있습니다.
            </small>
          </footer>
        </article>
      </main>
    );
  }

  return (
    <main className="site-shell">
      <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
      <header className="site-header">
        <button className="wordmark" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          K-TEXT
        </button>
        <nav aria-label="주요 메뉴">
          <a href="#original">Original</a>
          <a href="#webtoon">Webtoon</a>
          <a href="#episodes">Episodes</a>
          <a href="#about">About</a>
        </nav>
        <div className="header-actions">
          <button className="header-share" onClick={shareService} aria-label="K-TEXT 공유하기">
            공유
          </button>
          <button className="header-read" onClick={() => openReader()}>
            이어 읽기
          </button>
        </div>
      </header>

      <section className="service-hero" id="main-content">
        <div className="hero-grid" aria-hidden="true" />
        <div className="story-lines" aria-hidden="true">
          <span>story · story · story</span>
          <span>物語 · 物語 · 物語</span>
          <span>故事 · 故事 · 故事</span>
          <span>historia · histoire · قصة</span>
        </div>

        <div className="hero-intro">
          <p className="eyebrow" id="original">K-TEXT ORIGINAL 01 · SEASON ONE</p>
          <div className="release-chips" aria-label="공개 콘텐츠 안내">
            <span>PUBLIC BETA</span>
            <span>무료 공개</span>
            <span>소설 10화</span>
          </div>
          <h1>안드로이드는<br />쇼핑백을 든다</h1>
          <p className="english-title">근미래 SF · 사회 풍자 연재소설</p>
          <p className="hero-logline">
            소비에만 쓸 수 있는 5억 원.<br />
            인간의 욕망을 학습하는 안드로이드.<br />
            그리고 예측에서 벗어나기 시작한 한 남자.
          </p>
          <div className="hero-buttons">
            <button className="primary-button" onClick={openWebtoon}>
              웹툰으로 시작
            </button>
            <button className="plain-button" onClick={() => openReader(1, true)}>
              소설로 읽기
              <span>→</span>
            </button>
          </div>
        </div>

        <article className="book-feature">
          <div className="book-spine">
            <span>K-TEXT</span>
            <strong>01</strong>
          </div>
          <div className="book-cover">
            <div className="bag-mark" aria-hidden="true">
              <span />
              <i />
            </div>
            <p>K-TEXT ORIGINAL</p>
            <h2>안드로이드는<br />쇼핑백을 든다</h2>
            <span>AI SATIRE · SERIAL FICTION</span>
            <div className="cover-credit">STORY DIRECTION · 조일출</div>
          </div>
        </article>

        <aside className="hero-reading-card">
          <div>
            <span>YOUR READING</span>
            <strong>{overallProgress}%</strong>
          </div>
          <p>
            EP. {formatEpisode(reading.chapter)} · {CHAPTER_META[reading.chapter - 1].title}
          </p>
          <div><span style={{ width: `${overallProgress}%` }} /></div>
          <button onClick={() => openReader()}>이어 읽기 →</button>
        </aside>

        <div className="episode-index" aria-hidden="true">
          {CHAPTER_META.map((_, index) => (
            <span key={index}>{formatEpisode(index + 1)}</span>
          ))}
        </div>
      </section>

      <section className="release-bar" aria-label="K-TEXT 공개 베타 안내">
        <div>
          <span>NOW OPEN</span>
          <p><strong>가입 없이 바로 읽는 K-TEXT 공개 베타</strong> · 소설 10화와 웹툰 파일럿 1화를 무료로 공개합니다.</p>
        </div>
        <ul>
          <li>로그인 없음</li>
          <li>결제 없음</li>
          <li>기기 내 독서 기록</li>
        </ul>
        <button onClick={shareService}>{shareStatus || "작품 공유하기 ↗"}</button>
      </section>

      <section className="webtoon-feature page-section" id="webtoon">
        <header className="section-heading">
          <div>
            <span className="section-kicker">NEW · WEBTOON PILOT EP. 01</span>
            <h2>같은 이야기를,<br />이번에는 눈으로.</h2>
          </div>
          <p>
            성훈의 고단한 하루와 143번 번호표가 만나는 순간을 세로형 웹툰으로 먼저
            경험하세요. 대사는 그림과 분리되어, 앞으로 같은 장면을 여러 언어로
            전환할 수 있습니다.
          </p>
        </header>
        <div className="webtoon-feature-grid">
          <div className="character-preview">
            <img
              src={assetUrl("webtoon/character-master.webp")}
              alt="짧은 흑발의 성훈과 짙은 갈색 웨이브 단발의 안드로이드 도연 캐릭터 디자인"
              width={1024}
              height={1536}
              loading="lazy"
              decoding="async"
            />
            <span>CHARACTER DESIGN · SEONGHUN &amp; DOYEON</span>
          </div>
          <div className="webtoon-feature-copy">
            <span>SCROLL COMIC · 15 VISUAL BEATS</span>
            <h3>제1화<br />143번의 기적</h3>
            <blockquote>“143번…… 나잖아.”</blockquote>
            <p>
              소설의 문장을 그대로 그림으로 옮기기보다, 성훈의 표정과 공간의 계급감을
              중심으로 다시 연출한 파일럿 에디션입니다.
            </p>
            <button className="primary-button" onClick={openWebtoon}>
              웹툰 1화 보기
            </button>
          </div>
        </div>
      </section>

      <section className="episodes-section page-section" id="episodes">
        <header className="section-heading">
          <div>
            <span className="section-kicker">ALL EPISODES · 01—10</span>
            <h2>욕망을 사고,<br />자유를 발견하다.</h2>
          </div>
          <p>
            첫 번째 이야기 묶음은 성훈과 도연의 만남에서 시작해,
            도연이 처음으로 인간에게 거짓말하는 순간까지 이어집니다.
          </p>
        </header>

        <div className="episode-list">
          {CHAPTER_META.map((chapter, index) => {
            const number = index + 1;
            const status = completed.includes(number)
              ? "READ"
              : reading.chapter === number && reading.percent > 0
                ? `${reading.percent}%`
                : `${chapter.minutes} MIN`;
            return (
              <button key={chapter.title} onClick={() => openReader(number)}>
                <span className="episode-number">{formatEpisode(number)}</span>
                <div>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.hook}</p>
                </div>
                <span className="episode-status">{status}</span>
                <i aria-hidden="true">↗</i>
              </button>
            );
          })}
        </div>
      </section>

      <section className="experience-section">
        <div className="experience-copy">
          <span className="section-kicker">A READER THAT REMEMBERS</span>
          <h2>책을 덮어도,<br />읽던 이야기는 멈추지 않습니다.</h2>
          <p>
            회차와 읽던 문단, 글자 크기와 독서 모드를 이 기기에 기억합니다.
            다시 돌아오면 마지막 문장 가까이에서 바로 이어집니다.
          </p>
        </div>
        <div className="experience-demo">
          <div className="demo-toolbar">
            <span>EP. 09</span>
            <div><i>A−</i><i>A+</i><i>◐</i></div>
          </div>
          <p className="demo-label">사라진 8분</p>
          <blockquote>
            도연은 전송 버튼을 바라보았다.<br />
            그리고 처음으로, 아무것도 하지 않기로 선택했다.
          </blockquote>
          <div className="demo-progress"><span /></div>
          <p className="demo-caption">문단 위치 자동 저장 · 언어 전환 구조 · 반응형 독서 화면</p>
        </div>
      </section>

      <section className="studio-section page-section" id="studio">
        <header className="section-heading compact">
          <div>
            <span className="section-kicker">THE K-TEXT STUDIO</span>
            <h2>한 사람이 지휘하는<br />글로벌 작가실.</h2>
          </div>
          <p>
            작품의 방향과 최종 판단은 인간이 맡고, 여러 AI가 기획·집필·설정·비평·번역의
            역할을 나눕니다. 모든 결과는 하나의 작품 원장으로 통합됩니다.
          </p>
        </header>
        <div className="studio-steps">
          <article><span>01</span><small>DIRECT</small><h3>방향을 정한다</h3><p>인간 총괄 디렉터가 소재와 감정, 세상에 내놓을 이유를 결정합니다.</p></article>
          <article><span>02</span><small>CREATE</small><h3>함께 집필한다</h3><p>AI 작가실이 역할을 나누고 장면과 구조를 반복해서 검증합니다.</p></article>
          <article><span>03</span><small>CONTROL</small><h3>원장으로 지킨다</h3><p>인물·연표·금액·시점·용어를 하나의 기준으로 관리합니다.</p></article>
          <article><span>04</span><small>LOCALIZE</small><h3>다시 쓰고 확장한다</h3><p>원문의 목소리를 보존하며 세계 독자의 언어로 다시 씁니다.</p></article>
        </div>
      </section>

      <section className="about-section page-section" id="about">
        <header className="section-heading compact">
          <div>
            <span className="section-kicker">PUBLIC BETA · READER FIRST</span>
            <h2>처음 온 독자도<br />바로 읽을 수 있도록.</h2>
          </div>
          <p>
            K-TEXT는 하나의 이야기를 소설과 웹툰, 여러 언어로 확장하는 독서 서비스입니다.
            현재 공개 베타에서는 회원가입과 결제 없이 한국어 원문과 웹툰 파일럿을 제공합니다.
          </p>
        </header>
        <div className="about-grid">
          <article>
            <span>01</span>
            <h3>무료로 시작</h3>
            <p>계정이나 앱 설치 없이 브라우저에서 바로 첫 화를 읽을 수 있습니다.</p>
          </article>
          <article>
            <span>02</span>
            <h3>기억하는 독서 화면</h3>
            <p>읽던 회차와 문단, 글자 크기와 야간 모드는 현재 기기에만 저장됩니다.</p>
          </article>
          <article>
            <span>03</span>
            <h3>소설과 웹툰 사이</h3>
            <p>같은 이야기의 문장과 장면을 오가며 자신에게 맞는 방식으로 감상합니다.</p>
          </article>
          <article>
            <span>04</span>
            <h3>정식 확장을 위한 베타</h3>
            <p>영어·일본어판과 후속 웹툰은 작품 원장 검수 후 순차 공개할 예정입니다.</p>
          </article>
        </div>
        <aside className="beta-note">
          <strong>공개 베타 안내</strong>
          <p>
            현재는 작품 감상에 집중한 무료 버전입니다. 회원 기능·댓글·결제는 제공하지 않으며,
            서비스 구성과 공개 회차는 정식 출시 과정에서 조정될 수 있습니다.
          </p>
        </aside>
      </section>

      <section className="manifesto-section">
        <p aria-hidden="true">이야기　story　物語　故事　historia　histoire　قصة</p>
        <div>
          <span className="section-kicker">THE K-TEXT MANIFESTO</span>
          <blockquote>
            우리는 AI로 더 많은 글을 만들려는 것이 아닙니다.
            <strong>한 사람이 세계적인 콘텐츠 스튜디오를 운영할 수 있는 시대</strong>가
            시작됐음을 증명하려 합니다.
          </blockquote>
          <button className="primary-button" onClick={() => openReader(1, true)}>
            첫 이야기 읽기
          </button>
        </div>
      </section>

      <footer className="site-footer">
        <div>
          <div className="wordmark">K-TEXT</div>
          <p>One story. Every language.</p>
        </div>
        <p>Original story direction · 조일출<br />Developed with collaborative AI</p>
        <div className="footer-links">
          <a href={assetUrl("terms.html")}>이용약관</a>
          <a href={assetUrl("privacy.html")}>개인정보 안내</a>
          <button onClick={shareService}>{shareStatus || "공유하기"}</button>
        </div>
        <div className="footer-meta">
          <p>© 2026 K-TEXT. All rights reserved.</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            BACK TO TOP ↑
          </button>
        </div>
      </footer>
    </main>
  );
}
