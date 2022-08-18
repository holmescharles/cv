PANDOC := \
	pandoc \
	--pdf-engine=wkhtmltopdf \
	--from=markdown \
	--citeproc \
	--standalone \
	--css=$(abspath style/cv.css) \
	--lua-filter=filters/multiple-bibliographies
OUTNAME := cv

html: build/$(OUTNAME).html
pdf: build/$(OUTNAME).pdf
tex: build/$(OUTNAME).tex

build/$(OUTNAME).html: cv.md build
	$(PANDOC) --css=$(abspath style/html.css) --output=$@ $<
build/$(OUTNAME).pdf: cv.md build
	$(PANDOC) --css=$(abspath style/pdf.css) --output=$@ $<
build/$(OUTNAME).tex: cv.md build
	$(PANDOC) --css=$(abspath style/pdf.css) --output=$@ $<

all: html pdf tex
build:
	mkdir -p build
clean:
	rm -rf build
.FORCE:
.PHONY: .FORCE clean all
