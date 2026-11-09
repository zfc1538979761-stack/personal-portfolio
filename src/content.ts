import { creatorInvitation, dollaPerformanceRecords } from "./dolla-evidence";
import { accountEvidence, geoEvidence } from "./media-data";
import type { Media } from "./types";
import { additionalOutdoorVideos } from "./video-data";
export const contact = {
  email: "zfc1538979761@gmail.com",
  phone: "18305274548",
  wechat: "Z-Cheng-702",
  github: "https://github.com/zfc1538979761-stack/geo-saas-portfolio",
  douyin: "https://v.douyin.com/ndpsOqGOO1g/",
};
export type Project = {
  id: string;
  title: string;
  type: string;
  summary: string;
  highlight?: string;
  tags: string[];
  period: string;
  role: string;
  intro: string;
  details: { title: string; body: string }[];
  media: Media[];
  groups?: { id: string; label: string; items: Media[] }[];
  note: string;
  url: string;
  linkLabel: string;
};
const outdoorVideo: Media = {
  id: "snow-video",
  kind: "video",
  src: "/media/outdoor-snow.mp4?v=20261103",
  poster: "/media/hero-poster.jpg",
  width: 1920,
  height: 1080,
  caption: "雪山徒步 · 视频作品",
};
const outdoorVideos: Media[] = [outdoorVideo, ...additionalOutdoorVideos];
const dollaRecordCount = dollaPerformanceRecords.length;
export const creatorStatus = "大疆 Osmo 签约创作者";

export const projects: Project[] = [
  {
    id: "geo",
    title: "GEO 企业内容运营 SaaS",
    type: "AI APPLICATION / PRODUCT",
    summary:
      "把初步业务方案落实为可运行系统，连接企业资料、AI内容生产、媒体目录与订单财务流程。",
    tags: ["独立开发与落地", "AI工具应用", "上游API接入", "测试与交付"],
    period: "2026.07 — 2026.08",
    role: "需求落实、前后端开发、数据库设计、接口联调、测试与交付",
    intro:
      "在负责人提供的初步需求、参考方案和业务思路基础上，使用AI工具辅助，独立完成项目侧系统开发与落地。把企业内容运营的业务流程转化为前端页面、后端服务、数据库结构和可追踪的任务与订单记录。",
    details: [
      {
        title: "把业务目标落到系统里",
        body: "落实企业资料、知识素材、问题审核、目标答案、内容生成与文章版本等功能。将需求拆成可实现的步骤，串联内容生产和后续业务操作。",
      },
      {
        title: "连接真实接口与业务流程",
        body: "接入公司提供的AI及媒体上游接口，完成请求适配、状态映射、异步任务、失败处理，以及订单和钱包的业务联调。原项目留有真实视频发布与资金流程试跑记录。",
      },
      {
        title: "用验证推动交付",
        body: "检查多租户隔离、任务与订单幂等、余额冻结及扣款/解冻等边界。整理回归验证、运行说明和交付资料，保留异常及未完成能力的真实状态。",
      },
    ],
    media: geoEvidence,
    note: "画面取自2026年8月26日原项目历史录屏，保留当时实际业务数值与状态。2026年8月21日验收记录另有真实视频发布、扣款5.40元及撤稿解冻9.00元的证据；与录屏中“待人工”的订单不是同一条记录。这些是开发与试跑成果，不代表商业客户、营收或AI收录提升。",
    url: contact.github,
    linkLabel: "查看公开代码版本",
  },
  {
    id: "dolla",
    title: "Dolla · 户外内容创作",
    type: "CONTENT / OUTDOORS",
    summary:
      "把户外经历转化为内容，独立完成创作、发布、数据复盘，并在合作和咨询中实践用户沟通与转化。",
    highlight: `${dollaRecordCount} 条千赞作品记录 · ${creatorStatus}`,
    tags: ["内容策划", "拍摄与剪辑", "数据复盘", "用户转化"],
    period: "2025年9月起系统运营",
    role: "账号独立运营、内容制作、数据复盘与用户沟通",
    intro:
      "从前期户外记录到持续运营，独立负责账号定位、选题、拍摄、剪辑、文案和发布。结合播放、点赞、收藏与用户反馈复盘内容，并将内容连接到产品合作、路线咨询和微信沟通。",
    details: [
      {
        title: "完整的内容生产流程",
        body: "从实际行程和素材中寻找选题，完成画面筛选、节奏剪辑与文案表达。独立推进内容从想法、拍摄到最终发布，而不只负责其中一个环节。",
      },
      {
        title: "用后台数据检验表达",
        body: `结合播放、点赞、收藏和用户反馈复盘内容。本页收录 ${dollaRecordCount} 条点赞超过 1,000 的作品后台记录。`,
      },
      {
        title: "理解需求与合作转化",
        body: "承接户外产品置换及佣金合作，通过微信承接咨询，介绍路线和户外俱乐部活动，实践需求识别、跟进沟通与代理成交。2025年9月前的作品属于前期创作。",
      },
    ],
    media: [...outdoorVideos, ...accountEvidence, ...dollaPerformanceRecords, creatorInvitation],
    groups: [
      { id: "videos", label: "视频作品", items: outdoorVideos },
      { id: "profile", label: "账号主页", items: accountEvidence },
      {
        id: "performance",
        label: `作品后台记录 · ${dollaRecordCount} 条`,
        items: dollaPerformanceRecords,
      },
      { id: "invitation", label: "创作者邀请", items: [creatorInvitation] },
    ],
    note: "数据来自本人提供的抖音账号与作品后台截图，按点赞量降序展示，非实时更新；不同作品的统计时点可能不同。保留原始指标及发布日期，不据此推算商业收入。",
    url: contact.douyin,
    linkLabel: "访问抖音主页",
  },
];
export const strengths = [
  {
    title: "AI应用与落地",
    description:
      "将ChatGPT、Codex用于需求拆解、功能实现、问题定位和回归验证。能围绕业务目标使用工具，把初步想法转化为可运行、可检查的系统，并跟进实现过程中的问题与验证结果。",
    evidence: "经历依据 / GEO SaaS前后端开发、API接入与测试交付",
  },
  {
    title: "自媒体与内容运营",
    description:
      "独立完成账号定位、选题、拍摄、剪辑、发布与复盘。结合后台播放、点赞、收藏和用户反馈调整表达，既关注内容本身，也关注它是否被看见、理解和回应。",
    evidence: `经历依据 / Dolla独立运营 · 单条作品播放170万+ · ${dollaRecordCount} 条千赞作品记录`,
  },
  {
    title: "商业思维与用户转化",
    description:
      "关注内容如何连接真实用户需求与合作机会。在户外产品置换、佣金合作、路线咨询和微信承接中，实践需求识别、沟通跟进与代理成交，理解从内容触达到用户行动的路径。",
    evidence: "经历依据 / 产品合作、路线咨询与代理转化实践",
  },
  {
    title: "项目推进与沟通",
    description:
      "把模糊需求拆成可执行步骤，持续跟进接口联调、异常处理、测试和交付。在项目与用户沟通中核对需求、解释问题并推进下一步；英语基础支持资料阅读和继续学习。",
    evidence: "经历依据 / SaaS交付与用户咨询 · CET-4 506 · CET-6 481",
  },
];
