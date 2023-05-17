SHELL = /bin/bash

$(info Summary $(if $(SUMMARY),included,excluded))

PARTS = \
	$(if $(SUMMARY), ../parts/summary.md) \
	../parts/education.md \
	../parts/employment.md \
	../parts/supp-education.md \
	../parts/honors.md \
	../parts/teaching.md \
	../parts/works.md \
	../parts/extracurricular.md \

PANDOC = \
	pandoc \
	--pdf-engine=wkhtmltopdf \
	--pdf-engine-opt=--enable-local-file-access \
	--from=markdown \
	--css=../style/cv.css \

all: html pdf-sans pdf-serif
pdfs: pdf-sans pdf-serif

cv-html.md: ../parts/title-html.md $(PARTS)
cv-pdf.md: ../parts/title-pdf.md $(PARTS)
cv-%.md:
	for part in $^ ; do cat "$$part" ; echo ; done > $@

html: cv.html
cv.html: cv-html.md ../style/cv.css ../style/html.css
	$(PANDOC) --ascii --standalone --embed-resource --css=../style/html.css --output=cv.html $<

pdf-sans: cv-sans.pdf
cv-sans.pdf: cv-pdf.md ../style/cv.css ../style/pdf.css
	$(PANDOC) --css=../style/pdf.css --output=$@ $<

pdf-serif: cv-serif.pdf
cv-serif.pdf: cv-pdf.md ../style/cv.css ../style/pdf.css ../style/serif.css
	$(PANDOC) --css=../style/pdf.css --css=../style/serif.css --output=$@ $<

push: cv.html cv-sans.pdf cv-serif.pdf
	cd .. && ./push.sh

clean:
	rm -rf cv-{html,pdf}.md cv{.html,.pdf,-serif.pdf}
.PHONY: all html pdf pdf-serif pdfs push clean
