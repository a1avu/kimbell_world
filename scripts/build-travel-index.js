#!/usr/bin/env node
// assets/images/travel/<국가 폴더>/ 를 스캔해서 assets/images/travel/index.json을 재생성한다.
// posts/index.json(scripts/build-index.js)과 같은 "매니페스트 파일" 패턴 —
// 여행 사진은 폴더 구조를 브라우저에서 직접 스캔할 수 없으니 빌드 시점에
// 실제 파일 목록을 JSON으로 구워둔다.
//
// 국가 폴더명은 대소문자/공백이 섞여 있어도 된다(예: "Czech Republic").
// 실제 파일명도 확장자 대소문자가 섞여 있어도(1.JPG, 3.jpg 등) 있는 그대로
// 기록하므로, 프론트엔드는 이 값만 그대로 써서 URL을 만들면 된다
// (GitHub Pages는 대소문자를 구분하는 리눅스 파일시스템이라 하드코딩한
// 확장자 추측은 깨지기 쉽다).

const fs = require("fs");
const path = require("path");
const { normalizeCountryKey, flagEmoji } = require("./../assets/js/country-flags.js");

const REPO_ROOT = path.resolve(__dirname, "..");
const TRAVEL_DIR = path.join(REPO_ROOT, "assets/images/travel");
const IMAGE_EXT_RE = /\.(jpe?g|png|webp)$/i;

function sortPhotos(files) {
  return files.slice().sort((a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
    return a.localeCompare(b, "en", { numeric: true });
  });
}

function buildTravelIndex() {
  if (!fs.existsSync(TRAVEL_DIR)) {
    console.error("assets/images/travel/ 디렉터리를 찾을 수 없습니다:", TRAVEL_DIR);
    process.exit(1);
  }

  const countryDirs = fs
    .readdirSync(TRAVEL_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "en"));

  const manifest = [];
  const warnings = [];

  for (const folder of countryDirs) {
    const abs = path.join(TRAVEL_DIR, folder);
    const photos = sortPhotos(
      fs
        .readdirSync(abs, { withFileTypes: true })
        .filter((entry) => entry.isFile() && !entry.name.startsWith(".") && IMAGE_EXT_RE.test(entry.name))
        .map((entry) => entry.name)
    );

    if (photos.length === 0) {
      warnings.push(`[${folder}] 이미지 파일 없음 — 매니페스트에서 제외`);
      continue;
    }

    manifest.push({
      country: normalizeCountryKey(folder),
      folder,
      flag: flagEmoji(folder),
      cover: photos[0],
      photos,
    });
  }

  const outPath = path.join(TRAVEL_DIR, "index.json");
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  console.log(`assets/images/travel/index.json 생성 완료: 국가 ${manifest.length}개`);
  for (const entry of manifest) {
    console.log(`  - ${entry.flag} ${entry.folder} (${entry.photos.length}장)`);
  }

  if (warnings.length) {
    console.log("\n경고:");
    for (const w of warnings) console.log("  " + w);
  }
}

module.exports = buildTravelIndex;

// scripts/build-index.js가 require해서 buildTravelIndex()를 호출하는 것과 별개로,
// `node scripts/build-travel-index.js`로 이 파일을 직접 실행할 수도 있게 유지한다.
if (require.main === module) {
  buildTravelIndex();
}
