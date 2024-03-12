SHELL = /bin/bash

all: CV-Sans-Serif.pdf CV-Serif.pdf
clean:
	rm -rf cv.md CV-Sans-Serif.pdf CV-Serif.pdf
push: CV-Sans-Serif.pdf CV-Serif.pdf
	ssh snl 'mkdir -p ~/public_html'
	scp CV-Sans-Serif.pdf CV-Serif.pdf snl:~/public_html/
.PHONY: all clean

CV-Sans-Serif.pdf: cv.md style/pdf.css style/sans-serif.css
	$(PANDOC) --css=style/pdf.css --css=style/sans-serif.css --output="$@" $<
CV-Serif.pdf: cv.md style/pdf.css style/serif.css
	$(PANDOC) --css=style/pdf.css --css=style/serif.css --output="$@" $<
