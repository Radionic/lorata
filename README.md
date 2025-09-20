Lorata is a data labeling tool for the GenAI models. We plan to support the following labeling tasks:

- [x] Text-to-Image
- [x] Image-to-Image (Image Editing)
- [ ] Text-to-Video
- [ ] Image-to-Video
- [ ] Video-to-Video (Video Editing)

Lorata has a built-in image/video editor that supports:

- [x] Draw on image
- [x] Crop image
- [ ] Edit image with cloud AI models (e.g. Nano Banana)
- [ ] Extract image frames from video
- [ ] Extract video segments from video

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

## Getting Started

Install [pnpm](https://pnpm.io/installation) first, then run:

```bash
pnpm install
pnpm db:push
pnpm dev
```
