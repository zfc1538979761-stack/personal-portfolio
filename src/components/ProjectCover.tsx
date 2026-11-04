import { useRef } from 'react';
import type { Project } from '../content';
import { Arrow } from './Icons';
import { usePointerTilt } from './usePointerTilt';
export function ProjectCover({project,index,tiltEnabled=true}:{project:Project;index:number;tiltEnabled?:boolean}) {
  const sensor=useRef<HTMLDivElement>(null),scene=useRef<HTMLDivElement>(null);
  usePointerTilt(sensor,scene,{kind:project.id==='geo'?'geo':'dolla',enabled:tiltEnabled});
  return (
              <div
                ref={sensor} className={`project-image media-reveal ${project.id === "geo" ? "geo-image" : "outdoor-image"}`}
              >
                <div className="project-motion-ink"><div ref={scene} className="project-tilt-scene">
                {project.id === "geo" ? (
                  <div className="screens-composition">
                    <img
                      className="screen-main" data-tilt-layer="back"
                      src="/media/geo-real-04-generated-article.webp"
                      alt="原GEO项目历史录屏中的文章与版本界面"
                      loading="lazy"
                    />
                    <img
                      className="screen-secondary" data-tilt-layer="front"
                      src="/media/geo-real-06-media-results.webp"
                      alt="原GEO项目历史录屏中的媒体目录"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="project-tilt-photo" data-tilt-layer="cover"><div className="project-parallax-plane">
                  <img
                    className="outdoor-cover"
                    src="/media/display/hero-poster.webp"
                    alt="本人户外视频中的雪山徒步画面"
                    loading="lazy"
                  />
                  </div></div>
                )}
                </div></div>
                <span className="project-index">0{index + 1}</span>
                <span className="project-open-circle">
                  <Arrow />
                </span>
                {project.id === "geo" && (
                  <span className="image-note">原项目历史录屏 · 2026.08</span>
                )}
                <div className="image-shutter" aria-hidden="true" />
              </div>
  );
}
