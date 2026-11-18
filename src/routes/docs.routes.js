// ============================================================================
// routes/docs.routes.js  -  the documentation pages, mounted at /doc.
// These return HTML / Mermaid text, not the JSON API.
// ============================================================================
import { Router } from "express";
import { diagrams } from "../docs/diagrams.js";
import { renderApiReference, renderArchitecture, renderGuide } from "../docs/pages.js";
import { AppError } from "../utils/AppError.js";

const router = Router();

// helmet (app.js) sets a strict Content-Security-Policy that would block the
// Mermaid script from the CDN and our inline styles. These read-only doc pages
// get a slightly looser policy that allows exactly those two things.
router.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
      "style-src 'self' 'unsafe-inline'; img-src 'self' data:"
  );
  next();
});

router.get("/", (req, res) => res.type("html").send(renderApiReference()));
router.get("/guide", (req, res) => res.type("html").send(renderGuide()));
router.get("/architecture", (req, res) => res.type("html").send(renderArchitecture()));

// All diagrams as JSON (name, title, description, Mermaid source).
router.get("/diagrams", (req, res) => {
  res.json({ data: Object.entries(diagrams).map(([name, d]) => ({ name, ...d })) });
});

// One diagram as plain text, ready to paste into https://mermaid.live
router.get("/diagrams/:name", (req, res) => {
  // Object.hasOwn avoids matching inherited keys such as "constructor".
  const diagram = Object.hasOwn(diagrams, req.params.name) && diagrams[req.params.name];
  if (!diagram) throw new AppError("Diagram not found", 404, { available: Object.keys(diagrams) });
  res.type("text/plain").send(diagram.code);
});

export default router;
