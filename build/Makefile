SHELL = /bin/bash

# comment out to exclude
# also, you may need to reformat css margins
# SUMMARY = ../parts/summary.md

PARTS = \
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

all: html pdf pdf-serif
pdfs: pdf pdf-serif

cv-html.md: ../parts/title-html.md $(PARTS)
cv-pdf.md: ../parts/title-pdf.md $(SUMMARY) $(PARTS)
cv-%.md:
	for part in $^ ; do cat "$$part" ; echo ; done > $@

html: cv.html
cv.html: cv-html.md ../style/cv.css ../style/html.css
	$(PANDOC) --ascii --standalone --embed-resource --css=../style/html.css --output=cv.html $<

pdf: cv.pdf
cv.pdf: cv-pdf.md ../style/cv.css ../style/pdf.css
	$(PANDOC) --css=../style/pdf.css --output=$@ $<

pdf-serif: cv-serif.pdf
cv-serif.pdf: cv-pdf.md ../style/cv.css ../style/pdf.css ../style/serif.css
	$(PANDOC) --css=../style/pdf.css --css=../style/serif.css --output=$@ $<

push: cv.html cv.pdf cv-serif.pdf
	scp cv.html toor@eye:/tmp/chuck.html
	scp cv.pdf toor@eye:/tmp/chuck-sans-serif.pdf
	scp cv-serif.pdf toor@eye:/tmp/chuck-serif.pdf
	ssh -t toor@eye sudo mv /tmp/chuck{.html,-serif.pdf,-sans-serif.pdf} /home/httpd/htdocs/lab/people

clean:
	rm -rf cv-{html,pdf}.md cv{.html,.pdf,-serif.pdf}
.PHONY: all html pdf pdf-serif pdfs push clean
