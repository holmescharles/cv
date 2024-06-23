#!/usr/bin/env bash

parts=(
  parts/title-html.md
  parts/education.md
  parts/employment.md
  parts/supplementary-education.md
  parts/honors.md
  parts/teaching.md
  parts/publications.md
  parts/conferences.md
  parts/extracurricular.md
  parts/print-me.md
)

pandoc \
  --standalone \
  --css=style/web.css \
  --output=index.html \
  "${parts[@]}"
