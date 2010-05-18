#!/bin/sh

ROOT_DIR=$(dirname $(cd $(dirname "$0"); pwd););

LIB_DIR="$ROOT_DIR/lib";
CONFIG_DIR="$ROOT_DIR/config";
APP_DIR="$ROOT_DIR/policyfeed";

java \
    -Dringo.classpath="./**"\
    -jar "$LIB_DIR/run.jar"\
    -D ringo.home="$LIB_DIR/ringo.jar"\
    -e "require.paths.push('$CONFIG_DIR')"\
    -i "$APP_DIR/www.js"
