# group-trimmer

### install global

npm i -g @ffmpeg-kit/trimmer

yarn global add @ffmpeg-kit/trimmer

### command

ffmpeg-kit-trimmer -i video.mp4 00:06:00-20 00:20:10-15 01:00:11-40
ffmpeg-kit-trimmer -i http://localhost:3000/stream 00:06:00-20 00:20:10-15 01:00:11-40
ffmpeg-kit-trimmer -i video.torrent 00:06:00-20 00:20:10-15 01:00:11-40

### video fragments in

./tmp
