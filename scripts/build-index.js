#!/usr/bin/env node
// posts/*.md 를 스캔해서 posts/index.json을 재생성한다.
//
// - frontmatter가 이미 있는 파일: title/date/category/tags는 그대로 신뢰하고,
//   excerpt/readingTime만 현재 본문 기준으로 다시 계산해 갱신한다.
// - frontmatter가 아예 없는 "새로 던져넣은" 원본 노트: title/slug/date/
//   category/tags를 자동 생성해서 frontmatter를 새로 만들어 파일 맨 위에
//   써주고, 본문의 Obsidian 이미지 임베드(![[...]])는 실제 마크다운
//   이미지 문법으로 변환해준다.
//
// slug는 항상 "실제 파일명(확장자 제외)"을 그대로 쓴다 — posts.js/archive.js가
// posts/{slug}.md 로 그대로 fetch하기 때문에 파일명과 slug가 어긋나면 안 된다.
//
// excerpt/readingTime 계산 로직은 Google Drive vault를 처음 가져올 때 썼던
// 방식을 그대로 포팅한 것이다 (전체 34개 기존 글로 검증한 규칙).

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(REPO_ROOT, "posts");
const IMAGES_DIR = "assets/images/posts";

const CATEGORY_DEFAULT = "미분류";
const EXCERPT_CAP = 100;

// --- excerpt 생성 전용 텍스트 정리 ---
// posts.js/archive.js의 cleanWikilinks()와 기본 로직(위키링크 브래킷 제거,
// 코드펜스 보존)은 같지만, 여기서는 excerpt 미리보기 텍스트를 만드는 게
// 목적이라 이미 실제 마크다운 이미지 문법으로 변환된 임베드도 파일명만
// 남기고 정리한다. 렌더링 파이프라인(posts.js/archive.js)에는 영향 없음 —
// 이 파일은 완전히 별도 스크립트라 저장된 본문 자체는 건드리지 않는다.

function stripWikilinkSyntax(line) {
  line = line.replace(/!\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, (_, inner) => inner.trim());
  line = line.replace(/\[\[([^\]]+)\]\]/g, (_, inner) => {
    const parts = inner.split("|");
    return parts[parts.length - 1];
  });
  // 이미 실제 마크다운 이미지 문법(![alt](url))으로 변환된 임베드도 미리보기용
  // 텍스트로는 파일명만 보이게 정리한다 (렌더링용 본문 자체는 건드리지 않음 —
  // 이 함수는 excerpt 계산 전용 정리본을 만들 때만 쓰인다).
  line = line.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
    if (alt) return alt;
    try {
      return decodeURIComponent(url.split("/").pop());
    } catch {
      return url.split("/").pop();
    }
  });
  return line;
}

function cleanWikilinks(markdown) {
  let inFence = false;
  let fenceMarker = null;
  return markdown
    .split("\n")
    .map((line) => {
      const m = line.match(/^\s*(```|~~~)/);
      if (m) {
        if (!inFence) {
          inFence = true;
          fenceMarker = m[1];
        } else if (m[1] === fenceMarker) {
          inFence = false;
          fenceMarker = null;
        }
        return line;
      }
      return inFence ? line : stripWikilinkSyntax(line);
    })
    .join("\n");
}

// --- 이미지 임베드 변환: ![[파일명|너비]] -> ![](assets/images/posts/파일명) ---

function convertImageEmbeds(raw) {
  return raw.replace(/!\[\[([^\]|]+\.(?:png|jpe?g|gif|webp))(?:\|[^\]]+)?\]\]/gi, (_, filename) => {
    const name = filename.trim();
    const url = IMAGES_DIR + "/" + name.split("/").map(encodeURIComponent).join("/");
    return `![](${url})`;
  });
}

// --- excerpt 계산: 빈 줄 블록으로 나눠서 "진짜 내용" 블록을 찾는다 ---

function getBlocks(body) {
  const blocks = [];
  let cur = [];
  for (const line of body.split("\n")) {
    if (line.trim() === "") {
      if (cur.length) {
        blocks.push(cur);
        cur = [];
      }
    } else {
      cur.push(line);
    }
  }
  if (cur.length) blocks.push(cur);
  return blocks;
}

function isSkippableBlock(blk) {
  const first = blk[0].trim();
  if (first.startsWith("#")) return true;
  if (first === "---" || first === "===" || first === "***") return true;
  if (/^날짜\s*:/.test(first) || /^소요시간\s*:/.test(first)) return true;
  if (/^-?\s*\d+\s*(:|$|\()/.test(first)) return true;
  return false;
}

function makeExcerpt(cleanBody, cap = EXCERPT_CAP) {
  for (const blk of getBlocks(cleanBody)) {
    if (isSkippableBlock(blk)) continue;
    let joined = blk.map((l) => l.trim()).join(" ");
    joined = joined.replace(/ {2,}/g, " ");
    const tokens = joined.match(/\S+\s*/g) || [];
    let cum = 0;
    let truncated = false;
    for (const t of tokens) {
      if (cum + t.length > cap) {
        truncated = true;
        break;
      }
      cum += t.length;
    }
    if (!truncated) cum = joined.length;
    let result = joined.slice(0, cum).replace(/\s+$/, "");
    if (truncated) result += "…";
    return result;
  }
  return "(아직 작성되지 않은 노트)";
}

function makeReadingTime(rawBody) {
  return Math.max(1, Math.round(rawBody.length / 500));
}

// --- frontmatter 파싱/직렬화 ---

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return null;
  const fields = {};
  for (const line of m[1].split("\n")) {
    const fm = line.match(/^(\w+):\s*(.*)$/);
    if (!fm) continue;
    const [, key, rawValue] = fm;
    fields[key] = parseYamlScalar(rawValue.trim());
  }
  return { fields, body: raw.slice(m[0].length) };
}

function parseYamlScalar(value) {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((item) => {
      const t = item.trim();
      return t.startsWith('"') && t.endsWith('"') ? t.slice(1, -1) : t;
    });
  }
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  return value;
}

function yamlString(value) {
  return '"' + String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
}

function yamlArray(arr) {
  if (!arr || arr.length === 0) return "[]";
  return "[" + arr.map(yamlString).join(", ") + "]";
}

function serializeFrontmatter(fields) {
  return (
    "---\n" +
    `slug: ${yamlString(fields.slug)}\n` +
    `title: ${yamlString(fields.title)}\n` +
    `date: ${fields.date}\n` +
    `category: ${yamlString(fields.category)}\n` +
    `tags: ${yamlArray(fields.tags)}\n` +
    `excerpt: ${yamlString(fields.excerpt)}\n` +
    `readingTime: ${fields.readingTime}\n` +
    "---\n"
  );
}

// --- 새 파일용 기본값 ---

function gitAddedDate(absPath) {
  try {
    const relPath = path.relative(REPO_ROOT, absPath);
    const out = execFileSync(
      "git",
      ["log", "--diff-filter=A", "--follow", "--format=%aI", "--", relPath],
      { cwd: REPO_ROOT, encoding: "utf8" }
    ).trim();
    if (!out) return null;
    const oldest = out.split("\n").pop();
    return oldest.slice(0, 10); // YYYY-MM-DD
  } catch {
    return null;
  }
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

// --- 메인 처리 ---

function processFile(filename) {
  const absPath = path.join(POSTS_DIR, filename);
  const slug = filename.replace(/\.md$/, "");
  const original = fs.readFileSync(absPath, "utf8");

  const parsed = parseFrontmatter(original);
  const warnings = [];
  let fields;
  let body;

  if (parsed) {
    fields = { ...parsed.fields };
    body = parsed.body;
    if (fields.slug !== slug) {
      warnings.push(`slug 불일치 수정: "${fields.slug}" -> "${slug}" (파일명 기준)`);
      fields.slug = slug;
    }
    if (!fields.title) fields.title = slug;
    if (!fields.date) fields.date = gitAddedDate(absPath) || todayString();
    if (!fields.category) fields.category = CATEGORY_DEFAULT;
    if (!fields.tags) fields.tags = [];
  } else {
    // frontmatter가 아예 없는 새 원본 노트: 처음부터 생성 + 이미지 임베드 변환
    warnings.push("frontmatter 없음 -> 새로 생성");
    body = convertImageEmbeds(original);
    fields = {
      slug,
      title: slug,
      date: gitAddedDate(absPath) || todayString(),
      category: CATEGORY_DEFAULT,
      tags: [],
    };
  }

  const rawBodyForReadingTime = body;
  const cleanBodyForExcerpt = cleanWikilinks(body);

  fields.readingTime = makeReadingTime(rawBodyForReadingTime);
  fields.excerpt = makeExcerpt(cleanBodyForExcerpt);

  const newContent = serializeFrontmatter(fields) + body.replace(/^\n*/, "\n");

  if (newContent !== original) {
    fs.writeFileSync(absPath, newContent, "utf8");
  }

  // 본문에서 참조하는 이미지가 실제로 존재하는지 확인
  const imageRefs = [...body.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]);
  for (const ref of imageRefs) {
    if (/^https?:\/\//.test(ref)) continue;
    const decoded = decodeURIComponent(ref);
    if (!fs.existsSync(path.join(REPO_ROOT, decoded))) {
      warnings.push(`참조된 이미지 없음: ${decoded}`);
    }
  }

  return {
    entry: {
      slug: fields.slug,
      title: fields.title,
      date: fields.date,
      category: fields.category,
      tags: fields.tags,
      excerpt: fields.excerpt,
      readingTime: fields.readingTime,
    },
    warnings: warnings.map((w) => `[${slug}] ${w}`),
  };
}

function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error("posts/ 디렉터리를 찾을 수 없습니다:", POSTS_DIR);
    process.exit(1);
  }

  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const manifest = [];
  const allWarnings = [];
  const seenSlugs = new Map();

  for (const filename of files) {
    const { entry, warnings } = processFile(filename);
    allWarnings.push(...warnings);

    if (seenSlugs.has(entry.slug)) {
      allWarnings.push(
        `[중복 slug] "${entry.slug}" — ${seenSlugs.get(entry.slug)} 와 ${filename} 충돌`
      );
    }
    seenSlugs.set(entry.slug, filename);

    manifest.push(entry);
  }

  manifest.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const outPath = path.join(POSTS_DIR, "index.json");
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  console.log(`posts/index.json 생성 완료: ${manifest.length}개 항목`);
  const byCategory = manifest.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});
  for (const [cat, count] of Object.entries(byCategory).sort()) {
    console.log(`  - ${cat}: ${count}`);
  }

  if (allWarnings.length) {
    console.log("\n경고/변경 사항:");
    for (const w of allWarnings) console.log("  " + w);
  }
}

main();
