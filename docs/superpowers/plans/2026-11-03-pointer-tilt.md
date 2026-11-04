# 项目景深与优势卡片轻倾斜实施记录

执行用户批准方案：GEO4°、两层Z20/40及XY6/12；Dolla2°及XY6；优势2°/抬升4。追随.35秒，离开.6秒，无循环/弹跳。仅1024+细指针可hover且非reduce。独立容器、固定传感区域、边光复用坐标，不加依赖/WebGL。仅本地、不部署。

- [x] 检查代码与隔离边界，保存.checkpoints/pointer-tilt-before.zip；坐标/限制策略测试先RED。
- [x] 共享hook、项目景深容器、优势卡片可动视觉层及旧放大替换。
- [x] 布局、交互、有效前台3×20秒性能对比，背景/流体保持开启。
- [x] 独立整体审查、构建核验、截图与README。

Ruling: 项目没有Git，原路径修改并保存本轮文件检查点；不自动提交/推送。
Review: 一次独立整体审查未发现明确生产阻断；新scene与reveal/parallax/intro容器分离，CSS视觉类完整迁移，原栅格/字号/截图rotateZ保留。性能有效性需确认六个probe实际active=true且reset=true，前台采样所有段engine=fluid。
Checks: build/lint、pointer坐标/角度/景深限制、45照片/13记录/8GEO、固定图库舞台/拖动、opening/cursor策略通过。2560/1440/390/1920实测无横向溢出，四张优势surface高度与固定外框相同、手机transform=none。初次后台probe因1fps不用于动画启用结论，用户协助前台重新测量。
QA completed: 用户协助前台后六项probe全部active=true、尺寸稳定、reset=true；GEO层Z20/40、优势y=-4，原rotateZ保留。Enter打开GEO时6个scene全部none，Escape与Dolla视频ready4/paused=false验证通过。新效果仅宽屏鼠标启用；OS reduce未实际切换。
Performance: 1920×1080模拟视口有效前台20秒×6，所有段flow engine=fluid；P95中位数18.2→18.3ms，slow .128%→.068%，帧数关闭均1569/开启均1458，下降慢帧按波动解释，不宣称解决原流体开销。原始JSON已保存。临时QA入口移除，默认窗口已恢复。
