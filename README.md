# snapREC — Screen Recorder

Free, ad-free, minimal web screen recorder with **client-side MP4 export**.

## Features

- Screen recording (screen + system audio)
- Camera overlay with PiP
- Microphone audio
- **MP4 export** (H.264/AAC) via ffmpeg.wasm
- Quick WebM download fallback
- Client-side trimming
- Fully private — no server, no uploads

## Deploy to Netlify (Recommended)

Netlify supports the **COOP/COEP headers** required for ffmpeg.wasm to work.

### Option 1: Drag & Drop (Fastest)

1. Go to [netlify.com](https://netlify.com) and sign up (free)
2. Click **"Add new site" → "Deploy manually"**
3. Drag and drop this entire project folder
4. Wait for deploy → click the live URL
5. Done! MP4 export will work

### Option 2: GitHub → Netlify (Auto-deploy)

1. Push this project to a GitHub repo
2. On Netlify, click **"Add new site" → "Import an existing project"**
3. Select your GitHub repo
4. Click **Deploy**
5. Future pushes to GitHub auto-deploy

### Why not GitHub Pages?

GitHub Pages **cannot** set the required `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy` headers. This means ffmpeg.wasm (which needs `SharedArrayBuffer`) won't work there. Netlify, Vercel, and Cloudflare Pages all support these headers.

## Local Development

Just open `index.html` in your browser. No build step needed.

For MP4 export locally, you need to serve it with COOP/COEP headers:

```bash
npx serve . --cors
```

Or use Python:

```bash
python -m http.server 8080
```

(Note: Local servers without COOP/COEP headers won't support MP4 export — use the Quick WebM download instead.)

## Post-Processing with ffmpeg (Fallback)

If you have a `.webm` file that needs to be converted to MP4 locally:

```bash
ffmpeg -i input.webm -c:v libx264 -c:a aac -movflags +faststart output.mp4
```

Or drag & drop your `.webm` files onto `fix_mp4.bat` (Windows).

## File Structure

```
snapREC/
├── index.html          # Main app
├── _headers            # Netlify COOP/COEP headers
├── netlify.toml        # Netlify config backup
├── fix_mp4.bat         # Windows batch converter
└── README.md           # This file
```

## License

MIT
