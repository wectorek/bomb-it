import { open, readdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

function synchsafe(buffer, offset) {
  return (
    ((buffer[offset] & 0x7f) << 21) |
    ((buffer[offset + 1] & 0x7f) << 14) |
    ((buffer[offset + 2] & 0x7f) << 7) |
    (buffer[offset + 3] & 0x7f)
  );
}

function decodeFrame(data) {
  if (!data.length) {
    return "";
  }
  const encoding = data[0];
  const bytes = data.subarray(1);
  if (encoding === 0) {
    return bytes.toString("latin1");
  }
  if (encoding === 3) {
    return bytes.toString("utf8");
  }
  const little = encoding === 1 && bytes[0] === 0xff && bytes[1] === 0xfe;
  return bytes.toString(little ? "utf16le" : "utf16le").replace(/^\uFEFF/, "");
}

function clean(value) {
  return value.replace(/\0/g, "").trim();
}

async function readTags(file) {
  const handle = await open(file, "r");
  try {
    const header = Buffer.alloc(10);
    const read = await handle.read(header, 0, 10, 0);
    if (read.bytesRead < 10 || header.subarray(0, 3).toString() !== "ID3") {
      return {};
    }
    const version = header[3];
    const tagSize = synchsafe(header, 6);
    const tag = Buffer.alloc(Math.min(tagSize, 256 * 1024));
    await handle.read(tag, 0, tag.length, 10);

    const tags = {};
    let offset = 0;
    while (offset + 10 < tag.length && tag[offset] !== 0) {
      const id = tag.subarray(offset, offset + 4).toString("latin1");
      if (!/^[A-Z0-9]{4}$/.test(id)) {
        break;
      }
      const size =
        version === 4 ? synchsafe(tag, offset + 4) : tag.readUInt32BE(offset + 4);
      const start = offset + 10;
      const end = Math.min(tag.length, start + size);
      if (id === "TIT2" || id === "TPE1") {
        tags[id] = clean(decodeFrame(tag.subarray(start, end)));
      }
      offset = start + size;
    }
    return { title: tags.TIT2 || "", artist: tags.TPE1 || "" };
  } finally {
    await handle.close();
  }
}

function titleFromName(name) {
  return name
    .replace(/\.mp3$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

export async function GET() {
  const dir = path.join(process.cwd(), "public", "audio");
  let names = [];
  try {
    names = await readdir(dir);
  } catch {
    names = [];
  }

  const tracks = [];
  for (const name of names.sort((left, right) => left.localeCompare(right, "pl"))) {
    if (name.startsWith(".") || !name.toLowerCase().endsWith(".mp3")) {
      continue;
    }
    let tags = {};
    try {
      tags = await readTags(path.join(dir, name));
    } catch {
      tags = {};
    }
    tracks.push({
      id: name,
      title: tags.title || titleFromName(name),
      artist: tags.artist || "",
      src: `/audio/${encodeURIComponent(name)}`,
    });
  }

  return Response.json(tracks, {
    headers: { "Cache-Control": "no-store" },
  });
}
