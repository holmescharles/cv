SHELL = /bin/bash

# SUMMARY = false
# $(info Summary $(if $(SUMMARY),included,excluded))

# $(if $(SUMMARY), ../parts/summary.md) \

PARTS = \
	../parts/title.pdf \
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

all: html pdfs
html: cv.html
pdfs: cv-serif.pdf cv-sans.pdf

md/%: $(PARTS)
	mkdir -p md
	for part in $^ ; do cat "$$part" ; echo ; done > $@

cv.html: md/html ../style/html.css
	$(PANDOC) --ascii --standalone --embed-resource --css=../style/html.css --output="$@" $<
cv-sans.pdf: md/pdf ../style/pdf.css
	$(PANDOC) --css=../style/pdf.css --css=../style/sans-serif.css --output="$@" $<
cv-serif.pdf: md/pdf ../style/pdf.css ../style/serif.css
	$(PANDOC) --css=../style/pdf.css --css=../style/serif.css --output="$@" $<

push: cv.html cv-sans.pdf cv-serif.pdf
	cd .. && ./push.sh

clean:
	rm -rf md cv{.html,-sans.pdf,-serif.pdf}
.PHONY: all html pdfs push clean
