PANDOC := \
	pandoc \
	--standalone \
	--pdf-engine=xelatex \
	--citeproc \
	--lua-filter=filters/multiple-bibliographies
OUTNAME := cv

all: pdf html
pdf: build/$(OUTNAME).pdf
html: build/$(OUTNAME).html

build/$(OUTNAME).%: cv.md .FORCE
	mkdir -p build
	$(PANDOC) --output=$@ $<

clean:
	rm -rf build
.FORCE:
.PHONY: .FORCE clean all
