#!/bin/sh
# shellcheck shell=dash

setup() {
  docker-compose up -d mailhog
  echo "$(cat mail/01.eml)" | docker-compose exec -T mailhog MailHog sendmail
  echo "$(cat mail/02.eml)" | docker-compose exec -T mailhog MailHog sendmail
  echo "$(cat mail/03.eml)" | docker-compose exec -T mailhog MailHog sendmail
  echo "$(cat mail/04.eml)" | docker-compose exec -T mailhog MailHog sendmail
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
