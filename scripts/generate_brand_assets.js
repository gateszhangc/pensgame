const fs = require("node:fs/promises");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const brandDir = path.join(root, "assets", "brand");
const fontDir = path.join(root, "assets", "fonts");
const fonts = {
  displayBold: path.join(fontDir, "BigShoulders-Bold.ttf"),
  displayRegular: path.join(fontDir, "BigShoulders-Regular.ttf"),
  sansBold: path.join(fontDir, "InstrumentSans-Bold.ttf"),
  sansRegular: path.join(fontDir, "InstrumentSans-Regular.ttf"),
  mono: path.join(fontDir, "JetBrainsMono-Regular.ttf")
};

function runMagick(args) {
  execFileSync("magick", args, { stdio: "inherit" });
}

async function writeFile(filePath, contents) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, "utf8");
}

async function createLogoMarkSvg() {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-labelledby="title desc">
  <title id="title">Pens Game logo mark</title>
  <desc id="desc">An original black and gold monogram inspired by speed lanes, black ice, and editorial sports graphics.</desc>
  <defs>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffe28a"/>
      <stop offset="45%" stop-color="#ffbf2f"/>
      <stop offset="100%" stop-color="#b97700"/>
    </linearGradient>
    <linearGradient id="ice" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#eef7ff"/>
      <stop offset="100%" stop-color="#8cc8ff"/>
    </linearGradient>
    <linearGradient id="shadow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10141d"/>
      <stop offset="100%" stop-color="#05070b"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="220" fill="#05070b"/>
  <path d="M168 154h346c76 0 161 17 219 70c55 49 82 114 82 183c0 62-20 112-60 149c-20 18-42 32-67 42c36 12 66 31 90 60c27 32 41 73 41 121c0 69-27 126-80 170c-56 46-131 69-224 69H168z" fill="url(#gold)"/>
  <path d="M326 272h186c48 0 86 9 116 29c33 22 49 54 49 95c0 44-17 77-51 99c-30 20-69 30-114 30H326z" fill="url(#shadow)"/>
  <path d="M326 592h211c48 0 84 10 109 31c27 22 40 52 40 90c0 38-13 67-40 86c-25 18-61 27-107 27H326z" fill="url(#shadow)"/>
  <path d="M548 160L357 870H231l191-710z" fill="url(#ice)" opacity=".96"/>
  <path d="M579 328h176" stroke="#fff3c2" stroke-width="22" stroke-linecap="square" opacity=".75"/>
  <path d="M593 685h162" stroke="#d8ebff" stroke-width="22" stroke-linecap="square" opacity=".65"/>
  <path d="M174 145L94 915" stroke="#ffbf2f" stroke-width="12" opacity=".38"/>
  <path d="M824 129L742 897" stroke="#8cc8ff" stroke-width="8" opacity=".25"/>
</svg>
`;

  await writeFile(path.join(brandDir, "logo-mark.svg"), svg);
}

function createLogoMarkPngs() {
  runMagick([
    path.join(brandDir, "logo-mark.svg"),
    "-background",
    "none",
    "-resize",
    "1024x1024",
    path.join(brandDir, "logo-mark.png")
  ]);

  runMagick([
    path.join(brandDir, "logo-mark.png"),
    "-resize",
    "256x256",
    path.join(brandDir, "favicon.png")
  ]);

  runMagick([
    path.join(brandDir, "logo-mark.png"),
    "-resize",
    "180x180",
    path.join(brandDir, "apple-touch-icon.png")
  ]);
}

function createLogoWordmark() {
  runMagick([
    "-size",
    "1600x480",
    "xc:none",
    "(",
    path.join(brandDir, "logo-mark.png"),
    "-resize",
    "320x320",
    ")",
    "-geometry",
    "+76+80",
    "-composite",
    "-stroke",
    "#ffbf2f55",
    "-strokewidth",
    "4",
    "-draw",
    "line 402,82 1550,82",
    "-draw",
    "line 402,398 1550,398",
    "-font",
    fonts.displayBold,
    "-pointsize",
    "246",
    "-kerning",
    "9",
    "-fill",
    "#ffcf58",
    "-annotate",
    "+420+236",
    "PENS",
    "-font",
    fonts.sansBold,
    "-pointsize",
    "118",
    "-fill",
    "#f3f7ff",
    "-annotate",
    "+423+345",
    "GAME",
    "-font",
    fonts.mono,
    "-pointsize",
    "42",
    "-fill",
    "#9eabc4",
    "-annotate",
    "+426+396",
    "PITTSBURGH SCHEDULE HUB",
    path.join(brandDir, "logo-wordmark.png")
  ]);
}

function createSocialCard() {
  runMagick([
    "-size",
    "1200x630",
    "xc:#07090d",
    "-fill",
    "#101722",
    "-draw",
    "polygon 0,0 480,0 220,630 0,630",
    "-fill",
    "#ffbf2f22",
    "-draw",
    "polygon 0,540 1200,310 1200,630 0,630",
    "-stroke",
    "#ffbf2f66",
    "-strokewidth",
    "4",
    "-draw",
    "line 120,0 0,630",
    "-draw",
    "line 280,0 160,630",
    "-stroke",
    "#9ad7ff3f",
    "-strokewidth",
    "3",
    "-draw",
    "line 940,0 760,630",
    "-draw",
    "line 1080,0 900,630",
    "(",
    path.join(brandDir, "logo-mark.png"),
    "-resize",
    "300x300",
    ")",
    "-geometry",
    "+82+64",
    "-composite",
    "-font",
    fonts.displayBold,
    "-pointsize",
    "200",
    "-kerning",
    "8",
    "-fill",
    "#ffd15c",
    "-annotate",
    "+410+240",
    "PENS",
    "-font",
    fonts.sansBold,
    "-pointsize",
    "92",
    "-fill",
    "#f2f6ff",
    "-annotate",
    "+414+340",
    "GAME",
    "-font",
    fonts.sansRegular,
    "-pointsize",
    "40",
    "-fill",
    "#c3cee1",
    "-annotate",
    "+414+410",
    "Real Pittsburgh Penguins schedule data",
    "-font",
    fonts.mono,
    "-pointsize",
    "30",
    "-fill",
    "#92a4c4",
    "-annotate",
    "+414+470",
    "Independent fan-made game hub",
    path.join(brandDir, "social-card.png")
  ]);
}

async function main() {
  await createLogoMarkSvg();
  createLogoMarkPngs();
  createLogoWordmark();
  createSocialCard();
  console.log(`Brand assets written to ${brandDir}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
