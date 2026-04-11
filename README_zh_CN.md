<!-- markdownlint-disable MD033 -->
<!-- markdownlint-disable MD041 -->
<!-- markdownlint-disable MD036 -->

<p align="center">
    <img src="https://github.com/Asianfleet/siyuan-plugin-texit/blob/main/asset/formula-enhance.png" alt="公式输入增强" width=100%/>
</p>

[English README](https://github.com/Asianfleet/siyuan-plugin-texit/blob/main/README.md) | [更新记录](https://github.com/Asianfleet/siyuan-plugin-texit/blob/main/CHANGELOG.md)

# TeXit-便捷 LaTeX 公式编辑

TeXit 是一个提升思源笔记的 LaTeX 公式编辑体验的插件：在思源的公式编辑面板中集成一个基于 MathLive 的所见即所得数学编辑器，同时保留原始 `textarea` 作为底层输入源，两者实时同步。实现用更直观、更接近数学排版思维的方式编辑公式。

## 功能特性

- 支持块级公式与多种行内公式编辑（例如与代码块、标签、链接等行内元素结合）
- 优雅适配思源主题配色、边框、菜单和弹层风格
- 中文环境下自动启用 MathLive 菜单与部分键盘文案的中文化
- 整体界面过渡自然

## 功能展示

### 基本输入

在上方 MathLive 可视化编辑区直接输入，下方原始 LaTeX 文本会实时更新。修改下方的 LaTeX，顶部可视化编辑区也会同步变化。输入 LaTeX 命令自动显示建议列表，切换时列表不闪动。

<p align="center">
    <img src="https://github.com/Asianfleet/siyuan-plugin-texit/blob/main/asset/example1.gif" style="border: 1px solid; border-radius: 8px" alt="功能展示" width=90%/>
</p>

在思源中输入公式块，焦点自动移动到公式编辑器内部。全程手不离开键盘。

<p align="center">
    <img src="https://github.com/Asianfleet/siyuan-plugin-texit/blob/main/asset/example2.gif" style="border: 1px solid; border-radius: 8px" alt="功能展示" width=90%/>
</p>

通过菜单修改字体样式、公式颜色和背景色。

<p align="center">
    <img src="https://github.com/Asianfleet/siyuan-plugin-texit/blob/main/asset/example3.gif" style="border: 1px solid; border-radius: 8px" alt="功能展示" width=90%/>
</p>

更多功能详见 [Mathlive 文档](https://mathlive.io/mathfield/).

### 中文支持

当思源界面语言为 `zh_CN` 时，插件会自动：

- 将 MathLive 的常用菜单翻译为中文
- 将部分虚拟键盘提示文案翻译为中文
- 保持英文环境下的默认行为

## 致谢

- [MathLive](https://mathlive.io/)
- [思源笔记](https://github.com/siyuan-note/siyuan)

## 赞赏作者

<p align="center">
    <img src="https://github.com/Asianfleet/siyuan-plugin-texit/blob/main/asset/donate.jpg" alt="赞赏作者" width=50%/>
</p>
<p align="center">如果你喜欢这个插件，可以赞赏一下作者嗷~ :D</p>
