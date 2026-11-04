"""Create browser-compatible copies of the four retained supplied videos."""
from pathlib import Path
import hashlib
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\zfc\Desktop\个人作品集照片素材")
FFMPEG = Path(r"E:\电商产业园实习项目\GEO-SaaS\docs\portfolio\video-review\tools\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe")
FILES = [
    "2026_10_31_11_36_06_IMG_2569.MOV",
    "2026_10_06_11_30_17_IMG_1406.MOV",
    "2026_10_02_17_49_22_IMG_1194.MP4",
    "2026_07_09_13_04_17_IMG_7172.MOV",
]

def run(args):
    subprocess.run([str(FFMPEG), "-hide_banner", "-loglevel", "error", "-y", *args], check=True)

records, items = [], []
for index, name in enumerate(FILES, 2):
    source = SOURCE / name
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    info = subprocess.run([str(FFMPEG), "-hide_banner", "-i", str(source)], capture_output=True, text=True, encoding="utf-8", errors="replace").stderr
    hdr = "arib-std-b67" in info
    duration = re.search(r"Duration: (\d+):(\d+):([\d.]+)", info)
    seconds = int(duration[1]) * 3600 + int(duration[2]) * 60 + float(duration[3])
    clip_id = re.search(r"IMG_(\d+)", name)[1]
    output = ROOT / "public/media" / f"outdoor-{clip_id}.mp4"
    poster = output.with_suffix(".jpg")
    vf = (
        "zscale=w=1920:h=1080:t=linear:npl=100,format=gbrpf32le,"
        "zscale=p=bt709,tonemap=tonemap=hable:desat=0,"
        "zscale=t=bt709:m=bt709:r=limited,format=yuv420p"
        if hdr else "scale=1920:1080:flags=lanczos,format=yuv420p"
    )
    run(["-i", str(source), "-map", "0:v:0", "-map", "0:a:0?", "-map_metadata", "-1",
         "-vf", vf, "-c:v", "libx264", "-crf", "25", "-maxrate", "4M", "-bufsize", "8M", "-preset", "medium", "-threads", "2",
         "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
         "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(output)])
    run(["-ss", str(min(1, seconds / 3)), "-i", str(output), "-frames:v", "1", "-q:v", "2", str(poster)])
    assert hashlib.sha256(source.read_bytes()).hexdigest() == digest
    # Decode every video frame to catch corrupt outputs before adding it to the site.
    run(["-i", str(output), "-map", "0:v:0", "-f", "null", "-"])
    items.append({"id": f"video-{clip_id}", "kind": "video", "src": f"/media/{output.name}?v=20261103",
                  "poster": f"/media/{poster.name}", "width": 1920, "height": 1080,
                  "caption": f"户外影像 · {index:02d}", "sourceNote": f"原片段完整时长 · {seconds:.1f}秒"})
    records.append({"source": str(source), "sha256": digest, "output": output.name,
                    "poster": poster.name, "durationSeconds": seconds,
                    "conversion": "HLG BT.2020 to SDR BT.709 (linear light, Hable tone mapping)" if hdr else "SDR BT.709",
                    "outputBytes": output.stat().st_size})
    print(f"Prepared {clip_id}: {seconds:.2f}s, {'HDR -> SDR' if hdr else 'SDR'}, {output.stat().st_size / 1048576:.1f} MiB", flush=True)

(ROOT / "src/video-data.ts").write_text('import type { VideoMedia } from "./types";\n\nexport const additionalOutdoorVideos: VideoMedia[] = ' + json.dumps(items, ensure_ascii=False, indent=2) + ';\n', encoding="utf-8")
(ROOT / "docs/video-manifest.json").write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n', encoding="utf-8")
