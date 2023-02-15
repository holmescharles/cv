SHELL := /bin/bash

PARTS = \
	parts/preamble.md \
	parts/education.md \
	parts/employment.md \
	works/works.md \
	parts/teaching.md \
	parts/awards.md \
	parts/interests.md

PANDOC := \
	pandoc \
	--pdf-engine=wkhtmltopdf \
	--from=markdown \
	--standalone \
	--metadata-file=metadata.yaml \
	--css=$(abspath style/cv.css) \

OUTNAME := cv

no_default:
md: $(OUTNAME).md
pdf: $(OUTNAME).pdf
html: $(OUTNAME).html
clean:
	rm -rf $(OUTNAME).{md,pdf,html,tex}
.PHONY: no_default md html pdf clean

$(OUTNAME).md: $(PARTS)
	./gapcat $^ > $@
$(OUTNAME).html: $(OUTNAME).md
	$(PANDOC) --css=$(abspath style/html.css) --output=$@ $<
$(OUTNAME).pdf: $(OUTNAME).md
	$(PANDOC) --css=$(abspath style/pdf.css) --output=$@ $<
