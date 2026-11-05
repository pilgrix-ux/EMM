import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ffmpegPackage = resolve(projectRoot, "node_modules/@ffmpeg/ffmpeg/dist/esm");
const publicWorkerDirectory = resolve(projectRoot, "public/ffmpeg");
const ffmpegClassesFile = resolve(projectRoot, "node_modules/@ffmpeg/ffmpeg/dist/esm/classes.js");
let ffmpegClasses = await readFile(ffmpegClassesFile, "utf8");
const dynamicWorkerUrl = /new URL\\(classWorkerURL,\\s*import\\.meta\\.url\\)/g;
const fallbackWorkerUrl = /new URL\\((["'])\\.\\/worker\\.js\\1,\\s*import\\.meta\\.url\\)/g;
if (!dynamicWorkerUrl.test(ffmpegClasses) || !fallbackWorkerUrl.test(ffmpegClasses)) {
  throw new Error("The FFmpeg worker bootstrap changed; update the EMM worker compatibility patch.");
}
ffmpegClasses = ffmpegClasses
  .replace(dynamicWorkerUrl, "classWorkerURL")
  .replace(fallbackWorkerUrl, '"/ffmpeg/worker.js"');
await writeFile(ffmpegClassesFile, ffmpegClasses);

await mkdir(dirname(publicWorkerDirectory), { recursive: true });
await rm(publicWorkerDirectory, { recursive: true, force: true });
await cp(ffmpegPackage, publicWorkerDirectory, { recursive: true });

console.log("Prepared the FFmpeg browser worker and its module files.");
