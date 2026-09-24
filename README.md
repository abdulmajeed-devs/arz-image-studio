# ARZ Image Studio

A private, browser-based batch image converter. It converts selected images to WebP and adds the included ARZ Host logo to the bottom-right corner of every image.

## Features

- Single and multiple image selection
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
