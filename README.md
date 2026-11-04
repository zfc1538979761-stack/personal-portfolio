# 张方程个人作品集

React + Vite + TypeScript 单页作品集，第二轮本地预览，未部署上线。

## 2026-11-03 性能优化

- 户外照片使用 `public/media/display` 下的展示副本（最长1600×1800，WebP82）；45张的归属和顺序不变，图片放大仍使用原高清网页副本。`scripts/prepare_display_media.py` 可重建，`prepare_media.py` 已接入。人物介绍及Hero封面也使用展示副本，并预加载Hero封面。
- 原有6个视频网页副本约39.74MB→21.83MB，保留画幅、时长、帧率和已有音轨；增加约1.13MB的720p手机Hero。媒体带版本参数避免旧Range缓存混用，追加视频编码配置同步到`prepare_videos.py`。原始素材未修改；修改前网页媒体在`.checkpoints/performance-media-before.zip`。
- Hero离屏、后台、项目详情打开时暂停，回到首屏按用户的播放意图恢复；手动暂停不会被滚动恢复覆盖。项目视频使用`preload=none`、接近视口再挂载，关闭或换项后停止。
- `useNearViewport`延迟图库图片加载；桌面图库仍预解码当前与相邻照片，展示节点保持稳定。背景独立分包，离开Hero后才初始化；流体引擎到首次有效鼠标移动才初始化。
- Grainient上限30次绘制/秒，背景与流体输出画布各限制130万像素；保留原有流体模拟、配色和拖尾参数。背景不可见、后台及弹窗期间停止绘制，丢失GL上下文时保留静态渐变。光标定位层不降低精度。
- Header、六张倾斜卡片和光标共用一个passive滚动通知，每帧最多通知一次；闲置卡片不再逐次写样式。GSAP保留原入场/视差；现有刷新合并、一次性触发器及卸载清理保留。
- 同一本机窗口的首屏实际媒体请求8→4项，对应文件净体积约5.42→2.52MB；这是资源请求/文件体积对比，不是下载耗时或LCP提升。缓存命中与约1秒的rAF节流使本轮帧率样本无效，不据此报告FPS改善，也不替代此前流体性能预算未通过的记录。
- 新增`node scripts/verify-page-scroll.mjs`、`node scripts/verify-render-budget.mjs`。浏览器已检查390/1920视口无横向溢出、开场存在、Hero暂停/恢复、图库切图/高清放大、项目视频播放和关闭释放；弹窗期间背景draw计数保持不变，控制台无相关错误。完整GPU轨迹、弱网冷缓存LCP与跨设备实测尚未进行。

## 运行

本机 Node.js 24 已完成安装与构建验证。

```powershell
cd 'D:\zfc的个人作品集网站'
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

打开 http://127.0.0.1:5173/ 。构建：`npm run build`；静态检查：`npm run lint`；预览构建产物：`npm run preview -- --host 127.0.0.1`。

## 页面与编辑入口

顺序：首页 → 个人经历 → 精选项目 → 个人优势 → 户外影像手记 → 联系。

- `src/App.tsx`：页面组合、导航、视频和联系方式。
- `src/components/ProjectCover.tsx`、`usePointerTilt.ts`、`PointerTilt.css`：固定感应外框＋独立3D视觉层，GEO最大4°、两层20/40px景深与6/12px偏移；Dolla最大2°/6px偏移，与滚动视差分层。四张优势卡片最大2°并抬升4px，BorderGlow固定article感应、内部surface整体运动，边光共用一次归一化坐标。追随.35秒、离开.6秒，仅1024+fine hover非reduce启用；入场完成后响应，modal/blur/scroll/resize/offscreen清理，结束移除will-change。旧简单封面hover放大已替换，原布局/边光/内容/字体保留，无新依赖或WebGL。回滚检查点`.checkpoints/pointer-tilt-before.zip`。
- `src/components/GlowCursor.tsx`与`GlowCursor.css`：全站真实流体＋14×19px半透明短箭头（按最新反馈替代实心菱形），去掉尾柄、冰蓝填充不透明度28%、细雾白描边及轻暗影。箭头尖端准确对齐点击位置，不延迟跟随；悬浮轻放大1.12倍、按下.92倍，取消额外定位圆点。`glowFluid.ts`参数及低档真实流体保持：#79ADC7→#244257、亮度1.15、宽3px、消散1.2秒、glow1/hotspot.45/follow.6，背景/文字/照片强度1/.85/.7，180ms过渡，DPR1。WebGL失败仍保留短箭头，原生指针恢复规则保持。此轮仅指针形态调整，前述性能数据为流体圆环版本的历史测量，未重测帧率。
- 光标只在>760px、可悬浮细指针、非减少动态效果模式创建；开场、任意dialog、fullscreen、编辑框/原生视频控件、键盘、失焦及后台恢复系统指针并暂停，下一次鼠标移动恢复。光效与定位独立层、pointer-events:none，不改页面布局，无点击爆光，不新增依赖。检查点`.checkpoints/fluid-ring-before.zip`；旧版`glowLight.ts`已不被正式组件引用。
- `src/components/SectionLabel.tsx`：共享章节标题，以英文作为视觉主标题；英文桌面最大152px、放松字距，中文章节名移至英文下方并放大至桌面26—30px、手机22px。保留原有中文介绍。首屏姓名缩小约9%、改为正字距并减弱阴影，英文姓名放在下方左对齐；检查点`.checkpoints/typography-before.zip`。
- `src/components/usePortfolioMotion.ts`、`PortfolioMotion.css`、`motionPolicy.ts`：GSAP + ScrollTrigger编排。首页约3.2秒opening，包含ZFC锁定、整屏遮罩上揭、雪山归位、姓名分字压缩/3D复位及导航、文案、按钮接力；紧凑屏约2.4秒。滚动、按键、点击或“跳过开场”均可立即完成，深链接和恢复滚动跳过；不锁滚动、不等待视频、不使用假加载。章节英文先行、中文与卡片随后stagger，照片遮罩揭幕，桌面Dolla封面有轻微视差。手机关闭视差/文字3D，减少动态效果直接显示。完成后清理变换与will-change，跨断点保留已播放记录；与图库和边光使用不同动画层，不增加依赖。检查点：`.checkpoints/editorial-motion-before.zip`。
- `src/components/BorderGlow.tsx`、`BorderGlow.css`：四张优势卡片使用清晰的冰蓝方向边光，按用户反馈提高蓝色饱和度与边缘亮度，光晕范围保持12px，保留深灰底色、字号和排版。无内部染色、入场扫光、翻转或自动循环；指针更新每帧最多一次，离开和卸载清理rAF。760px以下、无悬浮/粗指针及减少动态效果模式保留普通细边框，不新增依赖或WebGL画布。检查点：`.checkpoints/border-glow-before.zip`。
- `src/content.ts`：项目说明、联系方式、四项优势和图片／视频分组。
- `src/video-data.ts`：追加的4个户外视频，按用户提供顺序排列；加上原雪山片段共5项。
- `src/media-data.ts`：确认的11个地点45张照片、13条作品记录、8张GEO历史画面。
- `src/components/MediaGallery.tsx`：横向图库、原生播放器、指标摘要和图片放大；按需加载当前与相邻图片。
- `src/components/ProjectDialog.tsx`：原生 dialog 项目详情，支持 Esc、图片切换和关闭后焦点恢复。
- `src/components/FieldNotes.tsx`：11个地点入口；桌面使用地点内部的DepthCarousel层叠图库，760px及以下使用现有滑图，切换地点或布局回到首图。
- 地点切换由 `src/components/useChapterTransition.ts` 协调：先预加载并解码目标首图，再以0.22秒退场、0.34秒入场进行7度景深侧转；照片区域独立变换，标题和操作栏不旋转。手机使用总计180ms淡入淡出，减少动态效果直接切换。目录立即响应，标题、首图、计数在替换时同步；连续点击只保留最新选择，切回当前地点平滑归位。转场期间图库inert，目录仍可操作。加载失败保留旧图并允许重试；提示为覆盖层，不撑开布局。窗口缩放中断转场并恢复最终选择；如首图仍未加载则等待解码后直接显示，避免空白。
- `ChapterPhotoStage.tsx` 与 `chapterStageContext.ts` 仅向户外手记图库提供独立照片动画层，项目视频及其他图库不创建额外动画容器。`chapterImage.ts` 的预加载、取消清理、超时和失败后重试由 `node scripts/verify-chapter-image.mjs` 验证。检查点：`.checkpoints/chapter-transition-before.zip`。
- `src/components/LineSidebar.tsx`、`LineSidebar.css`：行走的章节采用冰蓝线条刻度、编号与鼠标靠近位移反馈，受控选择与右侧图库同步；900px及以下回退为横向地点列表，保留张数和键盘选择。动画闲置时停止，减少动态效果模式不位移或缩放。
- `src/components/DepthCarousel.tsx`、`DepthCarousel.css`：沿用React Bits层叠风格，舞台高度固定为视口72%（560—900px）加50px；每张前景照片独立保留原比例及尺寸，后方最多3张窄幅预览独立裁切。按钮切图约450ms，仅动画transform/opacity，无动态模糊或宽高插值；已就绪图片节点保留至离开当前地点，退场时不移除图片。支持水平跟手拖动、方向性甩动、首尾阻尼和120—420ms回弹收尾；快速输入以最后选择为准。仅预加载/解码当前地点相邻照片，失败保留旧图并支持重试，等待期间旧图平滑归位。减少动态效果直接切换。原章节侧转、放大、手机图库与背景保留，无新增依赖。
- `depthLayout.ts`与`depthGesture.ts`分别负责固定舞台/原比例布局和手势阈值。运行 `node scripts/verify-depth-layout.mjs`、`node scripts/verify-depth-gesture.mjs` 验证45张照片×3种尺寸下舞台不随照片变化、原比例、边界及收尾时长。修改前检查点为`.checkpoints/smooth-gallery-before.zip`。性能采样临时导入已从正式源码移除。
- `src/components/AccordionGallery.tsx`、`AccordionGallery.css`、`accordionLayout.ts`：保留的上一版手风琴实现，目前未被页面引用。
- `src/App.css`、`src/index.css`：统一配色、1700px 版心、桌面与手机适配、减少动态效果适配。
- `src/components/Grainient.tsx`、`Grainient.css`：基于用户提供的React Bits组件，头图下方使用炭黑、深岩蓝与低饱和灰蓝的流动颗粒背景；画布仅占一个视口，暗色遮罩保持可读性。不可见/后台时暂停，项目打开时停止持续动画，跟随减少动态效果偏好，WebGL不可用时使用静态渐变。未增加依赖。
- `public/media`：实际被网页使用的压缩媒体副本；原素材保持不变。

## 内容与素材边界

仅使用用户提供的真实影像和原项目历史录屏截帧。原文件保留，仅处理网站副本；有ICC配置的图片转换为sRGB，不额外增艳或降低饱和度。

头像从用户指定的通用版简历中提取。概览为2000+粉丝、30万+账号获赞、170万+单条播放，来源为本人提供的账号后台截图，非实时更新。13条点赞超过1000的作品按点赞量降序展示，指标按截图精度呈现。

GEO图库为2026-08-26原项目历史录屏的8张实际界面，保留当时业务值、日期和状态，移除旧Mock图片。2026-08-21的真实发布与资金试跑记录单独说明，不与录屏中的待人工订单混同，不推算客户、收入或AI收录提升。GitHub仍链接现有公开代码；不接入或修改原GEO系统。

户外手记使用用户确认的11个地点45张照片，顺序及首图见 `docs/素材对应记录.md`。07、10不加入网站。地点顺序不代表出行时间。横竖照片均完整显示，不强制裁切。

Hero和项目播放器使用用户授权的剪映“6月1日”草稿雪山片段；草稿名与文件时间不是拍摄日期或地点依据。项目视频主动播放，切换分类或关闭详情后暂停卸载，保留原生进度、音量和全屏控件。

项目不接入真实 AI、媒体发布、订单、支付、统计追踪或外部表单。邮箱和电话为显式联系链接，不自动发送信息。

## 验证与维护

项目与优势3D验证（2026-11-03）：2560/1920/1440/390布局检查无横向溢出，优势surface与固定外框同尺寸，手机保持静态。`docs/pointer-tilt-checks.json`记录六个交互面均active=true、真实3D矩阵、外框尺寸稳定、离开后全部恢复none并清空will-change；GEO原截图rotateZ保留，实测层偏移-5.7/5.4/Z20和-11.4/10.8/Z40，优势抬升-4。键盘Enter打开项目，modal期间六层均归位，Escape关闭及Dolla视频播放readyState4/paused=false回归通过；正式页户外图库方向键2/4、图片放大/Escape亦通过。独立整体审查未发现明确生产阻断。减少动态效果经过策略/代码核验，未改变用户OS设置。

`docs/pointer-tilt-performance.json`为本机Edge有效前台1920×1080模拟视口、保持低档真实流体开启、相同项目与卡片路径的20秒×6交替三组结果。关闭/开启新增3D的P95中位数18.2→18.3ms（约+0.1ms）；>33ms慢帧比例中位数0.128%→0.068%。慢帧下降属于本轮采样波动，不宣称优化了旧流体问题；平均帧数为关闭约1569、开启约1458/20秒，亦表明新增效果并非零成本。不作跨设备或GPU性能保证。初次后台probe/失焦数据未用于结论，用户协助前台后重新完成。临时TiltQaPanel与入口已移除。实际演示截帧位于本会话visualizations/round2-preview的project-depth-1/2.jpg、strength-tilt-1.jpg；截图仅体现局部状态，完整动效以宽屏预览为准。

本轮流体圆环验证（2026-11-03）：Edge有效前台1920×1080，关闭/开启各20秒交替三组，中档与低档各完整执行一次；所有启用段确认engine=fluid。中档P95中位数12.2→18.2ms，慢帧（>33ms）0.074%→0.508%；低档12.2→18.2ms、0.075%→0.456%。两档均未达到P95增量≤4ms的预算，低档慢帧增幅仅0.38个百分点，保留低档真实流体交付，不称性能验收通过。原始结果见`docs/fluid-cursor-performance.json`；这是本机Edge/rAF帧间隔对照，不是GPU轨迹或跨设备承诺。

已实际检查1440/1920桌面与390手机：手机无画布、无隐藏系统箭头、无横向溢出；桌面恢复后engine=fluid。自测原始结果见`docs/fluid-cursor-pointer-checks.json`：hover/按下尺寸、编辑框原生指针、dialog开启/关闭恢复、模拟blur处理/恢复、真实WEBGL_lose_context后圆环定位均通过。另回归项目视频readyState4且播放、关闭后退出，图库方向键2/4、真实拖动3/4、照片放大/Escape以及系统指针恢复；控制台无相关warn/error。流体连续效果截图存于本会话visualizations的round2-preview/fluid-ring-frame-1.jpg和-2.jpg。减少动态效果经策略测试/代码检查，未更改用户OS偏好；未单独执行原生全屏及OS后台切换验收。临时QA面板/入口已移除。

上一轮历史记录（已由本轮结果替代）：曾因窗口节流和控制连接问题拿不到有效采样，当时临时默认轻量光点。本轮在用户协助将窗口置于前台后取得有效对照，并按最新指令恢复真实流体，不沿用上一轮的保守光点默认。

本轮动效通过构建、静态检查、`verify-motion-policy.mjs`及现有内容/图库布局/手势/图片加载核验。浏览器检查1440、1920、2560px桌面及390px手机，验证opening自然结束与Escape跳过、深链接、章节换行、已播放卡片跨断点不重播、图库切图/放大/Escape、视频播放/关闭卸载/焦点恢复与复制微信。控制台未发现相关错误。独立审查发现的卡片播放记录和共享触发器清理问题已修复复核。

性能边界：新增动画使用transform/opacity，无宽高逐帧动画、动态模糊、滚动劫持或新增WebGL；仅一个封面有滚动视差。未采集本轮GPU轨迹或设备间帧率对比，不承诺所有机器固定60fps。减少动态效果分支经过策略核验与代码审查，未切换用户系统偏好进行实际OS验证。刷新首页可重看完整opening，带章节锚点的链接直接进入内容。

运行 `node scripts/verify-content.mjs` 核验照片归属及顺序、13条作品、8张实际GEO画面和资源存在性。`scripts/prepare_media.py` 可根据本机原素材重建网页图片及 `docs/media-manifest.json`（原文件SHA-256、尺寸、色彩转换和截帧来源）。视频不由该脚本重编码。

修改前检查点：`.checkpoints/round2-before.zip`，含第二轮开始前的源码和媒体。原照片、视频、简历及原GEO系统不在修改范围内。

追加视频的网页副本与封面由 `scripts/prepare_videos.py` 生成，源文件哈希、时长与色彩转换记录见 `docs/video-manifest.json`。保留完整片段、音轨和16:9比例，仅当前视频加载；横向滑动、按钮及方向键切换，离开当前项自动暂停。IMG_7172为HLG/BT.2020素材，网页副本经过HDR到SDR/BT.709转换；其余保持SDR色彩。

