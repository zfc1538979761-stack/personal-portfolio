import { useEffect, useRef, useState } from "react";
import type { Project } from "../content";
import { Arrow, Plus } from "./Icons";
import { MediaGallery } from "./MediaGallery";

export function ProjectDialog({
  project,
  onClose,
}: {
  project?: Project;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [group, setGroup] = useState("videos");
  useEffect(() => {
    const element = dialog.current;
    if (!project || !element) return;
    const before = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.querySelectorAll("video").forEach((video) => video.pause());
      element.close();
      document.body.style.overflow = overflow;
      before?.focus({ preventScroll: true });
    };
  }, [project]);
  if (!project) return null;
  const items = project.groups
    ? (project.groups.find((item) => item.id === group)?.items ??
      project.groups[0].items)
    : project.media;
  return (
    <dialog
      ref={dialog}
      className="project-dialog"
      aria-labelledby="project-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (document.fullscreenElement) {
          void document.exitFullscreen();
          return;
        }
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-shell">
        <div className="dialog-top">
          <span>项目与实践 / {project.type}</span>
          <button
            className="dialog-close"
            aria-label="关闭项目详情"
            onClick={onClose}
          >
            <Plus />
          </button>
        </div>
        <div className="dialog-body">
          <span className="project-type">{project.period}</span>
          <h2 id="project-dialog-title">{project.title}</h2>
          <p className="dialog-role">本人职责 / {project.role}</p>
          <p className="dialog-intro">{project.intro}</p>
          <div className="dialog-details">
            {project.details.map((detail) => (
              <div key={detail.title}>
                <h3>{detail.title}</h3>
                <p>{detail.body}</p>
              </div>
            ))}
          </div>
          <a
            className="button button-light"
            href={project.url}
            target="_blank"
            rel="noreferrer"
          >
            {project.linkLabel}
            <Arrow />
          </a>
          <p className="project-disclosure">{project.note}</p>
          {project.groups && (
            <div
              className="gallery-tabs"
              role="group"
              aria-label="户外项目内容分类"
            >
              {project.groups.map((item) => (
                <button
                  key={item.id}
                  className={item.id === group ? "active" : ""}
                  aria-pressed={item.id === group}
                  onClick={() => setGroup(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          <MediaGallery
            key={project.id + group}
            items={items}
            label={
              project.groups
                ? (project.groups.find((item) => item.id === group)?.label ??
                  project.title)
                : "GEO原项目历史画面"
            }
          />
        </div>
      </div>
    </dialog>
  );
}
