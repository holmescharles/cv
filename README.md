# Charles Damian "Chuck" Holmes - CV

## Building

Build this cv with `make`. That will create `index.html` and `pdfs/{sans-,}serif.pdf`.

The web page is one scrolling page: pandoc writes it, `tools/site.py` gathers
Education, Supplementary Education and Employment into a Timeline section and adds
the sidebar, which follows the scroll. `js/timeline.js` draws every dated entry on
the page on one pinned timeline strip. The colours, light and dark (the dark set
follows the system setting), are tokens in `style/site.css`, with how each set was
validated. The PDFs still use the plain `style/pdf*.css` layout.

**This folder is the live site.** It is served from eye-hand, so running `make` here
publishes immediately. To preview a change, copy the tracked files somewhere else and
build there.

`style/web.css` is no longer used by the build, but the page published from `main`
still links it. Delete it when this design is merged and rebuilt.

## Requirements

- pandoc
- python3 (for `tools/site.py`)
- weasyprint (for pdfs): `uv tool install weasyprint`

## Fonts

The web page uses [0xProto](https://github.com/0xType/0xProto), self-hosted from
`fonts/` under the SIL Open Font License (`fonts/0xProto-LICENSE.txt`).
