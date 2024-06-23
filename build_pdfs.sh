#!/usr/bin/env bash

parts=(
  parts/title-pdf.md
  parts/education.md
  parts/employment.md
  parts/supplementary-education.md
  parts/honors.md
  parts/teaching.md
  parts/publications.md
  parts/conferences.md
  parts/extracurricular.md
)

build() {
  css="$1"
  output="$2"
  command pandoc \
    --pdf-engine=weasyprint \
    --css="$css" \
    --output="$output" \
    "${parts[@]}"
}

mkdir -p pdfs
build style/pdf-sans-serif.css pdfs/sans-serif.pdf
build style/pdf-serif.css pdfs/serif.pdf
