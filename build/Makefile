SHELL = /bin/bash

PARTS = \
	../parts/education.md \
	../parts/works.md \
	../parts/employment.md \
	../parts/teaching.md \
	../parts/awards.md \
	../parts/interests.md \

PANDOC = \
	pandoc \
	--pdf-engine=wkhtmltopdf \
	--pdf-engine-opt=--enable-local-file-access \
	--from=markdown \
	--metadata-file=../metadata.yaml \
	--css=../style/cv.css \

all: pdf-serif pdf-sans-serif html
pdf: pdf-serif pdf-sans-serif

cv-html.md: ../parts/preamble-html.md $(PARTS)
cv-pdf.md: ../parts/preamble-pdf.md $(PARTS)
cv-%.md:
	for part in $^ ; do cat "$$part" ; echo ; done > $@

html: cv.html
cv.html: cv-html.md ../metadata.yaml ../style/cv.css ../style/html.css
	$(PANDOC) --standalone --embed-resource --css=../style/html.css --output=cv.html $<

pdf-serif: cv-serif.pdf
cv-serif.pdf: cv-pdf.md ../metadata.yaml ../style/cv.css ../style/pdf.css ../style/serif.css
	$(PANDOC) --css=../style/pdf.css --css=../style/serif.css --output=$@ $<

pdf-sans-serif: cv-sans-serif.pdf
cv-sans-serif.pdf: cv-pdf.md ../metadata.yaml ../style/cv.css ../style/pdf.css ../style/sans-serif.css
	$(PANDOC) --css=../style/pdf.css --css=../style/sans-serif.css --output=$@ $<

push: cv.html cv-serif.pdf cv-sans-serif.pdf
	scp cv.html toor@eye:/tmp/chuck.html
	scp cv-serif.pdf toor@eye:/tmp/chuck-serif.pdf
	scp cv-sans-serif.pdf toor@eye:/tmp/chuck-sans-serif.pdf
	ssh -t toor@eye sudo mv /tmp/chuck{.html,-serif.pdf,-sans-serif.pdf} /home/httpd/htdocs/lab/people

clean:
	rm -rf cv-{html,pdf}.md cv{.html,-serif.pdf,-sans-serif.pdf}
.PHONY: all html pdf-serif pdf-sans-serif push clean

$(OUTNAME).md: $(PARTS)
