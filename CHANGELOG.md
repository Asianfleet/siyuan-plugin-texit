# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.1] - 2026-04-11

### Added

- Better preservation of bold math styles such as `\boldsymbol` and `\bm` while editing formulas
- More complete test coverage for formula panel editing and synchronization scenarios

### Changed

- Improved how the formula panel keeps the visual editor and the underlying formula text in sync
- Updated the plugin version to `0.1.1`

### Fixed

- Fixed an issue where existing bold style wrappers could be lost after using some MathLive commands or switching editing modes
- Fixed cases where the formula shown in the editor and the actual saved formula text could get out of sync
- Reduced unnecessary follow-up synchronization after command-driven changes

## [0.1.0] - 2026-04-10

Initial release.

### Added

- Integrated a MathLive-powered WYSIWYG formula editor into SiYuan's LaTeX formula panel
- Kept the native `textarea` as the source of truth with real-time two-way synchronization
- Supported block formulas and multiple inline math editing scenarios
- Added automatic focus, smoother reveal animations, and improved formula panel interaction flow
- Added theme-aware styling for editor surface, menus, suggestion popups, borders, and colors
- Added Chinese localization for common MathLive menus and part of the virtual keyboard text
- Added mobile-oriented formula panel support and virtual keyboard behavior handling
- Added matrix border synchronization and related formula panel helpers
- Added formatting actions such as font style, formula color, background color, and clear-color menu support
- Added a settings panel and top-bar settings entry for formula panel behavior
- Added an option for manually closing the virtual keyboard
