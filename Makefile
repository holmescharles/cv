SHELL = /bin/sh

PANDOC = pandoc \
	--css=style/main.css \
	--from=markdown \
	--standalone \
	--pdf-engine=wkhtmltopdf \
	--pdf-engine-opt=--enable-local-file-access \
	--pdf-engine-opt=--print-media-type \
	--metadata-file=metadata.yml

PARTS = \
	parts/title.md \
	parts/education.md \
	parts/employment.md \
	parts/supplementary-education.md \
	parts/honors.md \
	parts/teaching.md \
	parts/publications.md \
	parts/conferences.md \
	parts/extracurricular.md

OUTPUTS = \
	index.html \
	pdfs/serif.pdf \
	pdfs/sans-serif.pdf

all: $(OUTPUTS)
.PHONY: all

clean:
	rm -rf index.html pdfs
.PHONY: clean

publish:
	ssh shell 'mkdir -p ~/public_html/'
	rsync -avz --delete index.html icons pdfs style shell:~/public_html/
.PHONY: publish

index.html: $(PARTS) parts/print-me.md
	$(PANDOC) --output="$@" $^

pdfs/serif.pdf: $(PARTS)
	mkdir -p $(@D)
	$(PANDOC) --css=style/serif.css --output="$@" $^

pdfs/sans-serif.pdf: $(PARTS)
	mkdir -p $(@D)
	$(PANDOC) --output="$@" $^
