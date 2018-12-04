#!/bin/sh
# shellcheck shell=dash

SENDMAIL_SCRIPT="
echo '$(cat mail/01.eml)' | mailhog sendmail
echo '$(cat mail/02.eml)' | mailhog sendmail
echo '$(cat mail/03.eml)' | mailhog sendmail
echo '$(cat mail/04.eml)' | mailhog sendmail
"

setup() {
  docker-compose up -d mailhog
  docker-compose exec mailhog sh -c "$SENDMAIL_SCRIPT"
}

run_tests() {
  docker-compose run --rm test
}

cleanup() {
  local status=$?
  docker-compose down
  exit $status
}

# Clean up on SIGINT and SIGTERM:
trap 'cleanup' INT TERM

setup
run_tests
cleanup
