import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const outputDir = path.join(process.cwd(), "public", "covers");

const palettes = {
  ai: ["#102a43", "#19a974", "#ffcf56", "#f45b69"],
  jazz: ["#1c1f24", "#ec5f67", "#f6c85f", "#53c6be"],
  robotics: ["#17202a", "#4ecdc4", "#ff6b35", "#f7fff7"],
  wellness: ["#19323c", "#70c1b3", "#f25f5c", "#ffe066"],
  career: ["#151515", "#2ec4b6", "#ff9f1c", "#e71d36"],
  design: ["#121212", "#00a7e1", "#ff6f59", "#f7d002"],
};

function svgFor({ key, index }) {
  const [base, accent, warm, alert] = palettes[key];
  const offset = index * 37;

  return `
  <svg width="1200" height="760" viewBox="0 0 1200 760" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wash" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="${base}"/>
        <stop offset="0.58" stop-color="${accent}"/>
        <stop offset="1" stop-color="${warm}"/>
      </linearGradient>
      <pattern id="grid" width="68" height="68" patternUnits="userSpaceOnUse">
        <path d="M 68 0 L 0 0 0 68" fill="none" stroke="#ffffff" stroke-width="1.25" opacity="0.16"/>
      </pattern>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#000000" flood-opacity="0.22"/>
      </filter>
    </defs>
    <rect width="1200" height="760" fill="url(#wash)"/>
    <rect width="1200" height="760" fill="url(#grid)"/>
    <path d="M0 ${510 - offset % 80} C250 ${410 + offset % 90}, 430 ${660 - offset % 120}, 690 ${510 + offset % 60} C900 ${390 - offset % 70}, 1030 ${420 + offset % 85}, 1200 ${310 + offset % 70} L1200 760 L0 760 Z" fill="#ffffff" opacity="0.16"/>
    <g filter="url(#softShadow)" transform="translate(${120 + index * 18}, ${94 + index * 9})">
      <rect x="0" y="210" width="770" height="270" rx="22" fill="#f9fbf7" opacity="0.94"/>
      <rect x="48" y="254" width="250" height="24" rx="12" fill="${base}" opacity="0.88"/>
      <rect x="48" y="310" width="520" height="18" rx="9" fill="#1f2933" opacity="0.26"/>
      <rect x="48" y="352" width="610" height="18" rx="9" fill="#1f2933" opacity="0.18"/>
      <rect x="48" y="404" width="190" height="34" rx="17" fill="${accent}" opacity="0.92"/>
      <rect x="266" y="404" width="156" height="34" rx="17" fill="${warm}" opacity="0.92"/>
      <circle cx="640" cy="326" r="86" fill="${alert}" opacity="0.86"/>
      <circle cx="640" cy="326" r="54" fill="#f9fbf7" opacity="0.96"/>
    </g>
    <g opacity="0.72">
      <path d="M900 120 L1058 212 L1058 396 L900 488 L742 396 L742 212 Z" fill="none" stroke="#ffffff" stroke-width="18"/>
      <path d="M900 185 L1002 244 L1002 363 L900 422 L798 363 L798 244 Z" fill="none" stroke="${warm}" stroke-width="12"/>
      <circle cx="900" cy="304" r="36" fill="${alert}"/>
    </g>
  </svg>`;
}

await fs.mkdir(outputDir, { recursive: true });

await Promise.all(
  Object.keys(palettes).map(async (key, index) => {
    const svg = svgFor({ key, index });
    await sharp(Buffer.from(svg)).png().toFile(path.join(outputDir, `${key}.png`));
  }),
);

console.log(`Generated ${Object.keys(palettes).length} CampusPulse cover assets in ${outputDir}`);
