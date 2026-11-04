# Editorial Portfolio Motion Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline; one independent review after implementation. Do not commit, push or deploy.

**Goal:** 将现有个人站升级为有完整opening和章节编排的创意机构风格动效。

**Architecture:** 复用GSAP及其已安装的ScrollTrigger；共享章节标题负责大英文版式，单独的页面动效hook负责opening/滚动编排。所有图库内部变换与新增页面外层变换隔离；新视觉样式独立CSS。

**Tech Stack:** React / TypeScript / Vite / GSAP + ScrollTrigger，无新增依赖。

**Spec / design:** 用户要求完整opening、遮罩/大位移/压缩归位、英文标题先行、卡片stagger、图片reveal/轻parallax、慢节奏且无弹跳。用户将英文层级选择交给设计判断，采用大英文主导、现有中文保留。

## Constraints and decisions
- 保留1700px版心、暗色/冰蓝配色、六模块顺序、真实内容和原素材，仅本地预览。
- Opening约3.2秒：ZFC视觉锁定→整屏遮罩上揭→雪山画面归位→姓名分字压缩/位移/3D复位→英文名、导航和行动按钮接力。移动端约2.4秒，强度下调。
- 滚动、Tab/Escape或点击控件立即完成开场；不锁滚动、不等待视频下载、不制造假加载百分比。深链接/恢复滚动位置跳过opening。
- 保留英文ABOUT / SELECTED WORK / WHAT I BRING / FIELD NOTES / GET IN TOUCH，作为章节视觉标题；中文正文层级保留。
- 章节英文遮罩大位移约1.3秒，中文标题随后进入；内容约1.15秒、卡片间隔0.14秒，按各组进入视口触发，每组仅播放一次。
- About照片和项目封面使用独立遮罩揭幕；仅Dolla封面增加约±3%轻parallax，不改户外手记照片/头像原比例。
- 不使用弹性缓动、大面积动态模糊、文字纹理WebGL或滚动劫持。减少动态效果直接显示；手机减少距离/3D及关闭parallax。
- 动画完成clearProps；仅活动时will-change；matchMedia/context局部清理，不kill其他图库动画。

## Review focus
1. StrictMode重复挂载不吞掉opening，卸载后不残留触发器/监听。
2. 深链接、快速滚动、键盘导航始终可读可操作，没有永久遮罩。
3. 断点变化时已播放内容不重新隐藏。
4. 新页面变换不覆盖图库、BorderGlow或封面hover的变换。
5. 手机/减少动态效果无溢出，图像最终完整复原。

## Tasks
- [x] Policy：新增src/components/motionPolicy.ts与scripts/verify-motion-policy.mjs，先验证深链接/滚动恢复/reduce/紧凑屏幕策略。
- [x] Markup：新增SectionLabel.tsx，共享英文视觉标题；修改App.tsx与FieldNotes.tsx接入，添加opening和图片专用动画层。
- [x] Motion：新增usePortfolioMotion.ts及PortfolioMotion.css；接入scoped context、matchMedia、opening和ScrollTrigger分组时间线。
- [x] QA：1440/1920/2560/390、opening/跳过/锚点、章节顺序、图片揭幕、卡片stagger、弹窗/图库/微信复制回归；构建、lint、内容及策略检查；独立审查一次。
- [x] Delivery：更新README与此清单，交付本地预览及opening/章节截图，说明实际性能测量边界。

## Execution ledger
- Baseline: GSAP 3.15已含ScrollTrigger；无Git仓库，检查点为.checkpoints/editorial-motion-before.zip。
- Ruling: 不引入平滑滚动库或固定滚动段落——保留原生滚动与HR快速阅读路径。
- Implementation: 策略先RED（模块尚未创建）后PASS；StrictMode重复挂载曾消耗opening，已改为区分实际断点重建与effect清理。浏览器捕捉到playing状态及姓名matrix3d，自然结束后无残留变换，Escape可立即跳过。
- Review: 独立审查发现桌面卡片分组与紧凑屏单卡记录未互通、journal共享触发器清理判断过早，已分别用播放记录映射及各自timeline进度修复，并经复核。
- Browser: 1440/1920/2560桌面、390手机无横向溢出；1920→900→1920已完成卡片保持可读。深链接跳过opening；野马海子方向键切至2/4、放大/Escape/焦点恢复通过。项目视频readyState=4且paused=false，关闭后dialog视频节点为0；微信复制出现成功提示。控制台无相关warn/error。
- Artifacts: round2-preview/editorial-opening.jpg、editorial-hero-final.jpg、editorial-work-final.jpg、editorial-mobile.jpg（位于本会话visualizations目录）。
- Boundary: 无本轮GPU性能轨迹或跨设备FPS结论；减少动态效果仅策略测试/代码检查，未更改用户OS设置。
