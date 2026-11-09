import { performanceRecords } from "./media-data.ts";
import type { ImageMedia } from "./types";

const alashanRecord = {
  kind: "image",
  id: "performance-alashan",
  src: "/media/performance-alashan.webp",
  width: 1290,
  height: 2796,
  alt: "《苍天般的阿拉善》作品后台截图：12.1 万播放、1.3 万点赞、1,034 次收藏",
  caption: "《苍天般的阿拉善》",
  sourceNote: "2026-11-05 发布 · 1,582 次分享 · 158 条评论 · 数据来自抖音作品后台截图",
  metrics: {
    likes: 13000,
    likesLabel: "1.3万",
    plays: "12.1万",
    collections: "1,034",
  },
} satisfies ImageMedia;

export const dollaPerformanceRecords = [...performanceRecords, alashanRecord]
  .sort((a, b) => b.metrics.likes - a.metrics.likes);

export const creatorInvitation = {
  kind: "image",
  id: "dji-osmo-invitation",
  src: "/media/dji-osmo-invitation.webp",
  width: 1279,
  height: 948,
  alt: "大疆 Osmo 创作者计划邀请函的标题、邀请正文和落款",
  caption: "大疆 Osmo 创作者计划邀请函",
} satisfies ImageMedia;
