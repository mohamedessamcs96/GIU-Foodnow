// Builds a standalone static copy of the documentation into ./docs-site
// (no server or database needed), ready to deploy on Vercel / Netlify / GitHub Pages.
// Usage: npm run docs:build
import { mkdir, writeFile } from "node:fs/promises";
import { renderApiReference, renderArchitecture, renderGuide } from "../src/docs/pages.js";

// Rewrite server URLs (/doc/...) into relative links between the static files.
const toStatic = (html) =>
  html
    .replace(/<p><a href="\/doc\/diagrams\/[^"]+">raw Mermaid source<\/a><\/p>/g, "")
    .replaceAll('href="/doc/guide"', 'href="index.html"')
    .replaceAll('href="/doc/architecture"', 'href="architecture.html"')
    .replaceAll('href="/doc"', 'href="api.html"');

const pages = {
  "index.html": renderGuide(),
  "architecture.html": renderArchitecture(),
  "api.html": renderApiReference(),
};

await mkdir("docs-site", { recursive: true });
for (const [file, html] of Object.entries(pages)) {
  await writeFile(`docs-site/${file}`, toStatic(html));
  console.log("wrote docs-site/" + file);
}
