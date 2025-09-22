Lorata is a data labeling tool for the GenAI models. We plan to support the following labeling tasks:

- [x] Text-to-Image
- [x] Image-to-Image (Image Editing)
- [x] Text-to-Video
- [x] Image-to-Video
- [ ] Video-to-Video (Video Editing)

Lorata has a built-in image/video editor that supports:

- [x] Draw on image
- [x] Crop image
- [ ] Edit image with cloud AI models (e.g. Nano Banana)
- [ ] Extract image frames from video
- [ ] Extract video segments from video
- [x] Export videos with different FPS and audio on/off

Lorata supports exporting tasks as zip files, with the following structure:

```
# Text-to-Image task
task-name.zip
├── instructions
│   ├── item-1.txt
│   ├── item-2.txt
│   └── ...
├── images
│   ├── item-1.jpg
│   ├── item-2.png
│   └── ...
```

```
# Image-to-Image task
task-name.zip
├── instructions
│   ├── item-1.txt
│   ├── item-2.txt
│   └── ...
├── sources
│   ├── item-1.jpg
│   ├── item-2.png
│   └── ...
├── targets
│   ├── item-1.jpg
│   ├── item-2.png
│   └── ...
```

```
# Text-to-Video task
task-name.zip
├── instructions
│   ├── item-1.txt
│   ├── item-2.txt
│   └── ...
├── videos
│   ├── item-1.mp4
│   ├── item-2.mp4
│   └── ...
```

```
# Image-to-Video task
task-name.zip
├── instructions
│   ├── item-1.txt
│   ├── item-2.txt
│   └── ...
├── sources
│   ├── item-1.jpg
│   ├── item-2.png
│   └── ...
├── targets
│   ├── item-1.mp4
│   ├── item-2.mp4
│   └── ...
```

## Getting Started

Install [pnpm](https://pnpm.io/installation) and [ffmpeg](https://ffmpeg.org/download.html) (for video conversion during export), then run:

```bash
cp .env.example .env
pnpm install
pnpm db:push
pnpm dev
```
