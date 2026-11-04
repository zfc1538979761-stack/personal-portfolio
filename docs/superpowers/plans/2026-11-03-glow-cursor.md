# 全站冰蓝轻量光标实施记录

用户批准的方案：低档流体、DPR1，冰蓝#b4dbe7、intensity .65、trailWidth 1.5、linger .45、glow .45、hotspot .25；全站统一、依内容平滑减弱，不隐藏系统指针。不增加依赖、不改原始素材、不部署。

- [x] 阅读原组件及当前弹窗/背景实现；策略测试先RED。
- [x] 固定视口独立层、流体TypeScript移植、轻量后备、生命周期与暂停。
- [ ] 1920px、20秒×3组对照；p95增量>4ms或慢帧占比增量>5个百分点则交付光点。
- [ ] 桌面/手机、开场/弹窗/键盘/后台、视频/图库回归；构建/lint/核验。
- [x] 一次独立整体代码审查、修复及README；截图受阻。

Ruling: 当前项目没有Git仓库，直接在用户指定目录修改；检查点仅保存本轮会改的现有App.tsx/README。不建立另一份运行站点。
Ruling: 原组件的enabled只停止注入光，不停止GPU绘制；新增明确stop/dispose，暂停时取消rAF并清空，恢复等待下一次移动。
Ruling: 不把原组件容器包在整张长页面上，使用固定视口，避免巨大GPU纹理和影响sticky/fixed布局。
Review: 独立审查发现初次FBO分配失败时监听/observer先注册、工厂却未返回disposer的泄漏；已将初次resize/blank移到回调注册之前，失败由调用方loseContext统一释放GPU资源。
Blocked QA: IAB控制连接报browser.user unavailable。Edge实际1920×1080运行fluid，但首次off/fluid采样20秒各仅20帧，P95 1006.6/1005.8ms、慢帧100%，严重节流、不可用于预算判断。尝试前台Edge时Computer Use因无法可靠确认URL强制停止，本轮不再操作浏览器。
Ruling: 无有效对比时保守交付light默认，不声称流体版预算通过或失败。保留已移植流体按需模块供后续验证，不改背景。临时CursorBench及App入口已移除；布局/截图/真实交互性能验收明确未完成。
