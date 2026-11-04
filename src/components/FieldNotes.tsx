import { useState, useSyncExternalStore } from "react";
import { destinations } from "../media-data";
import { MediaGallery } from "./MediaGallery";
import { DepthCarousel } from "./DepthCarousel";
import { LineSidebar } from "./LineSidebar";
import { ChapterStageContext } from "./chapterStageContext";
import { useChapterTransition } from "./useChapterTransition";
import { SectionLabel } from "./SectionLabel";

const chapterItems = destinations.map((place) => ({
  id: place.id,
  label: place.name,
  count: place.photos.length,
}));

function subscribeViewport(onChange: () => void) {
  const query = window.matchMedia("(max-width: 760px)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const readMobile = () => window.matchMedia("(max-width: 760px)").matches;
function subscribeCompact(onChange: () => void) {
  const query = window.matchMedia("(max-width: 900px)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const readCompact = () => window.matchMedia("(max-width: 900px)").matches;

export function FieldNotes() {
  const [active, setActive] = useState(0);
  const compact = useSyncExternalStore(
    subscribeCompact,
    readCompact,
    () => false,
  );
  const mobile = useSyncExternalStore(
    subscribeViewport,
    readMobile,
    () => false,
  );
  const transition = useChapterTransition(active, destinations);
  const destination = destinations[transition.display.index];
  const select = (index: number) => {
    if (index === active) return;
    setActive(index);
  };
  return (
    <section className="section journal wrap" id="journal">
      <SectionLabel number="04" english="FIELD NOTES">户外影像手记</SectionLabel>
      <div className="section-heading">
        <h2>
          走出去，
          <br />
          <span className="muted">看见更多可能。</span>
        </h2>
        <p>
          用脚步和镜头记录世界。
          <br />
          11个地点，45张真实影像。
        </p>
      </div>
      <div className="journal-layout">
        <aside className="journal-index">
          <span className="journal-volume">行走的章节</span>
          {compact ? (
            <div
              className="destination-list"
              role="group"
              aria-label="按地点浏览户外手记"
            >
              {destinations.map((place, index) => (
                <button
                  key={place.id}
                  className={active === index ? "active" : ""}
                  aria-pressed={active === index}
                  onClick={() => select(index)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {place.name}
                  <small>{place.photos.length}张</small>
                </button>
              ))}
            </div>
          ) : (
            <LineSidebar
              items={chapterItems}
              activeIndex={active}
              onItemClick={select}
            />
          )}
          <p>地点顺序不代表出行时间。</p>
        </aside>
        <div className="journal-viewer" data-chapter-phase={transition.phase} aria-busy={transition.busy}>
          <h3 className="destination-title">
            {destination.name}
            <span>{String(transition.display.index + 1).padStart(2, "0")} / 11</span>
          </h3>
          <p className="chapter-status" role="status">
            {transition.phase === "loading" && "正在准备下一章节…"}
            {transition.phase === "error" && <>
              {destinations[active].name}的照片暂时未能加载，当前照片已保留。
              <button type="button" onClick={transition.retry}>重试</button>
            </>}
          </p>
          <ChapterStageContext.Provider value={transition.refs}>
          <div inert={transition.busy}>
          {mobile ? (
            <MediaGallery
              key={`${destination.id}-mobile-${transition.display.epoch}`}
              items={destination.photos}
              label={`${destination.name}照片`}
              photoId={destination.id}
            />
          ) : (
            <DepthCarousel
              key={`${destination.id}-desktop-${transition.display.epoch}`}
              items={destination.photos}
              label={`${destination.name}照片`}
            />
          )}
          </div>
          </ChapterStageContext.Provider>
        </div>
      </div>
    </section>
  );
}
