# snapREC Studio — Screen & Webcam Studio Recorder

A modern, free, ad-free web screen recording studio with **genuine client-side MP4 export**. 
Built with **Next.js 13+ (App Router)**, **Tailwind CSS**, and **shadcn/ui**, statically exported (`next build` &rarr; `out/`) and ready for 1-click deployment to **GitHub Pages**.

---

## Key Features

- **Genuine Client-Side MP4 Export (H.264 / AAC)**: No backend server, no cloud compilation, no domain requirements, and zero waiting. Recordings play natively in QuickTime, Windows Media Player, iOS, Android, and PowerPoint.
- **Universal Format Support**: Switch easily between hardware-accelerated **MP4** and seekable **WebM (VP9/Opus)** with automatic duration correction.
- **Studio Recording Modes**:
  - **Screen + Webcam**: Composite your screen and camera together with customizable shapes, sizes, and positions.
  - **Screen Only**: Capture entire display, application windows, or browser tabs.
  - **Camera Only**: Record full-frame webcam videos.
  - **Audio Only**: Record microphone and system audio into high-fidelity voice notes.
- **Canvas Video Compositor**: Bakes your webcam overlay (Circle, Rounded, Square) directly into the recording video track at up to 60 FPS. Works even when recording single browser tabs or windows!
- **Stereo Audio Mixer**: Combines system audio and microphone with individual gain controls, volume sliders, and real-time dual VU audio level meters.
- **Non-Destructive Trimmer**: Trim start and end points with live timeline scrub preview before saving.
- **Session Takes Library**: Revisit, rename, review, and download multiple takes recorded during your session without losing previous takes.
- **Accessible & Responsive**: Dark and light modes via `next-themes`, full keyboard shortcuts (`Alt+R`, `Alt+P`, `Alt+S`), and shadcn/ui components.

---

## How It Solves the MP4 Problem Without a Domain or Server

### The Old Problem
Previously, client-side screen recorders in the browser had to use multi-threaded `ffmpeg.wasm` to produce MP4 files, which required `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin` HTTP response headers. Because **GitHub Pages does not allow custom headers**, developers were forced to buy domains or host on Netlify/Vercel.

### The snapREC Studio Breakthrough
snapREC Studio uses modern browser capabilities to eliminate the header, domain, and server requirements completely:
1. **Direct Hardware-Accelerated MP4**: Modern Chromium (Chrome 126+, Edge 126+, Brave, Opera) and Apple Safari natively support `video/mp4;codecs=avc1,mp4a.40.2` in `MediaRecorder`. The browser encodes H.264/AAC directly using local GPU acceleration with 0ms export time.
2. **Pure-JS Muxing**: For browsers without direct MP4 container emission, client-side muxers bundle raw samples into an ISO-BMFF container with front-loaded `moov` atoms (`faststart`) without needing WebAssembly, `SharedArrayBuffer`, or custom server headers.
3. **100% Static GitHub Pages Compatible**: Because no special HTTP headers are needed, the entire application exports as a static bundle (`./out`) and deploys to standard GitHub Pages (`username.github.io/repo-name/`) with zero backend.

---

## Deployment to GitHub Pages

This repository includes a pre-configured GitHub Actions workflow in [`.github/workflows/static.yml`](.github/workflows/static.yml).

### Quick Setup:
1. Push this repository to GitHub.
2. Go to your repository on GitHub &rarr; **Settings** &rarr; **Pages**.
3. Under **Build and deployment**:
   - **Source**: Select **GitHub Actions**.
4. Future pushes to the `main` branch will automatically run `npm run build` and publish the `./out` static directory!

---

## Local Development

```bash
# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev

# Build production static export (outputs to ./out)
npm run build
```

To preview the static production build locally:
```bash
npx serve out
```

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Alt + R` | Start / Stop recording |
| `Alt + P` | Pause / Resume recording |
| `Alt + S` | Stop recording & open review trimmer |
| `Esc` | Cancel 3-second countdown or close modals |

---

## Project Structure

```
snapREC/
├── app/
│   ├── globals.css              # Tailwind directives & CSS variables
│   ├── layout.tsx               # Root layout & ThemeProvider
│   └── page.tsx                 # Studio page orchestrator
├── components/
│   ├── ui/                      # 30+ shadcn/ui primitives (Radix UI)
│   ├── ControlsHUD.tsx          # Timer, VU meters, record/pause/stop
│   ├── KeyboardShortcutsDialog.tsx # Accessible shortcuts helper
│   ├── PreviewTrimmerModal.tsx  # Video player & dual-slider trimmer
│   ├── RecordingsLibrarySheet.tsx # Session takes manager
│   ├── SettingsPanel.tsx        # Video, Audio, Webcam & General tabs
│   ├── StudioCanvasStage.tsx    # Live preview stage & interactive overlay
│   ├── StudioModeSelector.tsx   # Screen+Cam, Screen, Cam, Audio pills
│   ├── StudioNavbar.tsx         # Navbar with theme toggle & status
│   └── theme-provider.tsx       # next-themes provider
├── lib/
│   ├── audio-mixer.ts           # Web Audio API mixer & VU meter analyser
│   ├── canvas-compositor.ts     # Offscreen canvas compositor for webcam overlay
│   ├── mp4-engine.ts            # Client-side MP4 detection & seekable WebM fixer
│   ├── types.ts                 # Shared TypeScript interfaces
│   └── utils.ts                 # shadcn clsx & twMerge utility
├── legacy/
│   └── index.html               # Preserved original monolithic index.html
├── .github/
│   └── workflows/static.yml     # Automated GitHub Pages CI/CD workflow
├── next.config.js               # Static export configuration (output: 'export')
├── package.json                 # Project dependencies & scripts
├── tailwind.config.ts           # Tailwind CSS theme configuration
└── README.md                    # Documentation
```

---

## License

MIT &copy; 2026 snapREC Studio. Open-source and free forever.
