import assert from 'assert'
import mailhog from './cjs/index'

const mailhogClient = mailhog({
  baseUrl: process.env.MAILHOG_HOST,
})

// Throw for any unhandled rejections in Promise chains:
process.on('unhandledRejection', reason => {
  console.error(reason)
  process.exit(1)
})
;(async () => {
  let result = await mailhogClient.getLatest('nihon@example.org')

  assert.strictEqual(
    result.content,
    '日本\n',
    'Parses base64 encoded plain text mails',
  )

  result = await mailhogClient.getLatest('ueaeoe@example.org')

  assert.strictEqual(
    result.content,
    '<html><head></head><body><strong>ü<br>äö</strong></body></html>',
    'Parses quoted-printable multipart HTML mails',
  )

  result = await mailhogClient.getLatest('ueaeoe@example.org', true)

  assert.strictEqual(
    result.content,
    'ü\r\näö',
    'Returns the plain text version if requested',
  )

  result = await mailhogClient.getLatest('iso-8859-1@example.org')

  assert.strictEqual(
    result.content,
    'üäö',
    'Parses quoted-printable encoded mails with ISO-8859-1 charset',
  )

  result = await mailhogClient.getLatest('no-charset@example.org')

  assert.strictEqual(
    result.content,
    'text content',
    'Handles Content-Type headers without charset definition'
  )

  result = await mailhogClient.search('example.org')

  assert.strictEqual(result.count, 4, 'Returns a list of matching emails')

  assert.deepStrictEqual(
    mailhogClient.getText(result.items[3]),
    {
      type:    'text/plain; charset=utf-8',
      content: 'ü\r\näö',
    },
    'Returns the decoded plain text version of an email object',
  )

  assert.deepStrictEqual(
    mailhogClient.getHTML(result.items[3]),
    {
      type:    'text/html; charset=utf-8',
      content:
        '<html><head></head><body><strong>ü<br>äö</strong></body></html>',
    },
    'Returns the decoded HTML version of an email object',
  )

  result = await mailhogClient.getAll()

  assert.strictEqual(result.total, 4)
  assert.strictEqual(result.start, 0)
  assert.strictEqual(result.count, 4)

  // this test is repeated
  assert.deepStrictEqual(
    mailhogClient.getText(result.items[3]),
    {
      type:    'text/plain; charset=utf-8',
      content: 'ü\r\näö',
    },
    'Returns the decoded plain text version of an email object',
  )

  result = await mailhogClient.deleteAll()

  assert.strictEqual(result, undefined)

  result = await mailhogClient.search('example.org')

  assert.strictEqual(result.count, 0, 'Returns no emails')
})()
