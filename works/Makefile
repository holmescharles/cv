OUTPUT = works.md

$(OUTPUT): $(wildcard bibs/*.bib)
	@echo ATTENTION - add "shared first authorship" comment
	./build_md > $@
clean:
	rm -rf $(OUTPUT)

