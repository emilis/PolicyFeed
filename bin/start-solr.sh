#!/bin/sh

ROOT_DIR=$(dirname $(cd $(dirname "$0"); pwd););

LIB_DIR="$ROOT_DIR/lib";
CONFIG_DIR="$ROOT_DIR/config/config";

java \
  -jar "$LIB_DIR/jetty/start.jar"\
  -Dsolr.solr.home="$ROOT_DIR/search"\
  -Dsolr.data.dir="$ROOT_DIR/data/solr"\
  "$CONFIG_DIR/jetty-solr.xml"
