import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { ImageMedia, Media } from "../types";
import { Arrow, Plus, Play, Pause } from "./Icons";
import { ChapterPhotoStage } from "./ChapterPhotoStage";
import { useNearViewport } from './useNearViewport';

function MediaVideo({ item }: { item: Extract<Media, { kind: "video" }> }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const [fullscreenError, setFullscreenError] = useState(false);
  useEffect(() => {
    const element = video.current;
    const pauseHidden = () => { if (document.hidden) element?.pause(); };
    document.addEventListener('visibilitychange', pauseHidden);
    return () => {
      document.removeEventListener('visibilitychange', pauseHidden);
      element?.pause();
    };
  }, []);
  const toggle = () => {
    if (!video.current) return;
    if (video.current.paused)
      void video.current.play().catch(() => setError(true));
    else video.current.pause();
  };
  return (
    <div className="gallery-video">
      <video
        ref={video}
        controls
        playsInline
        preload="none"
        poster={item.poster}
        aria-label={item.caption}
        onPlay={(event) => {
          setPlaying(true);
          document.querySelectorAll("video").forEach((other) => {
            if (other !== event.currentTarget) other.pause();
          });
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setError(true)}
      >
        <source
          src={item.src}
          type="video/mp4"
          onError={() => setError(true)}
        />
      </video>
      <div className="video-actions">
        <button
          className="video-action"
          onClick={toggle}
          disabled={error}
          aria-label={playing ? "暂停作品视频" : "播放作品视频"}
        >
          {playing ? <Pause /> : <Play />}
          {playing ? "暂停视频" : "播放视频"}
        </button>
        <button
          className="video-action"
          onClick={() => {
            setFullscreenError(false);
            void video.current
              ?.requestFullscreen()
              .catch(() => setFullscreenError(true));
          }}
          aria-label="全屏查看作品视频"
        >
          全屏查看
        </button>
      </div>
      {fullscreenError && (
        <p role="status">
          当前浏览器未允许全屏，可单独打开视频查看：
          <a href={item.src} target="_blank" rel="noreferrer">
            打开视频
          </a>
        </p>
      )}
      {error && (
        <p role="status">
          此视频暂时无法播放，可尝试刷新页面或
          <a href={item.src} target="_blank" rel="noreferrer">
            单独打开视频
          </a>
          。
        </p>
      )}
    </div>
  );
}

export function ImageLightbox({
  item,
  onClose,
}: {
  item: ImageMedia;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [originalSize, setOriginalSize] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const before = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      before?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="image-lightbox"
      aria-label={`${item.caption}，放大查看`}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
    >
      <div className="lightbox-toolbar">
        <span>{item.caption}</span>
        <div>
          <button onClick={() => setOriginalSize(!originalSize)}>
            {originalSize ? "适应屏幕" : "原尺寸查看"}
          </button>
          <button
            className="dialog-close"
            onClick={onClose}
            aria-label="关闭放大图片"
          >
            <Plus />
          </button>
        </div>
      </div>
      <div className={`lightbox-body ${originalSize ? "original-size" : ""}`}>
        <img src={item.src} alt={item.alt} />
      </div>
    </dialog>
  );
}

export function MediaGallery({
  items,
  label,
  photoId,
}: {
  items: Media[];
  label: string;
  photoId?: string;
}) {
  const [active, setActive] = useState(0);
  const host = useRef<HTMLDivElement>(null);
  const near = useNearViewport(host);
  const [zoom, setZoom] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const lastWheel = useRef(0);
  const delta = useRef(0);
  const lastInput = useRef(0);
  const current = items[active];
  const select = (index: number) => {
    if (index < 0 || index >= items.length || index === active) return;
    setZoom(false);
    setActive(index);
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (
      event.button !== 0 ||
      (event.target instanceof Element &&
        event.target.closest("video, button, a"))
    )
      return;
    start.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (start.current) {
      const dx = start.current.x - event.clientX,
        dy = start.current.y - event.clientY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy))
        select(active + Math.sign(dx));
    }
    start.current = null;
  };
  if (!current) return null;
  return (
    <div
      className="media-gallery"
      ref={host}
      aria-label={label}
      data-photo-group={photoId}
    >
      <div className="gallery-toolbar">
        <span>{label}</span>
        <span className="gallery-counter" aria-live="polite">
          {active + 1} / {items.length}
        </span>
      </div>
      <ChapterPhotoStage>
      <div
        className="gallery-viewport"
        tabIndex={0}
        role="region"
        aria-label={`${label}，左右方向键切换`}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            select(active + (event.key === "ArrowRight" ? 1 : -1));
          }
        }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          start.current = null;
        }}
        onWheel={(event) => {
          if (
            Math.abs(event.deltaX) <= Math.abs(event.deltaY) ||
            Math.abs(event.deltaX) < 4
          )
            return;
          const now = Date.now();
          if (now - lastInput.current > 250) delta.current = 0;
          lastInput.current = now;
          if (now - lastWheel.current < 600) return;
          delta.current += event.deltaX;
          if (Math.abs(delta.current) > 80) {
            select(active + Math.sign(delta.current));
            lastWheel.current = now;
            delta.current = 0;
          }
        }}
      >
        <div
          className="gallery-track"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {items.map((item, index) => (
            <div
              className={`gallery-slide ${active === index ? "is-active" : ""}`}
              key={item.id}
              aria-hidden={index !== active}
            >
              <div className="gallery-stage">
                {near && item.kind === "image" && Math.abs(index - active) <= 1 ? (
                  <img
                    src={item.displaySrc ?? item.src}
                    alt={item.alt}
                    width={item.width}
                    height={item.height}
                    draggable={false}
                    decoding="async"
                    loading={active === index ? "eager" : "lazy"}
                  />
                ) : near && item.kind === "video" && active === index ? (
                  <MediaVideo item={item} />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
      </ChapterPhotoStage>
      {current.kind === "image" && current.metrics && (
        <div className="record-metrics">
          <div>
            <strong>{current.metrics.plays}</strong>
            <span>播放量</span>
          </div>
          <div>
            <strong>
              {current.metrics.likesLabel ??
                current.metrics.likes.toLocaleString("zh-CN")}
            </strong>
            <span>点赞量</span>
          </div>
          <div>
            <strong>{current.metrics.collections}</strong>
            <span>收藏量</span>
          </div>
        </div>
      )}
      <div className="gallery-caption">
        <div>
          <p>{current.caption}</p>
          {current.sourceNote && <small>{current.sourceNote}</small>}
        </div>
        <div className="gallery-buttons">
          {current.kind === "image" && (
            <button
              className="enlarge-button"
              aria-label={`放大查看${current.caption}`}
              onClick={() => setZoom(true)}
            >
              放大查看 <Plus />
            </button>
          )}
          <button
            className="gallery-prev"
            aria-label={`${label}上一项`}
            disabled={active === 0}
            onClick={() => select(active - 1)}
          >
            <Arrow />
          </button>
          <button
            className="gallery-next"
            aria-label={`${label}下一项`}
            disabled={active === items.length - 1}
            onClick={() => select(active + 1)}
          >
            <Arrow />
          </button>
        </div>
      </div>
      {zoom && current.kind === "image" && (
        <ImageLightbox item={current} onClose={() => setZoom(false)} />
      )}
    </div>
  );
}
