# 流体光标与圆环指针改进实施记录

依据用户批准方案：恢复真实流体；#79ADC7→#244257，intensity1.15/width3/linger1.2/glow1/hotspot.45/follow.6，medium DPR1；背景/文字/照片强度1/.85/.7，180ms过渡。定位核心3px，外环18px/hover28px/按下14px，80ms追随。暂停、原生控件、WebGL失败保持可用指针，不静默退化为细线。

- [x] 检查现状、原组件、暂停接口；策略新增测试先RED。
- [x] 参数对象、流体恢复、定位与光效独立层、自定义/原生指针交接。
- [x] 有效前台1920px，关闭/开启20秒交替三组；medium超预算则low重测，不换光点。两档P95预算均未通过，已记录。
- [x] 1440/1920/390、流动截图、原生指针恢复/编辑框/弹窗/图库/视频及构建检查。OS reduce/真实后台与原生fullscreen未实际切换，已标注。
- [x] 独立整体审查、修复、README和真实结果交付。

Ruling: 项目无Git，使用原工作目录和.checkpoints/fluid-ring-before.zip；不提交、推送或部署。
Ruling: 旧版light文件可保留历史但不再被正式组件引用；WebGL不可用只关闭流体，圆环仍可定位。
Review: 独立审查发现quality切换在同一canvas重建、旧引擎loseContext会影响新引擎；已以canvas key={quality}保证新上下文。性能面板新增启用段必须实际engine=fluid的有效性检查，防止把圆环降级误报流体通过。
Checks: 构建、lint、cursorPolicy（含80ms时间独立追随及18/28/14尺寸）、45张照片/13记录/8GEO内容、固定舞台、拖动阈值和opening策略均通过。
Browser: Edge实际读到1920×1080、engine=fluid、quality=medium、自定义指针active=true且html cursor=none。初次采样失焦/节流已判INVALID，用户随后协助切到前台，重新执行，不使用无效数据得出预算结论。
Performance: medium、low各6段20秒有效前台采样，所有流体段实际engine=fluid；low的P95 12.2→18.2ms，slow .075%→.456%，未过4ms预算。原始JSON已保存，不用无效结果凑通过。交付low，不换光点，不改背景。
QA: 前台动态截图确认流体扩散/余光/圆环。390无overlay/隐藏光标/横向溢出；1440重新进入engine=fluid low。指针probe通过（hover28、pressed14、input原生、dialog/blur暂停恢复、实际WebGL上下文丢失后圆环可用）；blur为事件模拟，非真实OS切换。原生视频播放和关闭、方向键和实际拖动切图、放大Escape通过。临时CursorQaPanel及App入口已移除。
