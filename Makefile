SHELL = /bin/bash
PARTS = \
	parts/title.md \
	parts/education.md \
	parts/employment.md \
	parts/supplementary-education.md \
	parts/honors.md \
	parts/teaching.md \
	parts/works.md \
	parts/extracurricular.md \

PANDOC = \
	pandoc \
	--pdf-engine=wkhtmltopdf \
	--pdf-engine-opt=--enable-local-file-access \
	--from=markdown \
	--css=style/cv.css \

all: CV-Sans-Serif.pdf CV-Serif.pdf
clean:
	rm -rf cv.md CV-Sans-Serif.pdf CV-Serif.pdf
push: CV-Sans-Serif.pdf CV-Serif.pdf
	ssh snl 'mkdir -p ~/public_html'
	scp CV-Sans-Serif.pdf CV-Serif.pdf snl:~/public_html/
.PHONY: all clean

cv.md: $(PARTS)
	for part in $^ ; do cat "$$part" ; echo ; done > $@

CV-Sans-Serif.pdf: cv.md style/pdf.css style/sans-serif.css
	$(PANDOC) --css=style/pdf.css --css=style/sans-serif.css --output="$@" $<
CV-Serif.pdf: cv.md style/pdf.css style/serif.css
	$(PANDOC) --css=style/pdf.css --css=style/serif.css --output="$@" $<
