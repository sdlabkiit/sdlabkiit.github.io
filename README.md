# SDlab website

Source for **https://sdlabkiit.github.io**, the website of SDlab (Sumit Dass Laboratory), School of Electronics Engineering, KIIT University.

## Updating content

All content lives in JSON files under `data/`. You rarely need to touch the HTML or JavaScript.

| What | File |
|---|---|
| Gallery slides (images go in the same folder) | `data/gallery/gallery.json` |
| Research areas | `data/research/research.json` |
| Publications (`type`: journal, conference, review, book-chapter, patent) | `data/publications/publications.json` |
| Team members (photos in `data/team/`) | `data/team/team.json` |
| Projects | `data/projects/projects.json` |
| News | `data/news/news.json` |
| PI profile links (footer) | `data/profile/profile.json` |
| Lab overview PDF | `assets/sdlab-overview.pdf` |

## Previewing locally

The page loads its JSON with `fetch()`, which browsers block for files opened directly from disk. Preview with a local server instead, for example VS Code's **Live Server** extension, or:

```
python -m http.server
```

then open http://localhost:8000.

## Publishing

Commit and push to `main`. GitHub Pages rebuilds the site within a minute or two.
