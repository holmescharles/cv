SHELL = /bin/sh
PUBLISH_DEST = shell:~/public_html/

PANDOC = pandoc \
	--css=style/main.css \
	--css=style/sans-serif.css \
	--from=markdown

PANDOC_HTML = $(PANDOC) \
	--standalone \
	--css=style/html.css

PANDOC_PDF = $(PANDOC) \
	--pdf-engine=wkhtmltopdf \
	--pdf-engine-opt=--enable-local-file-access \
	--variable=margin-top:0.8in \
	--variable=margin-right:0.8in \
	--variable=margin-bottom:0.8in \
	--variable=margin-left:0.8in \
	--css=style/pdf.css

PARTS = \
	parts/title.md \
	parts/education.md \
	parts/employment.md \
	parts/supplementary-education.md \
	parts/honors.md \
	parts/teaching.md \
	parts/works.md \
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

index.html: $(PARTS) parts/print-me.md
	$(PANDOC_HTML) --output="$@" $^

pdfs/serif.pdf: $(PARTS)
	mkdir -p pdfs
	$(PANDOC_PDF) --css=style/serif.css --output="$@" $^

pdfs/sans-serif.pdf: $(PARTS)
	mkdir -p pdfs
	$(PANDOC_PDF) --output="$@" $^

publish:
	ssh shell 'mkdir -p ~/public_html/'
	rsync -avz --delete index.html icons pdfs style shell:~/public_html/
.PHONY: publish
