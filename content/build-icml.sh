#!/bin/bash

MDDIR="markdown"
OUTDIR="icml"
BIB="bib/KABK-Thesis.bib"
CSL="bib/american-medical-association.csl"



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
    pandoc $file -s -f markdown -t icml --bibliography=$BIB --csl=$CSL -o $OUTDIR/$FBASE.icml
done
