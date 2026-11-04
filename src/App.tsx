import { useEffect, useRef, useState } from "react";
import { Arrow, Chevron, Pause, Play, Plus } from "./components/Icons";
import { ProjectDialog } from "./components/ProjectDialog";
import { FieldNotes } from "./components/FieldNotes";
import { ContentBackdrop } from "./components/ContentBackdrop";
import { subscribePageScroll } from "./components/pageScroll";
import { ProjectCover } from "./components/ProjectCover";
import { BorderGlow } from "./components/BorderGlow";
import { SectionLabel } from "./components/SectionLabel";
import { usePortfolioMotion } from "./components/usePortfolioMotion";
import { GlowCursor } from "./components/GlowCursor";
import { projects, strengths, contact } from "./content";
import "./App.css";

const navigation = [
  ["about", "关于我"],
  ["work", "精选项目"],
  ["strengths", "个人优势"],
  ["journal", "户外手记"],
  ["contact", "联系我"],
];

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  useEffect(() => {
    const sections = ["home", ...navigation.map(([id]) => id)]
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);
    let frame: number | undefined;
    const update = () => {
      frame = undefined;
      setScrolled(window.scrollY > 40);
      const marker = Math.min(window.innerHeight * 0.28, 180);
      let current = "home";
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= marker) current = section.id;
      }
      if (
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2
      ) {
        current = "contact";
      }
      setActiveSection(current);
    };
    const onScroll = () => {
      if (frame === undefined) frame = requestAnimationFrame(update);
    };
    update();
    const unsubscribeScroll = subscribePageScroll(update);
    window.addEventListener("resize", onScroll);
    return () => {
      unsubscribeScroll();
      window.removeEventListener("resize", onScroll);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <header className={`header ${scrolled ? "header-scrolled" : ""}`}>
      <div className="header-inner wrap">
        <a className="wordmark" href="#home" aria-label="张方程，返回首页">
          ZFC<span>.</span>
        </a>
        <button
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="main-nav"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "关闭" : "菜单"}
          <Plus className={menuOpen ? "rotate" : ""} />
        </button>
        <nav
          id="main-nav"
          aria-label="主导航"
          className={menuOpen ? "nav-open" : ""}
        >
          {navigation.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={activeSection === id ? "location" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Hero({ suspended }: { suspended: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const userPaused = useRef(false);
  const syncPlayback = useRef<() => void>(() => {});
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = element.getBoundingClientRect().bottom > 0;
    let alive = true;
    const allowed = () => alive && visible && !media.matches && !suspended && !document.hidden && !userPaused.current;
    const sync = () => {
      if (!allowed()) element.pause();
      else void element.play().then(() => { if (!allowed()) element.pause(); }).catch(() => setPlaying(false));
    };
    syncPlayback.current = sync;
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting); sync();
    });
    observer.observe(element);
    sync();
    media.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      alive = false; syncPlayback.current = () => {};
      observer.disconnect(); media.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync); element.pause();
    };
  }, [suspended]);
  const toggleVideo = () => {
    userPaused.current = playing;
    syncPlayback.current();
  };
  return (
    <section className="hero" id="home" aria-label="首页">
      <div className="hero-media" aria-hidden="true">
        <img
          className="hero-poster"
          src="/media/display/hero-poster.webp"
          alt=""
          fetchPriority="high"
        />
        {!videoError && (
          <video
            ref={video}
            muted
            loop
            playsInline
            preload="none"
            poster="/media/display/hero-poster.webp"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={(event) => {
              // An unsupported <source> must allow the browser's next source.
              if (event.target === event.currentTarget || event.target === event.currentTarget.lastElementChild) setVideoError(true);
            }}
          >
            <source src="/media/hero-snow-mobile.mp4?v=20261103" media="(max-width: 760px)" type="video/mp4" />
            <source src="/media/hero-snow.mp4?v=20261103" type="video/mp4" />
          </video>
        )}
      </div>
      <div className="hero-shade" />
      <div className="hero-content wrap">
        <div className="hero-name">
          <h1 aria-label="张方程">
            {Array.from("张方程").map((character) => <span className="hero-glyph-mask" key={character} aria-hidden="true"><span className="hero-glyph">{character}</span></span>)}
            <span className="name-dot" aria-hidden="true">.</span>
          </h1>
          <span className="english-name">FANGCHENG ZHANG</span>
        </div>
        <div className="hero-bottom">
          <div>
            <p className="hero-line">
              <span className="hero-line-mask"><span className="hero-line-copy">把想法，</span></span>
              <span className="hero-line-mask"><span className="hero-line-copy">做成看得见的成果。</span></span>
            </p>
            <div className="hero-actions">
              <a className="button button-light" href="#work">
                查看作品 <Arrow />
              </a>
              <a className="text-link" href="#contact">
                联系我 <Arrow />
              </a>
            </div>
          </div>
          <div className="hero-side">
            <p>
              在真实项目里实践，
              <br />
              也在山野之间保持好奇。
            </p>
            <button
              className="video-control"
              onClick={toggleVideo}
              disabled={videoError}
              aria-label={playing ? "暂停背景视频" : "播放背景视频"}
            >
              {playing ? <Pause /> : <Play />}
              <span>
                {videoError ? "静态影像" : playing ? "暂停影像" : "播放影像"}
              </span>
            </button>
          </div>
        </div>
        <div className="hero-foot">
          <a href="#about">
            向下探索 <Chevron />
          </a>
          <span>个人作品与实践记录</span>
          <span>© 2026</span>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="section about wrap" id="about">
      <SectionLabel number="01" english="ABOUT">
        关于我
      </SectionLabel>
      <div className="about-grid">
        <div className="about-portrait media-reveal">
          <img
            src="/media/display/yema-portrait.webp"
            alt="张方程在野马海子的户外人物照"
            loading="lazy"
            decoding="async"
            width={1414} height={2600}
          />
          <div className="portrait-caption">
            <span>保持好奇，持续行动。</span>
            <span>野马海子</span>
          </div>
          <div className="image-shutter" aria-hidden="true" />
        </div>
        <div className="about-copy">
          <h2>
            用技术做事，
            <br />
            <span className="muted">用脚步探索。</span>
          </h2>
          <div className="bio">
            <img
              src="/media/portrait.webp"
              alt="张方程的简历头像"
              loading="lazy"
              decoding="async"
            />
            <div>
              <h3>你好，我是张方程。</h3>
              <p>常州大学计算机科学与技术本科在读，2028 年毕业。</p>
            </div>
          </div>
          <p className="about-description">
            我把 AI
            工具用于项目落地，也独立完成内容创作、数据复盘与用户沟通。从企业内容运营系统到户外账号，我喜欢把一个想法拆成步骤，再把它真正做出来。
          </p>
          <div className="timeline">
            <div>
              <span>2024 — 2028</span>
              <p>
                常州大学<small>计算机科学与技术 · 本科在读</small>
              </p>
            </div>
            <div>
              <span>2026.07 — 08</span>
              <p>
                通邮电子商务产业园
                <small>AI 产品与项目实习 · GEO SaaS 实践</small>
              </p>
            </div>
            <div>
              <span>2025.09 — 至今</span>
              <p>
                Dolla 户外内容创作<small>系统运营 · 前期创作始于此前</small>
              </p>
            </div>
          </div>
          <a href={`mailto:${contact.email}`} className="text-link about-email">
            {contact.email}
            <Arrow />
          </a>
        </div>
      </div>
      <div className="metrics">
        <div>
          <strong>
            2,000<span>+</span>
          </strong>
          <span>户外账号粉丝</span>
        </div>
        <div>
          <strong>
            30<span>万+</span>
          </strong>
          <span>账号获赞</span>
        </div>
        <div>
          <strong>
            170<span>万+</span>
          </strong>
          <span>单条作品播放量</span>
        </div>
        <p>
          据本人提供的账号后台截图
          <br />
          数据为历史记录，非实时统计
        </p>
      </div>
    </section>
  );
}

function Work({ onOpen, tiltEnabled = true }: { onOpen: (id: string) => void; tiltEnabled?: boolean }) {
  return (
    <section className="section work wrap" id="work">
      <SectionLabel number="02" english="SELECTED WORK">
        精选项目
      </SectionLabel>
      <div className="section-heading">
        <h2>想法有了形状。</h2>
        <p>
          从业务系统到内容创作，
          <br />
          在具体的实践中积累能力。
        </p>
      </div>
      <div className="projects">
        {projects.map((project, index) => (
          <article className={`project project-${project.id}`} key={project.id}>
            <button
              className="project-open"
              onClick={() => onOpen(project.id)}
              aria-label={`查看${project.title}项目详情`}
            >
              <ProjectCover project={project} index={index} tiltEnabled={tiltEnabled} />
              <div className="project-title">
                <div>
                  <span className="project-type">{project.type}</span>
                  <h3>{project.title}</h3>
                </div>
                <Arrow />
              </div>
            </button>
            <p className="project-summary">{project.summary}</p>
            <div className="tags">
              {project.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Strengths({tiltEnabled=true}:{tiltEnabled?:boolean}) {
  return (
    <section className="strengths-band" id="strengths">
      <div className="section wrap">
        <SectionLabel number="03" english="WHAT I BRING">
          个人优势
        </SectionLabel>
        <div className="section-heading">
          <h2>
            能做什么，
            <br />
            用经历回答。
          </h2>
          <p>
            让工具、内容和执行连接起来，
            <br />
            把事情推进到有结果的下一步。
          </p>
        </div>
        <div className="strengths-grid">
          {strengths.map((item, index) => (
            <BorderGlow className="strength-card" key={item.title} tiltEnabled={tiltEnabled}>
              <div className="strength-top">
                <span>0{index + 1}</span>
                <Plus />
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div className="strength-evidence">{item.evidence}</div>
            </BorderGlow>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const [feedback, setFeedback] = useState("");
  const reset = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(reset.current), []);
  const copy = async (value: string, label: string) => {
    clearTimeout(reset.current);
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(`${label}已复制：${value}`);
    } catch {
      setFeedback(`未能自动复制，请选中下方${label}手动复制：${value}`);
    }
    reset.current = setTimeout(() => setFeedback(""), 6000);
  };
  return (
    <section className="contact" id="contact">
      <div className="wrap contact-inner">
        <SectionLabel number="05" english="GET IN TOUCH">
          联系我
        </SectionLabel>
        <div className="contact-main">
          <p className="contact-intro">下一段经历，从一次交流开始。</p>
          <h2>
            一起，
            <br />
            <span>把想法向前推进。</span>
          </h2>
          <div className="contact-email-row">
            <a className="contact-email" href={`mailto:${contact.email}`}>
              {contact.email}
              <Arrow />
            </a>
            <button
              className="copy-button"
              onClick={() => copy(contact.email, "邮箱")}
              aria-label="复制邮箱"
            >
              <Plus />
              复制邮箱
            </button>
          </div>
          <div className="contact-links">
            <a href={`tel:${contact.phone}`}>
              <small>电话</small>
              {contact.phone}
              <Arrow />
            </a>
            <a href={contact.github} target="_blank" rel="noreferrer">
              <small>代码与项目</small>GitHub
              <Arrow />
            </a>
            <a href={contact.douyin} target="_blank" rel="noreferrer">
              <small>内容与创作</small>抖音 / Dolla
              <Arrow />
            </a>
          </div>
          <div className="wechat-row">
            <div>
              <small>微信</small>
              <span>{contact.wechat}</span>
            </div>
            <button
              className="copy-button"
              onClick={() => copy(contact.wechat, "微信号")}
              aria-label="复制微信号"
            >
              <Plus />
              复制微信号
            </button>
          </div>
          <p role="status" className="copy-status">
            {feedback}
          </p>
        </div>
        <footer>
          <a className="wordmark" href="#home">
            ZFC<span>.</span>
          </a>
          <span>张方程 · 个人作品集</span>
          <a href="#home">
            回到顶部 <Chevron />
          </a>
        </footer>
      </div>
    </section>
  );
}

function App() {
  const motionRoot = useRef<HTMLDivElement>(null);
  usePortfolioMotion(motionRoot);
  const [projectId, setProjectId] = useState<string | null>(null);
  const selectedProject = projects.find((project) => project.id === projectId);
  return (
    <div className="portfolio-root" ref={motionRoot}>
      <GlowCursor suspended={projectId !== null} quality="low" />
      <a className="skip-link" href="#main">
        跳转到正文
      </a>
      <div className="opening-curtain" aria-hidden="true">
        <div className="opening-panel" />
        <div className="opening-lockup">
          <div className="opening-mark-mask"><span className="opening-mark">ZFC<span>.</span></span></div>
          <span className="opening-rule" />
          <span className="opening-caption">PERSONAL PORTFOLIO / 2026</span>
        </div>
      </div>
      <button className="opening-skip" type="button" data-skip-opening>跳过开场 ↗</button>
      <Header />
      <main id="main">
        <Hero suspended={projectId !== null} />
        <div className="content-surface">
          <ContentBackdrop suspended={projectId !== null} />
          <About />
          <Work onOpen={setProjectId} />
          <Strengths />
          <FieldNotes />
          <Contact />
        </div>
      </main>
      <ProjectDialog
        key={projectId}
        project={selectedProject}
        onClose={() => setProjectId(null)}
      />
    </div>
  );
}
export default App;
