# Local Revideo Dependency Setup

This project uses a local upgraded fork of Revideo instead of the published npm
packages. The fork lives at `/Users/FA071872/revideo-main` and has been upgraded
from the unmaintained upstream (Vite 4 -> 6, 71 vulnerabilities -> 0).

## How It Works

The `@revideo/*` dependencies in `package.json` point to local tarballs via
`file:` protocol:

```json
"@revideo/2d": "file:../revideo-tarballs/revideo-2d-0.10.4.tgz",
"@revideo/core": "file:../revideo-tarballs/revideo-core-0.10.4.tgz",
"@revideo/ffmpeg": "file:../revideo-tarballs/revideo-ffmpeg-0.10.4.tgz",
"@revideo/renderer": "file:../revideo-tarballs/revideo-renderer-0.10.4.tgz",
"@revideo/telemetry": "file:../revideo-tarballs/revideo-telemetry-0.10.4.tgz",
"@revideo/ui": "file:../revideo-tarballs/revideo-ui-0.10.4.tgz",
"@revideo/vite-plugin": "file:../revideo-tarballs/revideo-vite-plugin-0.10.4.tgz"
```

Tarballs are stored at `/Users/FA071872/revideo-tarballs/`.

## Updating After Revideo Changes

When changes are made to the revideo fork:

```bash
# In /Users/FA071872/revideo-main
npx lerna run build
for pkg in core 2d vite-plugin ffmpeg renderer ui telemetry player player-react cli; do
  cd packages/$pkg && npm pack --pack-destination ~/revideo-tarballs && cd ../..
done

# Then in this project
npm install
```

## Key Differences from Upstream

The local fork includes these upgrades (see `revideo-main/PLAN.md` for details):

| Dependency  | Upstream (npm) | Local Fork  |
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
- The revideo-tarballs directory must exist at `~/revideo-tarballs/`
