// 국가명(폴더명) -> 국기 이모지 매핑 유틸.
// 이모지를 직접 나열하는 대신 ISO 3166-1 alpha-2 코드만 저장해두고
// 정규 지역 표시자(regional indicator) 코드포인트로 조합해서 만든다 —
// 이모지 오타 위험이 없고, 브라우저/노드 양쪽에서 동일하게 동작한다.
// travel/index.json을 만드는 scripts/build-travel-index.js(node)와
// 브라우저에서 그리드를 렌더링하는 assets/js/travel.js가 이 파일을 공유한다.
(function (root) {
  var COUNTRY_CODES = {
    korea: "KR",
    japan: "JP",
    china: "CN",
    hongkong: "HK",
    taiwan: "TW",
    mongolia: "MN",
    vietnam: "VN",
    thailand: "TH",
    laos: "LA",
    cambodia: "KH",
    myanmar: "MM",
    philippines: "PH",
    malaysia: "MY",
    singapore: "SG",
    indonesia: "ID",
    india: "IN",
    nepal: "NP",
    kazakhstan: "KZ",
    kyrgyzstan: "KG",
    uzbekistan: "UZ",
    tajikistan: "TJ",
    turkmenistan: "TM",
    turkey: "TR",
    georgia: "GE",
    armenia: "AM",
    azerbaijan: "AZ",
    russia: "RU",
    austria: "AT",
    czechrepublic: "CZ",
    slovakia: "SK",
    hungary: "HU",
    poland: "PL",
    germany: "DE",
    switzerland: "CH",
    liechtenstein: "LI",
    france: "FR",
    monaco: "MC",
    spain: "ES",
    portugal: "PT",
    italy: "IT",
    vaticancity: "VA",
    sanmarino: "SM",
    croatia: "HR",
    slovenia: "SI",
    bosniaandherzegovina: "BA",
    serbia: "RS",
    montenegro: "ME",
    northmacedonia: "MK",
    albania: "AL",
    greece: "GR",
    bulgaria: "BG",
    romania: "RO",
    moldova: "MD",
    ukraine: "UA",
    belarus: "BY",
    lithuania: "LT",
    latvia: "LV",
    estonia: "EE",
    finland: "FI",
    sweden: "SE",
    norway: "NO",
    denmark: "DK",
    iceland: "IS",
    ireland: "IE",
    unitedkingdom: "GB",
    uk: "GB",
    netherlands: "NL",
    belgium: "BE",
    luxembourg: "LU",
    egypt: "EG",
    morocco: "MA",
    tunisia: "TN",
    algeria: "DZ",
    jordan: "JO",
    israel: "IL",
    lebanon: "LB",
    uae: "AE",
    unitedarabemirates: "AE",
    qatar: "QA",
    saudiarabia: "SA",
    oman: "OM",
    iran: "IR",
    iraq: "IQ",
    kenya: "KE",
    tanzania: "TZ",
    southafrica: "ZA",
    ethiopia: "ET",
    madagascar: "MG",
    usa: "US",
    unitedstates: "US",
    canada: "CA",
    mexico: "MX",
    cuba: "CU",
    brazil: "BR",
    argentina: "AR",
    chile: "CL",
    peru: "PE",
    colombia: "CO",
    ecuador: "EC",
    bolivia: "BO",
    uruguay: "UY",
    paraguay: "PY",
    venezuela: "VE",
    australia: "AU",
    newzealand: "NZ",
    fiji: "FJ",
  };

  function normalizeCountryKey(name) {
    return String(name || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  function codeToFlagEmoji(code) {
    return code
      .toUpperCase()
      .replace(/./g, function (ch) {
        return String.fromCodePoint(127397 + ch.charCodeAt(0));
      });
  }

  function flagEmoji(nameOrFolder) {
    var code = COUNTRY_CODES[normalizeCountryKey(nameOrFolder)];
    return code ? codeToFlagEmoji(code) : "🏳️";
  }

  var api = {
    COUNTRY_CODES: COUNTRY_CODES,
    normalizeCountryKey: normalizeCountryKey,
    flagEmoji: flagEmoji,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.CountryFlags = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
