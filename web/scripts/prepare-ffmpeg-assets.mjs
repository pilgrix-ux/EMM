import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ffmpegPackage = resolve(projectRoot, "node_modules/@ffmpeg/ffmpeg/dist/esm");
const publicWorkerDirectory = resolve(projectRoot, "public/ffmpeg");

await mkdir(dirname(publicWorkerDirectory), { recursive: true });
await rm(publicWorkerDirectory, { recursive: true, force: true });
await cp(ffmpegPackage, publicWorkerDirectory, { recursive: true });

console.log("Prepared the FFmpeg browser worker and its module files.");
