'use strict'

/*
 * NodeJS library to interact with the MailHog API.
 * https://github.com/blueimp/mailhog-node
 *
 * Copyright 2016, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 */

 // Sends a GET request to the given url.
 // Returns a promise that resolves with parsed JSON data.
function getJSON (url) {
  const http = url.startsWith('https') ? 'https' : 'http'
  return new Promise((resolve, reject) => {
    require(http).get(url, (response) => {
      let body = ''
      response
        .on('data', (chunk) => { body += chunk })
        .on('end', () => {
          try {
            resolve(JSON.parse(body))
          } catch (error) {
            reject(error)
          }
        })
    }).on('error', reject)
  })
}

// Decode the given buffer with the given charset to a JavaScript string.
// If no charset is given, decodes using an utf8 charset.
function charsetDecode (buffer, charset) {
  if (!charset || /utf-?8/i.test(charset)) {
    return buffer.toString()
  }
  return require('iconv-lite').decode(buffer, charset)
}

// Decodes the given string using the given encoding.
// encoding can be base64|quoted-printable|7bit|8bit|binary
// 7bit|8bit|binary will be returned as is.
function decode (str, encoding, charset) {
  switch ((encoding || '').toLowerCase()) {
    case 'base64':
      return charsetDecode(new Buffer(str, 'base64'), charset)
    case 'quoted-printable':
      return charsetDecode(require('libqp').decode(str), charset)
    default:
      return str
  }
}

// Returns the content part matching the given content-type.
// * mail is an object returned by MailHog for an email message
// * typeRegExp is a regular expression matched against the parts' content-type
// Returns an object with type (content-type) and content (decoded) properties.
function getContentPart (mail, typeRegExp) {
  let parts = [mail.Content]
  if (mail.MIME) parts = parts.concat(mail.MIME.Parts)
  for (let part of parts) {
    let type = (part.Headers['Content-Type'] || '').toString()
    if (typeRegExp.test(type)) {
      let matches = /\bcharset=([\w_-]+)(?:;|$)/.exec(type)
      let charset = matches ? matches[1] : undefined
      return {
        type: type,
        content: decode(
          part.Body,
          (part.Headers['Content-Transfer-Encoding'] || '').toString(),
          charset
        )
      }
    }
  }
}

module.exports = function (options) {
  options = options || {}
  const apiURL = options.apiURL || process.env.MAILHOG_API_URL
  return {
    // Sends a search request to the MailHog API.
    // Returns a promise that resolves with a list of email objects.
    // * query is the search query string.
    // * kind can be from|to|containing, defaults to "containing"
    // * start defines the start index of the search (default: 0)
    // * limit defines the max number of results (default: 50)
    search: function (query, kind, start, limit) {
      query = encodeURIComponent(query)
      kind = kind || 'containing'
      let url = `${apiURL}/search?kind=${kind}&query=${query}`
      if (start) url += `&start=${start}`
      if (limit) url += `&limit=${limit}`
      return getJSON(url)
    },
    // Returns the text content part of the given email object.
    // * mail is an object returned by MailHog for an email message
    getText: function (mail) {
      return getContentPart(mail, /^text\/plain($|;)/i)
    },
    // Returns the HTML content part of the given email object.
    // * mail is an object returned by MailHog for an email message
    getHTML: function (mail) {
      return getContentPart(mail, /^text\/html($|;)/i)
    },
    // Retrieves the latest message content for the given query.
    // Returns a promise that resolves with the email content as result.
    // * query is the search query string
    // * plainText (boolean) defines if text (true) or HTML (false) is returned
    // * kind can be from|to|containing, defaults to "to"
    // Returns HTML unless plainText is true or there is no HTML content
    getLatest: function (query, plainText, kind) {
      kind = kind || 'to'
      return this.search(query, kind, 0, 1).then(response => {
        if (!response.count) return
        let mail = response.items[0]
        return (!plainText && this.getHTML(mail)) || this.getText(mail)
      })
    }
  }
}
