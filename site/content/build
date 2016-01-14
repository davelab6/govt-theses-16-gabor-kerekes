#!/bin/bash

MDDIR="markdown"
OUTDIR="html"
BIB="bib/KABK-Thesis.bib"
CSL="bib/american-medical-association.csl"

rm $OUTDIR/*
for file in $MDDIR/*.md
do
    FNAME=$(basename $file)
    FBASE=${FNAME%.*}
    pandoc $file  --to=html5 --section-divs --bibliography=$BIB --csl=$CSL >> $OUTDIR/$FBASE.html
done
