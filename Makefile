SHELL = /bin/bash

PARTS = \
	parts/preamble.md \
	parts/education.md \
	parts/works.md \
	parts/employment.md \
	parts/teaching.md \
	parts/awards.md \
	parts/interests.md \

PANDOC = \
	pandoc \
	--pdf-engine=wkhtmltopdf \
	--pdf-engine-opt=--enable-local-file-access \
	--from=markdown \
	--metadata-file=metadata.yaml \
	--css=style/cv.css \

all: pdf html

cv.md: $(PARTS)
	for part in $^ ; do cat "$$part" ; echo ; done > $@

pdf: cv.pdf
cv.pdf: cv.md metadata.yaml style/cv.css style/pdf.css
	$(PANDOC) --css=style/pdf.css --output=cv.pdf $<

html: cv.html
cv.html: cv.md metadata.yaml style/cv.css style/html.css
	$(PANDOC) --self-contained --css=style/html.css --output=cv.html $<

push: cv.html
	scp $< toor@eye:/tmp/cv.html
	ssh -t toor@eye sudo mv /tmp/cv.html /home/httpd/htdocs/lab/people/chuck.html

clean:
	rm -rf cv.{md,pdf,html}
.PHONY: all html pdf push clean

$(OUTNAME).md: $(PARTS)
