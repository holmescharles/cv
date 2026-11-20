shared_parts = \
	parts/education.md \
	parts/employment.md \
	parts/publications.md \
	parts/preprints.md \
	parts/conferences.md \
	parts/honors.md \
	parts/teaching.md \
	parts/training.md \
	parts/service.md \
	parts/extracurricular.md

html_parts = parts/title-html.md $(shared_parts) parts/print-me.md
pdf_parts = parts/title-pdf.md $(shared_parts)


all: html pdfs
html: index.html
pdfs: pdfs/serif.pdf pdfs/sans-serif.pdf
.PHONY: all html pdfs

clean:
	rm -rf index.html pdfs
.PHONY: clean

index.html: $(html_parts) style/site.css js/timeline.js tools/site.py
	pandoc --section-divs --css=style/site.css --standalone \
		--metadata pagetitle="Chuck Holmes — CV" --output="$@" $(html_parts)
	python3 tools/site.py "$@"

pdfs/%.pdf: $(pdf_parts)
	mkdir -p "$(dir $@)"
	pandoc --css="style/pdf-$*.css" --pdf-engine=weasyprint --output="$@" $^
