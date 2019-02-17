'use strict'

/* global describe, it */

const assert = require('assert')

const mailhog = require('.')({
  apiURL: process.env.MAILHOG_API_URL
})

describe('messages', function () {
  it('retrieve mails', async function () {
    const result = await mailhog.messages()
    assert.strictEqual(result.count, 4, 'Returns all emails')
    assert.strictEqual(
      result.items[0].subject,
      'Mail without charset',
      'Returns the decoded mail Subject header for the first mail in the set'
    )
    assert.strictEqual(
      result.items[1].subject,
      'ISO-8859-1',
      'Returns the decoded mail Subject header for the second mail in the set'
    )
    assert.strictEqual(
      result.items[2].subject,
      '日本',
      'Returns the decoded mail Subject header for the third mail in the set'
    )
    assert.strictEqual(
      result.items[3].subject,
      'üäö',
      'Returns the decoded mail Subject header for the fourth mail in the set'
    )
  })

  it('limit the messages range', async function () {
    const result = await mailhog.messages(3, 1)
    assert.strictEqual(result.count, 1, 'Returns a set for the given range')
    assert.strictEqual(
      result.items[0].subject,
      'üäö',
      'Returns the decoded mail Subject header for mail from the given range'
    )
  })
})

describe('search', function () {
  it('search mails containing the query', async function () {
    const result = await mailhog.search(
      mailhog.encode('üäö', 'quoted-printable')
    )
    assert.strictEqual(result.count, 1, 'Returns a list of matching emails')
    assert.strictEqual(
      result.items[0].subject,
      'üäö',
      'Returns the decoded mail Subject header'
    )
  })

  it('search mails from the given user', async function () {
    const result = await mailhog.search('test@example.org', 'from')
    assert.strictEqual(result.count, 4, 'Returns a list of matching emails')
    assert.strictEqual(
      result.items[0].subject,
      'Mail without charset',
      'Returns the decoded mail Subject header sent from the given user'
    )
  })

  it('search mails to the given user', async function () {
    const result = await mailhog.search('nihon@example.org', 'to')
    assert.strictEqual(result.count, 1, 'Returns a list of matching emails')
    assert.strictEqual(
      result.items[0].subject,
      '日本',
      'Returns the decoded mail Subject header sent to the given user'
    )
  })

  it('limit the search results range', async function () {
    const result = await mailhog.search('example.org', undefined, 3, 1)
    assert.strictEqual(result.count, 1, 'Returns a set for the given range')
    assert.strictEqual(
      result.items[0].subject,
      'üäö',
      'Returns the decoded mail Subject header for mail from the given range'
    )
  })
})

describe('latestFrom', function () {
  it('latest mail from a given user', async function () {
    const result = await mailhog.latestFrom('test@example.org')
    assert.strictEqual(
      result.from,
      'Test <test@example.org>',
      'Returns the decoded mail From header sent from the given user'
    )
  })
})

describe('latestTo', function () {
  it('latest mail to a given user', async function () {
    const result = await mailhog.latestTo('nihon@example.org')
    assert.strictEqual(
      result.to,
      '日本 <nihon@example.org>',
      'Returns the decoded mail To header sent to the given user'
    )
  })
})

describe('latestContaining', function () {
  it('latest mail with the query text in the body content', async function () {
    const result = await mailhog.latestContaining('text content')
    assert.strictEqual(
      result.text,
      'text content',
      'Returns the decoded plain text mail content containing the given query'
    )
  })

  it('latest mail with query text in the Subject header', async function () {
    const result = await mailhog.latestContaining('ISO-8859-1')
    assert.strictEqual(
      result.subject,
      'ISO-8859-1',
      'Returns the decoded mail Subject header containing the given query'
    )
  })

  it('latest mail with the query text in the From header', async function () {
    const result = await mailhog.latestContaining('test@example.org')
    assert.strictEqual(
      result.from,
      'Test <test@example.org>',
      'Returns the decoded mail From header containing the given query'
    )
  })

  it('latest mail with the query text in the To header', async function () {
    const result = await mailhog.latestContaining('nihon@example.org')
    assert.strictEqual(
      result.to,
      '日本 <nihon@example.org>',
      'Returns the decoded mail To header containing the given query'
    )
  })
})

describe('encode', function () {
  it('quoted-printable encoding of utf8 string', function () {
    assert.strictEqual(
      mailhog.encode('üäö', 'quoted-printable'),
      '=C3=BC=C3=A4=C3=B6',
      'Returns quoted-printable encoding of utf8 string'
    )
  })

  it('quoted-printable encoding of iso-8859-1 string', function () {
    assert.strictEqual(
      mailhog.encode('Ã¼Ã¤Ã¶', 'quoted-printable', 'iso-8859-1'),
      '=C3=BC=C3=A4=C3=B6',
      'Returns quoted-printable encoding of iso-8859-1 string'
    )
  })

  it('quoted-printable encoding of long utf8 string', function () {
    assert.strictEqual(
      mailhog.encode('üäö'.repeat(10), 'quoted-printable', 'utf8'),
      [
        '=C3=BC=C3=A4=C3=B6'.repeat(4),
        '=C3=BC=C3=A4=C3=B6'.repeat(4),
        '=C3=BC=C3=A4=C3=B6'.repeat(2)
      ].join('=\r\n'),
      'Returns wrapped quoted-printable encoding of utf8 string'
    )
  })

  it('quoted-printable encoding of utf8 string, linelength:10', function () {
    assert.strictEqual(
      mailhog.encode('üäöüäö', 'quoted-printable', 'utf8', 10),
      '=C3=BC=C3=\r\n=A4=C3=B6=\r\n=C3=BC=C3=\r\n=A4=C3=B6',
      'Returns wrapped quoted-printable encoding of utf8 string'
    )
  })

  it('base64 encoding of utf8 string', function () {
    assert.strictEqual(
      mailhog.encode('üäö', 'base64'),
      'w7zDpMO2',
      'Returns base64 encoding of utf8 string'
    )
  })

  it('base64 encoding of iso-8859-1 string', function () {
    assert.strictEqual(
      mailhog.encode('Ã¼Ã¤Ã¶', 'base64', 'iso-8859-1'),
      'w7zDpMO2',
      'Returns base64 encoding of iso-8859-1 string'
    )
  })

  it('base64 encoding of long utf8 string', function () {
    assert.strictEqual(
      mailhog.encode('üäö'.repeat(10), 'base64', 'utf8'),
      'w7zDpMO2'.repeat(9) + 'w7zD\r\npMO2',
      'Returns wrapped base64 encoding of utf8 string'
    )
  })

  it('base64 encoding of utf8 string, linelength:10', function () {
    assert.strictEqual(
      mailhog.encode('üäöüäö', 'base64', 'utf8', 10),
      'w7zDpMO2w7\r\nzDpMO2',
      'Returns wrapped base64 encoding of utf8 string'
    )
  })
})

describe('decode', function () {
  it('quoted-printable decoding to utf8 string', function () {
    assert.strictEqual(
      mailhog.decode('=C3=BC=C3=A4=C3=B6', 'quoted-printable'),
      'üäö',
      'Returns utf8 string from quoted-printable input string'
    )
  })

  it('quoted-printable decoding to iso-8859-1 string', function () {
    assert.strictEqual(
      mailhog.decode('=C3=BC=C3=A4=C3=B6', 'quoted-printable', 'iso-8859-1'),
      'Ã¼Ã¤Ã¶',
      'Returns iso-8859-1 string from quoted-printable input string'
    )
  })

  it('quoted-printable decoding of wrapped string to utf8 string', function () {
    assert.strictEqual(
      mailhog.decode(
        [
          '=C3=BC=C3=A4=C3=B6'.repeat(4),
          '=C3=BC=C3=A4=C3=B6'.repeat(4),
          '=C3=BC=C3=A4=C3=B6'.repeat(2)
        ].join('=\r\n'),
        'quoted-printable'
      ),
      'üäö'.repeat(10),
      'Returns utf8 string from wrapped quoted-printable input string'
    )
  })

  it('base64 decoding to utf8 string', function () {
    assert.strictEqual(
      mailhog.decode('w7zDpMO2', 'base64'),
      'üäö',
      'Returns utf8 string from base64 input string'
    )
  })

  it('base64 decoding to iso-8859-1 string', function () {
    assert.strictEqual(
      mailhog.decode('w7zDpMO2', 'base64', 'iso-8859-1'),
      'Ã¼Ã¤Ã¶',
      'Returns iso-8859-1 string from base64 input string'
    )
  })

  it('base64 decoding of wrapped string to utf8 string', function () {
    assert.strictEqual(
      mailhog.decode('w7zDpMO2'.repeat(9) + 'w7zD\r\npMO2', 'base64'),
      'üäö'.repeat(10),
      'Returns utf8 string from wrapped base64 input string'
    )
  })
})

describe('multipart', function () {
  it('parses quoted-printable encoded text content', async function () {
    const result = await mailhog.messages(3, 1)
    assert.strictEqual(
      result.items[0].text,
      'ü\r\näö',
      'Returns plain text content'
    )
  })

  it('parses base64 encoded text content', async function () {
    const result = await mailhog.latestTo('nihon@example.org')
    assert.strictEqual(result.text, '日本\n', 'Returns plain text content')
  })

  it('parses quoted-printable encoded HTML content', async function () {
    const result = await mailhog.messages(3, 1)
    assert.strictEqual(
      result.items[0].html,
      '<html><head></head><body><strong>ü<br>äö</strong></body></html>',
      'Returns HTML content'
    )
  })
})

describe('charset', function () {
  it('parses mail with utf8 charset', async function () {
    const result = await mailhog.latestTo('nihon@example.org')
    assert.strictEqual(result.text, '日本\n', 'Parses mail with utf8 charset')
  })

  it('parses mail with ISO-8859-1 charset', async function () {
    const result = await mailhog.latestTo('iso-8859-1@example.org')
    assert.strictEqual(result.text, 'üäö', 'Returns plain text content')
  })

  it('parses mail without charset definition', async function () {
    const result = await mailhog.latestTo('no-charset@example.org')
    assert.strictEqual(
      result.text,
      'text content',
      'Returns plain text content'
    )
  })
})

describe('headers', function () {
  it('parses the mail Cc header', async function () {
    const result = await mailhog.latestTo('nihon@example.org')
    assert.strictEqual(
      result.cc,
      '日本 <cc@example.org>',
      'Returns the decoded mail Cc header'
    )
  })

  it('parses the mail Bcc header', async function () {
    const result = await mailhog.latestTo('nihon@example.org')
    assert.strictEqual(
      result.bcc,
      '日本 <bcc@example.org>',
      'Returns the decoded mail Bcc header'
    )
  })

  it('parses the mail Reply-To header', async function () {
    const result = await mailhog.latestTo('nihon@example.org')
    assert.strictEqual(
      result.replyTo,
      '日本 <reply-to@example.org>',
      'Returns the decoded mail Reply-To header'
    )
  })

  it('parses the mail Date header', async function () {
    const result = await mailhog.latestTo('nihon@example.org')
    assert.ok(
      result.deliveryDate instanceof Date,
      'Returns mail Date header as Date object'
    )
    assert.strictEqual(
      result.date.getTime(),
      Date.parse('2016-10-23T18:59:40.000Z'),
      'Returns mail Date header as defined in the composed mail'
    )
  })

  it('parses the mail Delivery-Date header', async function () {
    const result = await mailhog.latestTo('nihon@example.org')
    assert.ok(
      result.deliveryDate instanceof Date,
      'Returns mail Delivery-Date header as Date object'
    )
    assert.ok(
      result.deliveryDate > result.date,
      'Returns mail with Delivery-Date later than Date'
    )
  })
})
