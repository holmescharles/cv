# Charles Damian "Chuck" Holmes - CV

## Building

Build this cv with `make`. That will create `index.html` and `pdfs/{sans-,}serif.pdf`.

The web page is a sidebar site: pandoc writes one page, `tools/site.py` adds the
sidebar and the timeline script, and `js/timeline.js` draws Education and Employment
as timelines. The PDFs still use the plain `style/pdf*.css` layout.

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
