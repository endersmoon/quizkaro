# Local Reelgen Dependency Setup

This project uses `@reelgen/*` packages (a fork of Revideo/Motion Canvas), upgraded
from the unmaintained upstream (Vite 4 -> 6, 71 vulnerabilities -> 0).

## Packages

The `@reelgen/*` dependencies in `package.json`:

```json
"@reelgen/2d": "0.10.4",
"@reelgen/core": "0.10.4",
"@reelgen/ffmpeg": "0.10.4",
"@reelgen/renderer": "0.10.4",
"@reelgen/telemetry": "0.10.4",
"@reelgen/ui": "0.10.4",
"@reelgen/vite-plugin": "0.10.4"
```

## Key Differences from Upstream Revideo

| Dependency  | Upstream (npm) | Reelgen     |
| ----------- | -------------- | ----------- |
| Vite        | 4.5.2          | 6.4.1       |
| Vitest      | 0.34.6         | 3.2.4       |
| TypeScript  | 5.2            | 5.9.3       |
| ESLint      | 8.54           | 9.39.4      |
| Puppeteer   | 23.4           | 24.39.1     |
| Express     | 4.19           | 5.2.1       |
| Vulns       | 71 (2 critical)| 0           |

Additionally, pure backend logic (FFmpeg, export, WASM) was extracted from Vite
plugins into a standalone HTTP+WS server, decoupled from the build tool.

## Requirements

- Node 20+
- Vite 6+ in this project (set in devDependencies)
