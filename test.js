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
    '<html><head></head><body><strong>üäö</strong></body></html>',
    'Parses quoted-printable multipart HTML mails'
  )
})

mailhog.getLatest('ueaeoe@example.org', true).then(function (result) {
  assert.strictEqual(
    result.content,
    'üäö',
    'Returns the plain text version if requested'
  )
})

mailhog.search('example.org').then(function (result) {
  assert.strictEqual(
    result.count,
    2,
    'Returns a list of matching emails'
  )
  assert.deepStrictEqual(
    mailhog.getText(result.items[1]),
    {
      type: 'text/plain; charset=utf-8',
      content: 'üäö'
    },
    'Returns the decoded plain text version of an email object'
  )
  assert.deepStrictEqual(
    mailhog.getHTML(result.items[1]),
    {
      type: 'text/html; charset=utf-8',
      content: '<html><head></head><body><strong>üäö</strong></body></html>'
    },
    'Returns the decoded HTML version of an email object'
  )
})
