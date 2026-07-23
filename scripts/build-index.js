#!/usr/bin/env node
// posts/ 아래를 재귀적으로 스캔해서 posts/index.json을 재생성한다.
// 마지막에 build-travel-index.js의 buildTravelIndex()도 호출해서
// assets/images/travel/index.json까지 같이 재생성한다 — 새 여행 국가 폴더나
// 사진을 추가하고 push만 하면(CI가 `node scripts/build-index.js` 한 번만
// 돌려도) 두 매니페스트가 전부 최신 상태로 반영된다.
//
// posts/는 이제 flat이 아니라 posts/<section>/<category>/파일.md 구조다.
// category/section은 원칙적으로 이 폴더 경로에서 자동으로 추론한다 —
// posts/OSCP/리눅스/dog.md -> section="OSCP", category="리눅스".
// 단, frontmatter에 category가 이미 명시돼 있으면 그 값을 그대로 신뢰하고
// 폴더 추론보다 우선한다 (예: 폴더 구조와 다르게 수동으로 분류하고 싶을 때).
// section은 항상 폴더 경로(1단계 디렉터리) 기준으로 정한다 — 파일이 실제로
// 어느 폴더에 있는지가 곧 section이라는 게 이 구조의 핵심이라 예외를
// 두지 않는다.
//
// - frontmatter가 이미 있는 파일: title/date/tags는 그대로 신뢰하고,
//   excerpt/readingTime만 현재 본문 기준으로 다시 계산해 갱신한다.
// - frontmatter가 아예 없는 "새로 던져넣은" 원본 노트: title/slug/date/
//   tags를 자동 생성하고 category/section은 폴더 경로에서 추론해서
//   frontmatter를 새로 만들어 파일 맨 위에 써주고, 본문의 Obsidian
//   이미지 임베드(![[...]])는 실제 마크다운 이미지 문법으로 변환해준다.
//
// slug는 항상 "실제 파일명(확장자 제외)"을 그대로 쓰고, index.json에는
// posts/ 기준 상대 경로(path)도 함께 기록한다 — posts.js/archive.js가
// posts/{path}로 fetch하기 때문에 파일명과 slug, 실제 위치와 path가
// 어긋나면 안 된다.
//
// excerpt/readingTime 계산 로직은 Google Drive vault를 처음 가져올 때 썼던
// 방식을 그대로 포팅한 것이다 (전체 34개 기존 글로 검증한 규칙).

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const buildTravelIndex = require("./build-travel-index.js");

const REPO_ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(REPO_ROOT, "posts");
const IMAGES_DIR = "assets/images/posts";

const CATEGORY_DEFAULT = "미분류";
const SECTION_DEFAULT = "미분류";
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
    `section: ${yamlString(fields.section)}\n` +
    (fields.group ? `group: ${yamlString(fields.group)}\n` : "") +
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

// --- posts/ 재귀 스캔 ---

function walkMarkdownFiles(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walkMarkdownFiles(abs));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(abs);
    }
  }
  return results;
}

// --- 메인 처리 ---

function processFile(relPath) {
  // relPath 예: "OSCP/리눅스/dog.md" (posts/ 기준, 항상 "/" 구분자).
  // 세그먼트가 3개 이상이면 [0]=section, [1]=category, 2개면 [0]=section만,
  // 1개(플랫 파일)면 폴더 추론 자체가 불가능해서 기본값으로 빠진다.
  const segments = relPath.split("/");
  const filename = segments[segments.length - 1];
  const absPath = path.join(POSTS_DIR, ...segments);
  const slug = filename.replace(/\.md$/, "");
  const folderSection = segments.length >= 2 ? segments[0] : null;
  const folderCategory = segments.length >= 3 ? segments[1] : null;

  // Windows(메모장/기본 VSCode 설정 등)에서 CRLF로 저장한 파일은 "---\n"을
  // 찾는 parseFrontmatter 정규식이 "---\r\n"과 매칭되지 않아 frontmatter
  // 전체를 못 찾고 본문으로 오인한다. 읽자마자 LF로 정규화해 무해하게 만든다
  // (이미 LF인 파일은 변화 없음). 파일에 다시 쓸 때도 항상 LF로 저장된다.
  const original = fs.readFileSync(absPath, "utf8").replace(/\r\n/g, "\n");

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
    // category는 frontmatter에 이미 있으면 그대로 신뢰(폴더 추론보다 우선),
    // 없을 때만 폴더 경로에서 추론한다.
    if (!fields.category) fields.category = folderCategory || CATEGORY_DEFAULT;
    else if (folderCategory && fields.category !== folderCategory) {
      warnings.push(
        `category("${fields.category}")가 실제 폴더명("${folderCategory}")과 다름 — frontmatter 값을 그대로 사용`
      );
    }
    if (!fields.tags) fields.tags = [];
  } else {
    // frontmatter가 아예 없는 새 원본 노트: 처음부터 생성 + 이미지 임베드 변환
    warnings.push("frontmatter 없음 -> 새로 생성");
    body = convertImageEmbeds(original);
    fields = {
      slug,
      title: slug,
      date: gitAddedDate(absPath) || todayString(),
      category: folderCategory || CATEGORY_DEFAULT,
      tags: [],
    };
  }

  const rawBodyForReadingTime = body;
  const cleanBodyForExcerpt = cleanWikilinks(body);

  fields.readingTime = makeReadingTime(rawBodyForReadingTime);
  fields.excerpt = makeExcerpt(cleanBodyForExcerpt);
  // section은 항상 실제 폴더 위치(1단계 디렉터리) 기준으로 새로 도출한다 —
  // "어느 폴더에 있는가"가 곧 section이라는 이 구조의 원칙이라 frontmatter에
  // 다른 값이 있어도 폴더가 이긴다. 폴더 없이 posts/ 바로 아래 있는(플랫)
  // 파일만 기존 값 또는 기본값을 쓴다.
  fields.section = folderSection || fields.section || SECTION_DEFAULT;

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

  const entry = {
    slug: fields.slug,
    title: fields.title,
    date: fields.date,
    category: fields.category,
    section: fields.section,
    path: relPath,
    tags: fields.tags,
    excerpt: fields.excerpt,
    readingTime: fields.readingTime,
  };

  return {
    entry,
    warnings: warnings.map((w) => `[${relPath}] ${w}`),
  };
}

function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error("posts/ 디렉터리를 찾을 수 없습니다:", POSTS_DIR);
    process.exit(1);
  }

  const relPaths = walkMarkdownFiles(POSTS_DIR)
    .map((abs) => path.relative(POSTS_DIR, abs).split(path.sep).join("/"))
    .sort();

  const manifest = [];
  const allWarnings = [];
  const seenSlugs = new Map();

  for (const relPath of relPaths) {
    const { entry, warnings } = processFile(relPath);
    allWarnings.push(...warnings);

    if (seenSlugs.has(entry.slug)) {
      allWarnings.push(
        `[중복 slug] "${entry.slug}" — ${seenSlugs.get(entry.slug)} 와 ${relPath} 충돌`
      );
    }
    seenSlugs.set(entry.slug, relPath);

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

  console.log("");
  buildTravelIndex();
}

main();
