#!/bin/sh

ROOT_DIR=$(dirname $(cd $(dirname "$0"); pwd););

LIB_DIR="$ROOT_DIR/lib";
CONFIG_DIR="$ROOT_DIR/config";
MODULES_DIR="$ROOT_DIR/modules";
TEST_DIR="$ROOT_DIR/test";

java \
    -Dringo.classpath="./**"\
    -jar "$LIB_DIR/run.jar"\
    -D ringo.home="$LIB_DIR/ringo.jar"\
    -e "require.paths.push('$CONFIG_DIR', '$MODULES_DIR')"\
    "$TEST_DIR/all.js"

