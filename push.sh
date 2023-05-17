#!/usr/bin/env sh
scp build/cv.html toor@eye:/tmp/chuck.html
scp build/cv-sans.pdf toor@eye:/tmp/chuck-sans-serif.pdf
scp build/cv-serif.pdf toor@eye:/tmp/chuck-serif.pdf
ssh -t toor@eye sudo mv /tmp/chuck{.html,-serif.pdf,-sans-serif.pdf} /home/httpd/htdocs/lab/people
