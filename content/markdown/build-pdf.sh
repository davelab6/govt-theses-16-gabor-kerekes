#!/bin/bash

MDDIR="."
OUTDIR="../pdf"
BIB="../bib/KABK-Thesis.bib"
CSL="../bib/american-medical-association.csl"



if [ "$(ls -A $OUTDIR)" ]; then
    echo "removing files from $OUTDIR"
    rm $OUTDIR/*
else
    echo "$OUTDIR is empty"
fi

for file in $MDDIR/*.md
do
    FNAME=$(basename $file)
    FBASE=${FNAME%.*}
    pandoc $file -s -f markdown --latex-engine=xelatex --bibliography=$BIB --csl=$CSL -V mainfont='Junicode' -o $OUTDIR/$FBASE.pdf
done
