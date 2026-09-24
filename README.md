# ARZ Image Studio

A browser-based ARZ Host creative workspace for generating consistent image prompts and preparing finished images for the web.

## Features

- Single and multiple image selection
- Thumbnail prompt generation using the fixed ARZ Host banner style
- Context-aware infographic prompt generation
- One-click prompt copying for use with ChatGPT
- Drag-and-drop upload
- WebP quality control
- Watermark opacity and size controls
- Individual in-browser processing (images never leave the device)
- Batch ZIP download
- Responsive interface

## Cloudflare deployment from GitHub

1. Push this repository to GitHub.
2. In Cloudflare, open **Workers & Pages** and choose **Create application**.
3. Import this GitHub repository.
4. Use these build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Deploy.

No environment variables or server are required.

## Optional CLI deployment

```bash
npm run deploy
```
