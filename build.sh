#!/usr/bin/env bash

PARTS=(
  title
  education
  employment
  supplementary-education
  honors
  teaching
  works
  extracurricular
  )

join_parts() {
  for part in "$@"; do
    cat parts/"$part".md
    echo
  done
}

pandoc() {
  command pandoc \
    --pdf-engine=wkhtmltopdf \
    --pdf-engine-opt=--enable-local-file-access \
    --from=markdown \
    --css=style.css \
    --css=style/pdf.css \
    "$@"
}

mkdir -p CVs
join_parts "${PARTS[@]}" |
  tee \
    >(pandoc --css=style/serif.css --output=CVs/Serif.pdf) \
    >(pandoc --css=style/sans-serif.css --output=CVs/Sans-Serif.pdf) \
    >/dev/null
