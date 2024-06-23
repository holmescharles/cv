all: html pdfs
clean:
	rm -rf index.html pdfs
html:
	./build_html.sh
pdfs:
	./build_pdfs.sh
.PHONY: all clean html pdfs

