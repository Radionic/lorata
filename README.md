Lorata is a data labeling tool for the GenAI models. We plan to support the following labeling tasks:

- [x] Text-to-Image
- [x] Image-to-Image (Image editing, support multiple source images)
- [x] Text-to-Video
- [x] Image-to-Video
- [ ] Video-to-Video (Video editing)

Lorata has a built-in image/video editor that supports:

- [x] Draw on image
- [x] Crop image
- [x] Trim video
- [x] Generate image/video caption with AI
- [ ] Edit image with cloud AI models (e.g. Nano Banana)
- [ ] Extract image frames from video
- [x] Export videos with different FPS

https://github.com/user-attachments/assets/61568ad8-c7da-4591-91f0-28ec832d7c5b

https://github.com/user-attachments/assets/053af64f-8f38-46ba-8659-d7d8caf66d29

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
# Image-to-Image task (multiple source images)
task-name.zip
├── instructions
│   ├── item-1.txt
│   ├── item-2.txt
│   └── ...
├── sources_1
│   ├── item-1.jpg
│   ├── item-2.png
│   └── ...
├── sources_2
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

Install [pnpm](https://pnpm.io/installation) and [ffmpeg](https://ffmpeg.org/download.html), then run:

```bash
cp .env.example .env
pnpm install
pnpm db:push
pnpm dev
```

(Optional) If you need image/video captioning model, configure `.env` with your OpenAI-compatible API endpoint:

```bash
OPENAI_API_MODEL= # Make sure to use a vision language model
OPENAI_API_KEY=
OPENAI_API_BASE_URL=
```

## Training Frameworks

- [ai-toolkit](https://github.com/ostris/ai-toolkit) by @ostris
- [sd-scripts](https://github.com/kohya-ss/sd-scripts) by @kohya-ss
- [musubi-tuner](https://github.com/kohya-ss/musubi-tuner) by @kohya-ss
- [diffusion-pipe](https://github.com/tdrussell/diffusion-pipe) by @tdrussell
