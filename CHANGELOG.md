# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## v2.3.0
### Added
- Support for aborting and removing episodes from state database

### Fixed
- Missing `jQuery` provider in webpack (only `$` was supported)
- Remove unused `copy-webpack-plugin` dependency left by accident
- Properly URI-encode show name
- Wait until registered before attempting to rejoin channels on IRC network

### Changed
- Don't use eval'd sourcemaps in webpack
- Use formatted name instead of save-filename in UI
- Run frontend build in parallel
- Always attempt to rejoin once joined IRC channel on reconnection

## v2.2.0
### Added
- Listen for `!reload` and `!fetch` commands in IRC control channel

### Fixed
- Ensure 0% progress is always shown on active episodes

## v2.1.0
### Added
- Emit warning when connecting to IRC network over TLS without certificate verification
- Use webpack to bundle frontend assets
- Use jQuery to hide `raw json` container

### Fixed
- Strip colors and formatting from IRC messages for release matching

### Changed
- Remove external fonts
- Do not fail when requested IRC network does not exist or can not be connected to
- Various tweaks to logging messages
- Change default temporary directory to `/tmp/fetcher`
- Change default webserver port to `3004`

## v2.0.0
### Changed
- Initial TypeScript rewrite