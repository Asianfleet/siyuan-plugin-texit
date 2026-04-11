<!-- markdownlint-disable MD033 -->
<!-- markdownlint-disable MD041 -->
<!-- markdownlint-disable MD036 -->

<p align="center">
    <img src="https://github.com/Asianfleet/siyuan-plugin-texit/blob/main/asset/formula-enhance.png" alt="FormulaEnhance" width=100%/>
</p>

[中文 README](https://github.com/Asianfleet/siyuan-plugin-texit/blob/main/README_zh_CN.md) | [Changelog](https://github.com/Asianfleet/siyuan-plugin-texit/blob/main/CHANGELOG.md)

# TeXit - convenient LaTeX formula editing

TeXit is a plugin that improves the formula editing experience in SiYuan: it integrates a MathLive-powered WYSIWYG math editor into SiYuan's formula editing panel while keeping the original `textarea` as the underlying input source. Both stay synchronized in real time, making formula editing more intuitive and closer to the way mathematical notation is naturally written and typeset.

## Features

- Supports block formulas and multiple inline formula editing scenarios, including combinations with inline elements such as code spans, tags, and links
- Adapts cleanly to SiYuan themes, including colors, borders, menus, and popup styles
- Automatically enables Chinese localization for MathLive menus and parts of the virtual keyboard text in Chinese environments
- Smooth and natural interface transitions

## Feature Showcase

### Basic input

Type directly in the MathLive visual editor at the top. The raw LaTeX text below updates in real time. If you edit the LaTeX below, the visual editor above stays in sync as well. When you type LaTeX commands, the suggestion list appears automatically and does not flicker while switching.

<p align="center">
    <img src="https://github.com/Asianfleet/siyuan-plugin-texit/blob/main/asset/example1.gif" style="border: 1px solid; border-radius: 8px" alt="Feature demo" width=90%/>
</p>

When you insert a formula block in SiYuan, focus automatically moves into the formula editor so you can keep your hands on the keyboard throughout the workflow.

<p align="center">
    <img src="https://github.com/Asianfleet/siyuan-plugin-texit/blob/main/asset/example2.gif" style="border: 1px solid; border-radius: 8px" alt="Feature demo" width=90%/>
</p>

Use the menu to change font style, formula color, and background color.

<p align="center">
    <img src="https://github.com/Asianfleet/siyuan-plugin-texit/blob/main/asset/example3.gif" style="border: 1px solid; border-radius: 8px" alt="Feature demo" width=90%/>
</p>

For more features, see the [MathLive documentation](https://mathlive.io/mathfield/).

### Chinese support

When the SiYuan interface language is set to `zh_CN`, the plugin automatically:

- Translates common MathLive menu items into Chinese
- Translates parts of the virtual keyboard prompt text into Chinese
- Preserves the default behavior in English environments

## Acknowledgements

- [MathLive](https://mathlive.io/)
- [SiYuan](https://github.com/siyuan-note/siyuan)

## Appreciate the Author

<p align="center">
    <img src="https://github.com/Asianfleet/siyuan-plugin-texit/blob/main/asset/donate.jpg" alt="Support the author" width=50%/>
</p>
<p align="center">If you like this plugin, you can support the author with a donation. :D</p>
