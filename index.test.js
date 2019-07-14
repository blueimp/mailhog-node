// @ts-check
'use strict'

/* global before, after, describe, it */

const path = require('path')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const assert = require('assert')
const env = process.env

const mailhog = require('.')({
  host: env.MAILHOG_HOST
})

/**
 * Sends all mail configured in the mail directory.
 *
 * @returns {Promise} Resolves when executing sucessfully, rejects otherwise
 */
async function sendAllMail() {
  const sendmailScript = path.join(__dirname, 'sendmail.sh')
  await exec(`${sendmailScript} -S ${env.MAILHOG_HOST}:1025`)
}

/**
 * Deletes all mail from MailHog.
 *
 * @returns {Promise} Resolves when executing sucessfully, rejects otherwise
 */
async function deleteAllMail() {
  const result = await mailhog.deleteAll()
  assert.strictEqual(result.statusCode, 200, 'Responds with status code 200')
}

before(sendAllMail)
after(deleteAllMail)

describe('encode', function() {
  it('quoted-printable encoding of utf8 string', function() {
    assert.strictEqual(
      mailhog.encode('üäö', 'quoted-printable'),
      '=C3=BC=C3=A4=C3=B6',
      'Returns quoted-printable encoding of utf8 string'
    )
  })

  it('quoted-printable encoding of iso-8859-1 string', function() {
    assert.strictEqual(
      mailhog.encode('Ã¼Ã¤Ã¶', 'quoted-printable', 'iso-8859-1'),
      '=C3=BC=C3=A4=C3=B6',
      'Returns quoted-printable encoding of iso-8859-1 string'
    )
  })

  it('quoted-printable encoding of long utf8 string', function() {
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

  it('quoted-printable encoding of utf8 string, linelength:10', function() {
    assert.strictEqual(
      mailhog.encode('üäöüäö', 'quoted-printable', 'utf8', 10),
      '=C3=BC=C3=\r\n=A4=C3=B6=\r\n=C3=BC=C3=\r\n=A4=C3=B6',
      'Returns wrapped quoted-printable encoding of utf8 string'
    )
  })

  it('base64 encoding of utf8 string', function() {
    assert.strictEqual(
      mailhog.encode('üäö', 'base64'),
      'w7zDpMO2',
      'Returns base64 encoding of utf8 string'
    )
  })

  it('base64 encoding of iso-8859-1 string', function() {
    assert.strictEqual(
      mailhog.encode('Ã¼Ã¤Ã¶', 'base64', 'iso-8859-1'),
      'w7zDpMO2',
      'Returns base64 encoding of iso-8859-1 string'
    )
  })

  it('base64 encoding of long utf8 string', function() {
    assert.strictEqual(
      mailhog.encode('üäö'.repeat(10), 'base64', 'utf8'),
      'w7zDpMO2'.repeat(9) + 'w7zD\r\npMO2',
      'Returns wrapped base64 encoding of utf8 string'
    )
  })

  it('base64 encoding of utf8 string, linelength:10', function() {
    assert.strictEqual(
      mailhog.encode('üäöüäö', 'base64', 'utf8', 10),
      'w7zDpMO2w7\r\nzDpMO2',
      'Returns wrapped base64 encoding of utf8 string'
    )
  })
})

describe('decode', function() {
  it('quoted-printable decoding to utf8 string', function() {
    assert.strictEqual(
      mailhog.decode('=C3=BC=C3=A4=C3=B6', 'quoted-printable'),
      'üäö',
      'Returns utf8 string from quoted-printable input string'
    )
  })

  it('quoted-printable decoding to iso-8859-1 string', function() {
    assert.strictEqual(
      mailhog.decode('=C3=BC=C3=A4=C3=B6', 'quoted-printable', 'iso-8859-1'),
      'Ã¼Ã¤Ã¶',
      'Returns iso-8859-1 string from quoted-printable input string'
    )
  })

  it('quoted-printable decoding of wrapped string to utf8 string', function() {
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

  it('base64 decoding to utf8 string', function() {
    assert.strictEqual(
      mailhog.decode('w7zDpMO2', 'base64'),
      'üäö',
      'Returns utf8 string from base64 input string'
    )
  })

  it('base64 decoding to iso-8859-1 string', function() {
    assert.strictEqual(
      mailhog.decode('w7zDpMO2', 'base64', 'iso-8859-1'),
      'Ã¼Ã¤Ã¶',
      'Returns iso-8859-1 string from base64 input string'
    )
  })

  it('base64 decoding of wrapped string to utf8 string', function() {
    assert.strictEqual(
      mailhog.decode('w7zDpMO2'.repeat(9) + 'w7zD\r\npMO2', 'base64'),
      'üäö'.repeat(10),
      'Returns utf8 string from wrapped base64 input string'
    )
  })
})

describe('multipart', function() {
  it('parses quoted-printable encoded text content', async function() {
    const result = await mailhog.latestTo('ueaeoe@example.org')
    assert.strictEqual(result.text, 'ü\r\näö', 'Returns plain text content')
  })

  it('parses quoted-printable encoded HTML content', async function() {
    const result = await mailhog.latestTo('ueaeoe@example.org')
    assert.strictEqual(
      result.html,
      '<strong>ü<br>äö</strong>',
      'Returns HTML content'
    )
  })

  it('parses attachments', async function() {
    const result = await mailhog.latestTo('ueaeoe@example.org')
    assert.strictEqual(result.attachments.length, 2, 'Returns attachments')
    assert.strictEqual(result.attachments[0].name, 'black-80x60.gif')
    assert.strictEqual(result.attachments[0].type, 'image/gif')
    assert.strictEqual(
      Buffer.from(
        result.attachments[0].Body,
        // @ts-ignore (string to BufferEncoding type cast)
        result.attachments[0].encoding
      ).toString('base64'),
      'R0lGODdhUAA8AIABAAAAAP///ywAAAAAUAA8AAACS4SPqcvtD6OctNqLs968+w+G4kiW5o' +
        'mm6sq27gvH8kzX9o3n+s73/g8MCofEovGITCqXzKbzCY1Kp9Sq9YrNarfcrvcLDovH5P' +
        'KsAAA7'
    )
    assert.strictEqual(result.attachments[1].name, 'white-2x1.jpg')
    assert.strictEqual(result.attachments[1].type, 'image/jpeg')
    assert.strictEqual(
      Buffer.from(
        result.attachments[1].Body,
        // @ts-ignore (string to BufferEncoding type cast)
        result.attachments[1].encoding
      ).toString('base64'),
      '/9j/4AAQSkZJRgABAQEAYABgAAD/4QAiRXhpZgAASUkqAAgAAAABABIBAwABAAAABgASAA' +
        'AAAAD/7QAsUGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAA8cAgUACm9iamVjdG5hbWUA/9' +
        'sAQwABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQ' +
        'EBAQEBAQEBAQEBAQEBAQEB/9sAQwEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQ' +
        'EBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB/8AAEQgAAQACAwEiAAIRAQ' +
        'MRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQ' +
        'QEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJS' +
        'YnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiY' +
        'qSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5e' +
        'bn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EAL' +
        'URAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFW' +
        'Jy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdH' +
        'V2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJyt' +
        'LT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A/v4ooooA/9k='
    )
  })
})

describe('charset', function() {
  it('parses mail with utf8 charset', async function() {
    const result = await mailhog.latestTo('nihon@example.org')
    assert.strictEqual(result.text, '日本\n', 'Parses mail with utf8 charset')
  })

  it('parses mail with ISO-8859-1 charset', async function() {
    const result = await mailhog.latestTo('iso-8859-1@example.org')
    assert.strictEqual(result.text, 'üäö', 'Returns plain text content')
  })

  it('parses mail without charset definition', async function() {
    const result = await mailhog.latestTo('no-charset@example.org')
    assert.strictEqual(
      result.text,
      'text content',
      'Returns plain text content'
    )
  })
})

describe('headers', function() {
  it('parses the mail Cc header', async function() {
    const result = await mailhog.latestTo('nihon@example.org')
    assert.strictEqual(
      result.cc,
      '日本 <cc@example.org>',
      'Returns the decoded mail Cc header'
    )
  })

  it('parses the mail Bcc header', async function() {
    const result = await mailhog.latestTo('nihon@example.org')
    assert.strictEqual(
      result.bcc,
      '日本 <bcc@example.org>',
      'Returns the decoded mail Bcc header'
    )
  })

  it('parses the mail Reply-To header', async function() {
    const result = await mailhog.latestTo('nihon@example.org')
    assert.strictEqual(
      result.replyTo,
      '日本 <reply-to@example.org>',
      'Returns the decoded mail Reply-To header'
    )
  })

  it('parses the mail Date header', async function() {
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

  it('parses the mail Delivery-Date header', async function() {
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

describe('messages', function() {
  it('retrieve mails', async function() {
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

  it('limit the messages range', async function() {
    const result = await mailhog.messages(3, 1)
    assert.strictEqual(result.count, 1, 'Returns a set for the given range')
    assert.strictEqual(
      result.items[0].subject,
      'üäö',
      'Returns the decoded mail Subject header for mail from the given range'
    )
  })
})

describe('search', function() {
  it('search mails containing the query', async function() {
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

  it('search mails from the given user', async function() {
    const result = await mailhog.search('test@example.org', 'from')
    assert.strictEqual(result.count, 4, 'Returns a list of matching emails')
    assert.strictEqual(
      result.items[0].subject,
      'Mail without charset',
      'Returns the decoded mail Subject header sent from the given user'
    )
  })

  it('search mails to the given user', async function() {
    const result = await mailhog.search('nihon@example.org', 'to')
    assert.strictEqual(result.count, 1, 'Returns a list of matching emails')
    assert.strictEqual(
      result.items[0].subject,
      '日本',
      'Returns the decoded mail Subject header sent to the given user'
    )
  })

  it('limit the search results range', async function() {
    const result = await mailhog.search('example.org', undefined, 3, 1)
    assert.strictEqual(result.count, 1, 'Returns a set for the given range')
    assert.strictEqual(
      result.items[0].subject,
      'üäö',
      'Returns the decoded mail Subject header for mail from the given range'
    )
  })
})

describe('latestFrom', function() {
  it('latest mail from a given user', async function() {
    const result = await mailhog.latestFrom('test@example.org')
    assert.strictEqual(
      result.from,
      'Test <test@example.org>',
      'Returns the decoded mail From header sent from the given user'
    )
  })
})

describe('latestTo', function() {
  it('latest mail to a given user', async function() {
    const result = await mailhog.latestTo('nihon@example.org')
    assert.strictEqual(
      result.to,
      '日本 <nihon@example.org>',
      'Returns the decoded mail To header sent to the given user'
    )
  })
})

describe('latestContaining', function() {
  it('latest mail with the query text in the body content', async function() {
    const result = await mailhog.latestContaining('text content')
    assert.strictEqual(
      result.text,
      'text content',
      'Returns the decoded plain text mail content containing the given query'
    )
  })

  it('latest mail with query text in the Subject header', async function() {
    const result = await mailhog.latestContaining('ISO-8859-1')
    assert.strictEqual(
      result.subject,
      'ISO-8859-1',
      'Returns the decoded mail Subject header containing the given query'
    )
  })

  it('latest mail with the query text in the From header', async function() {
    const result = await mailhog.latestContaining('test@example.org')
    assert.strictEqual(
      result.from,
      'Test <test@example.org>',
      'Returns the decoded mail From header containing the given query'
    )
  })

  it('latest mail with the query text in the To header', async function() {
    const result = await mailhog.latestContaining('nihon@example.org')
    assert.strictEqual(
      result.to,
      '日本 <nihon@example.org>',
      'Returns the decoded mail To header containing the given query'
    )
  })

  it('latest mail with query text in attachment filename', async function() {
    const result = await mailhog.latestContaining('black-80x60.gif')
    assert.strictEqual(
      result.attachments[0].name,
      'black-80x60.gif',
      'Finds mail for a given attachment filename'
    )
  })
})

describe('releaseMessage', function() {
  after(deleteAllMail)
  after(sendAllMail)

  it('releases the given mail to an outgoing SMTP server', async function() {
    const result = await mailhog.latestTo('nihon@example.org')
    const response = await mailhog.releaseMessage(result.ID, {
      host: 'localhost',
      port: '1025',
      email: 'nihon@example.org'
    })
    assert.strictEqual(
      response.statusCode,
      200,
      'Responds with status code 200'
    )
    const newResult = await mailhog.latestTo('nihon@example.org')
    assert.notStrictEqual(
      result.ID,
      newResult.ID,
      'New search for the same query returns a new ID'
    )
    const listResult = await mailhog.messages()
    assert.strictEqual(
      listResult.count,
      5,
      'Number of mails stored has increased by 1'
    )
  })
})

describe('deleteMessage', function() {
  after(deleteAllMail)
  after(sendAllMail)

  it('deletes the given mail from MailHog storage', async function() {
    const result = await mailhog.latestTo('nihon@example.org')
    const response = await mailhog.deleteMessage(result.ID)
    assert.strictEqual(
      response.statusCode,
      200,
      'Responds with status code 200'
    )
    const newResult = await mailhog.latestTo('nihon@example.org')
    assert.strictEqual(
      newResult,
      0,
      'New search for the deleted mail returns 0'
    )
    const listResult = await mailhog.messages()
    assert.strictEqual(
      listResult.count,
      3,
      'Number of mails stored has decreased by 1'
    )
  })
})

describe('deleteAll', function() {
  after(deleteAllMail)
  after(sendAllMail)

  it('deletes all mail from MailHog storage', async function() {
    const response = await mailhog.deleteAll()
    assert.strictEqual(
      response.statusCode,
      200,
      'Responds with status code 200'
    )
    const listResult = await mailhog.messages()
    assert.strictEqual(
      listResult.count,
      0,
      'Number of mails stored has decreased to 0'
    )
  })
})
