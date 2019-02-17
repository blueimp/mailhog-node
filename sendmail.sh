#!/bin/sh

set -e

cd "$(dirname "$0")"

for MAIL in mail/*.eml; do
  sendmail "$@" < "$MAIL"
done
