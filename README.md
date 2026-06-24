# Gurbani Diff

A side-by-side tool for comparing how the same Gurbani is divided into lines across different
digitizations of Sri Guru Granth Sahib. It aligns the verse divisions used by **BaniDB** and
**Shabad OS** so scholars and editors can find and reconcile where the two sources break lines
differently.

## What it does

- **Side-by-side compare**: pulls the same shabad from each source and lines them up row by row.
- **Re-split and merge**: split a line at any word boundary, or merge a split back into the
  previous row, to model how an alignment should read.
- **Shift alignment**: offset one source's lines relative to the other to recover from a missing
  or extra line break.
- **Jump to differences**: scan forward to the next ang (page) where the two sources disagree.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS. Gurbani text is fetched from the BaniDB API;
line-split metadata comes from Shabad OS.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

---

One of a suite of Gurmukhi and Gurbani tools. More at [thehimmat.com](https://thehimmat.com).
