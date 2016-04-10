#!/bin/bash

TFOLDER="/tmp/hvrra.$$/"
mkdir -p $TFOLDER
echo "TEMP folder is at $TFOLDER"
FILES=lines/*.geojson

for f in $FILES
do
  name=$(basename $f)
  file=${name%.*}
  echo "processing $file"
  jq "{
    type: .type,
    properties: {
      ref: \"${file}\"
    },
    features: [
      .features[] |  select(.geometry.type == \"LineString\")
    ]}" $f > $TFOLDER/$file.geojson
done

topojson -o lines/lines.topojson -s=2 -- $TFOLDER/*.geojson

rm -rf $TFOLDER
