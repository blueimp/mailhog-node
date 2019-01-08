#!/usr/bin/env node

'use strict'

const assert = require('assert')
const mailhog = require('./mailhog')({
  apiURL: process.env.MAILHOG_API_URL
})

// Throw for any unhandled rejections in Promise chains:
process.on('unhandledRejection', function (reason) {
  console.error(reason)
  process.exit(1)
})

mailhog.getLatest('nihon@example.org').then(function (result) {
  assert.strictEqual(
    result.content,
    '日本\n',
    'Parses base64 encoded plain text mails'
  )
})

mailhog.getLatest('ueaeoe@example.org').then(function (result) {
  assert.strictEqual(
    result.content,
    '<html><head></head><body><strong>ü<br>äö</strong></body></html>',
    'Parses quoted-printable multipart HTML mails'
  )
})

mailhog.getLatest('ueaeoe@example.org', true).then(function (result) {
  assert.strictEqual(
    result.content,
    'ü\r\näö',
    'Returns the plain text version if requested'
  )
})

mailhog.getLatest('iso-8859-1@example.org').then(function (result) {
  assert.strictEqual(
    result.content,
    'üäö',
    'Parses quoted-printable encoded mails with ISO-8859-1 charset'
  )
})

mailhog.getLatest('no-charset@example.org').then(function (result) {
  assert.strictEqual(
    result.content,
    'text content',
    'Handles Content-Type headers without charset definition'
  )
})

mailhog.search('example.org').then(function (result) {
  assert.strictEqual(
    result.count,
    4,
    'Returns a list of matching emails'
  )
  assert.deepStrictEqual(
    mailhog.getText(result.items[3]),
    {
      type: 'text/plain; charset=utf-8',
      content: 'ü\r\näö'
    },
    'Returns the decoded plain text version of an email object'
  )
  assert.deepStrictEqual(
    mailhog.getHTML(result.items[3]),
    {
      type: 'text/html; charset=utf-8',
      content: '<html><head></head><body><strong>ü<br>äö</strong></body></html>'
    },
    'Returns the decoded HTML version of an email object'
  )
})
