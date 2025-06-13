# 📼 group-trimmer

`group-trimmer` is a CLI tool that allows you to extract specific fragments from a video file — locally, via HTTP, or even from a `.torrent` — **without downloading the full video**.

All trimmed video segments are saved to the `./tmp` directory.

---

## 📦 Installation (global)

With **npm**:

```bash
npm install -g @ffmpeg-kit/trimmer
```

With **yarn**:

```bash
yarn global add @ffmpeg-kit/trimmer
```

---

## 🚀 Usage

```bash
ffmpeg-kit-trimmer -i <input> <start1>-<duration1> <start2>-<duration2> ...
```

### Arguments:

- `-i <input>` — Path to a local video file, HTTP/HTTPS stream, or `.torrent` file.
- `<start>-<duration>` — Start time and duration in seconds for each fragment to extract.

### Time Format:

- `<start>` is in the format `HH:MM:SS` (e.g. `00:06:00`)
- `<duration>` is in seconds (e.g. `20`)

---

## 📂 Examples

Trim fragments from a **local video file**:

```bash
ffmpeg-kit-trimmer -i video.mp4 00:06:00-20 00:20:10-15 01:00:11-40
```

Trim fragments from a **web stream**:

```bash
ffmpeg-kit-trimmer -i http://localhost:3000/stream 00:06:00-20 00:20:10-15 01:00:11-40
```

Trim fragments from a **`.torrent` file** (no full download required):

```bash
ffmpeg-kit-trimmer -i video.torrent 00:06:00-20 00:20:10-15 01:00:11-40
```

---

## 📁 Output

All trimmed fragments will be saved to the `./tmp` directory by default.

---

## 🛠 Requirements

- [FFmpeg](https://ffmpeg.org/download.html) must be installed and available in your system's PATH.

---

## 📃 License

MIT
