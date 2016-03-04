#!/bin/bash

MDDIR="markdown"
OUTDIR="html"
BIB="bib/KABK-Thesis.bib"
CSL="bib/american-medical-association.csl"

echo "emptying $OUTDIR"
rm $OUTDIR/*
#touch $OUTDIR/thesis.html
#pandoc $MDDIR/*.md  --to=html5 --section-divs --bibliography=$BIB --csl=$CSL > $OUTDIR/thesis.html


for file in $MDDIR/*.md
do
    FNAME=$(basename $file)
    FBASE=${FNAME%.*}
    pandoc $MDDIR/metadata.yaml $file --to=html5 --section-divs --bibliography=$BIB --csl=$CSL >> $OUTDIR/$FBASE.html
    echo $FNAME
done


