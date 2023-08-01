#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_child_process_1 = require("node:child_process");
const node_path_1 = require("node:path");
const node_events_1 = require("node:events");
const commander_1 = require("commander");
const ffmpeg_static_1 = __importDefault(require("ffmpeg-static"));
const ini_1 = __importDefault(require("ini"));
const utils_1 = require("./utils");
var Status;
(function (Status) {
    Status[Status["idle"] = 0] = "idle";
    Status[Status["running"] = 1] = "running";
    Status[Status["failed"] = 2] = "failed";
    Status[Status["done"] = 3] = "done";
})(Status || (Status = {}));
class Trimmer {
    status = Status.idle;
    retries = 3;
    ffmpegOptions;
    progress = {};
    range = [0, 0];
    constructor({ link, range, catalog, hash, retries }) {
        const [startTime, duration] = range;
        this.range = range;
        this.retries = retries;
        const fileName = `${hash}-${startTime}-${duration}.mp4`;
        const filePath = (0, node_path_1.resolve)(catalog, fileName);
        this.ffmpegOptions = [
            '-ss',
            `${startTime}`,
            '-i',
            link,
            '-t',
            `${duration}`,
            '-c',
            'copy',
            '-progress',
            'pipe:1',
            '-y',
            filePath,
        ];
    }
    read() {
        return new Promise((resolve, reject) => {
            this.status = Status.running;
            const ffmpeg = (0, node_child_process_1.spawn)(ffmpeg_static_1.default, this.ffmpegOptions);
            let updated = false;
            const id = setInterval(() => {
                if (updated) {
                    return (updated = false);
                }
                else {
                    ffmpeg.kill();
                    this.retries -= 1;
                    this.status = Status.idle;
                    return false;
                }
            }, argv.timeout * 1000);
            ffmpeg.on('close', code => {
                this.status = Status.done;
                clearInterval(id);
                resolve(code);
            });
            ffmpeg.on('error', e => {
                this.status = Status.failed;
                clearInterval(id);
                reject(e);
            });
            ffmpeg.stdout.on('data', data => {
                const { bitrate, total_size, out_time_ms, progress } = ini_1.default.decode(data.toString());
                updated = true;
                this.progress = {
                    bitrate,
                    status: progress,
                    totalSize: total_size,
                    outTimeMs: out_time_ms,
                };
            });
            if (argv.log) {
                ffmpeg.stderr.on('data', data => {
                    console.error(`ffmpeg: ${data}`);
                });
            }
        });
    }
    toString() {
        const width = 70;
        let progressText = '';
        let percentage = 0;
        try {
            const value = this.progress.outTimeMs > 0 ? this.progress.outTimeMs / 1000000 : 0;
            percentage = (value / this.range[1]) * 100;
            const progress = Math.round((width * percentage) / 100);
            progressText = '='.repeat(progress).padEnd(width, ' ');
        }
        catch (e) {
            console.log(e);
        }
        return `[${progressText}] | ${(this.range[0] +
            '-' +
            this.range[1]).padStart(7, ' ')} | ${percentage.toFixed(2)}% \r\n`;
    }
}
class Monitor extends node_events_1.EventEmitter {
    observed = [];
    streamsCount;
    observe(trimmers) {
        this.observed = trimmers.map(trimmer => {
            return new Proxy(trimmer, {
                set: (target, prop, val) => {
                    target[prop] = val;
                    if (prop === 'status' && val !== Status.running) {
                        this.run();
                    }
                    else {
                        this.render();
                    }
                    return true;
                },
            });
        });
        return this;
    }
    run() {
        const observer = this.observed.find(item => item.status === Status.idle && item.retries > 0);
        if (observer) {
            observer.read();
        }
        else {
        }
    }
    start(streams) {
        this.streamsCount = streams;
        for (let i = 0; i < this.streamsCount; i++) {
            this.observed[i]?.read();
        }
    }
    render = () => {
        process.stdout.write('\x1Bc\r' + this.observed.join(''));
    };
}
const parseSegments = (segment) => {
    const segmentFormat = {
        ['hh:mm:ss-duration']: /(\d{2}):(\d{2}):(\d{2})-(\d+)/,
        ['startTime-duration']: /^(\d+)-(\d+)/,
    };
    const match = segment.match(segmentFormat['hh:mm:ss-duration']);
    if (match !== null) {
        const [_i, hrs, min, sec, duration] = Array.from(match, val => +val);
        return [(hrs * 60 + min) * 60 + sec, duration];
    }
    if (segmentFormat['startTime-duration'].test(segment.trim())) {
        return segment.split('-');
    }
    return [0, 0];
};
commander_1.program
    .option('-i, --input <input>', 'video source')
    .option('-p, --path <path>', 'change destination path', './tmp')
    .option('-l, --log <log>', 'display ffmpeg log')
    .option('-t, --timeout <timeout>', 'timeout in sec. for trim process', '30')
    .option('-r, --retries <retries>', 'number of retries for trim process', '15')
    .option('-s, --streams <streams>', 'the number of concurrent trim streams', '3')
    .parse(process.argv);
const argv = commander_1.program.opts();
const hash = (0, utils_1.createHash)(argv.input);
const ranges = commander_1.program.args.map(parseSegments);
const monitor = new Monitor();
const startProcess = async () => {
    const trimmers = [];
    await (0, utils_1.makeDir)(argv.path);
    for (const range of ranges) {
        const trimmer = new Trimmer({
            link: argv.input,
            range,
            catalog: argv.path,
            hash,
            retries: Number(argv.retries),
        });
        trimmers.push(trimmer);
    }
    monitor.observe(trimmers).start(argv.streams);
};
startProcess();
//# sourceMappingURL=index.js.map