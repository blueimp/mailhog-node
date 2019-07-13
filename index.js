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

// @ts-check
'use strict'

const http = require('http')
const libqp = require('./libqp')

/**
 * Adds soft line breaks to a given String
 * @param {String} str String to wrap
 * @param {Number} [lineLength=76] Maximum allowed length for a line
 * @returns {String} Soft-wrapped String using `\r\n` as line breaks
 */
function wrap (str, lineLength) {
  lineLength = lineLength || 76
  const lines = Math.ceil(str.length / lineLength)
  let output = ''
  for (let i = 0, offset = 0; i < lines; ++i, offset += lineLength) {
    output += str.substr(offset, lineLength) + '\r\n'
  }
  return output.trim()
}

/**
 * Encodes a String in the given charset to base64 or quoted-printable encoding.
 * @param {String} str String to encode
 * @param {String} encoding base64|quoted-printable
 * @param {String} [charset=utf8] Charset of the input string
 * @param {Number} [lineLength=76] Soft line break limit
 * @returns {String} Encoded String
 */
function encode (str, encoding, charset, lineLength) {
  if (lineLength === undefined) lineLength = 76
  let buffer
  if (!charset || /^utf-?8$/i.test(charset)) {
    buffer = Buffer.from(str, 'utf8')
  } else {
    buffer = require('iconv-lite').encode(str, charset)
  }
  let output
  switch ((encoding || '').toLowerCase()) {
    case 'quoted-printable':
      output = libqp.encode(buffer)
      return lineLength ? libqp.wrap(output, lineLength) : output
    case 'base64':
      output = buffer.toString('base64')
      break
    default:
      output = str
  }
  return lineLength ? wrap(output, lineLength) : output
}

/**
 * Decodes a String from the given encoding and outputs it in the given charset.
 * @param {String} str String to decode
 * @param {String} [encoding=utf8] input encoding, e.g. base64|quoted-printable
 * @param {String} [charset=utf8] Charset to use for the output
 * @returns {String} Decoded String
 */
function decode (str, encoding, charset) {
  let buffer
  if (encoding) {
    encoding = encoding.toLowerCase()
    // 7bit|8bit|binary are not encoded, x-token has an unknown encoding, see:
    // https://www.w3.org/Protocols/rfc1341/5_Content-Transfer-Encoding.html
    if (/^(7|8)bit|binary|x-.+$/.test(encoding)) return str
  }
  if (encoding === 'quoted-printable') {
    buffer = libqp.decode(str)
  } else {
    buffer = Buffer.from(str, encoding)
  }
  if (!charset || /^utf-?8$/i.test(charset)) {
    return buffer.toString()
  }
  return require('iconv-lite').decode(buffer, charset)
}

/**
 * Returns the content part matching the given content-type regular expression.
 * @param {Object} mail MailHog mail object
 * @param {RegExp} typeRegExp Regular expression matching the content-type
 * @returns {String} Decoded content with a type matching the content-type
 */
function getContent (mail, typeRegExp) {
  let parts = [mail.Content]
  if (mail.MIME) parts = parts.concat(mail.MIME.Parts)
  for (const part of parts) {
    const type = (part.Headers['Content-Type'] || '').toString()
    if (typeRegExp.test(type)) {
      const match = /\bcharset=([\w_-]+)(?:;|$)/.exec(type)
      const charset = match ? match[1] : undefined
      return decode(
        part.Body,
        (part.Headers['Content-Transfer-Encoding'] || '').toString(),
        charset
      )
    }
  }
}

/**
 * Matches encoded Strings in mail headers and returns decoded content.
 * @param {String} _ Matched substring (unused)
 * @param {String} charset Charset to use for the output
 * @param {String} encoding B|Q, which stands for base64 or quoted-printable
 * @param {String} data Encoded String data
 * @returns {String} Decoded header content
 */
function headerDecoder (_, charset, encoding, data) {
  switch (encoding) {
    case 'b':
    case 'B':
      return decode(data, 'base64', charset)
    case 'q':
    case 'Q':
      return decode(data, 'quoted-printable', charset)
  }
}

/**
 * Returns header content for the given mail object and header key.
 * @param {Object} mail MailHog mail object
 * @param {String} key Header key
 * @returns {String} Header content
 */
function getHeader (mail, key) {
  const header = (mail.Content || mail).Headers[key]
  if (!header || !header.length) return
  // Encoded header parts have the following form:
  // =?charset?encoding?data?=
  return header[0].replace(/=\?([^?]+)\?([BbQq])\?([^?]+)\?=/g, headerDecoder)
}

/**
 * Memoized getter for mail text content.
 * @returns {String} Decoded mail text content
 */
function getText () {
  delete this.text
  return (this.text = getContent(this, /^text\/plain($|;)/i))
}

/**
 * Memoized getter for mail HTML content.
 * @returns {String} Decoded mail HTML content
 */
function getHTML () {
  delete this.html
  return (this.html = getContent(this, /^text\/html($|;)/i))
}

/**
 * Memoized getter for mail Subject header.
 * @returns {String} Decoded mail Subject header
 */
function getSubject () {
  delete this.subject
  return (this.subject = getHeader(this, 'Subject'))
}

/**
 * Memoized getter for mail From header.
 * @returns {String} Decoded mail From header
 */
function getFrom () {
  delete this.from
  return (this.from = getHeader(this, 'From'))
}

/**
 * Memoized getter for mail To header.
 * @returns {String} Decoded mail To header
 */
function getTo () {
  delete this.to
  return (this.to = getHeader(this, 'To'))
}

/**
 * Memoized getter for mail Cc header.
 * @returns {String} Decoded mail Cc header
 */
function getCc () {
  delete this.cc
  return (this.cc = getHeader(this, 'Cc'))
}

/**
 * Memoized getter for mail Bcc header.
 * @returns {String} Decoded mail Bcc header
 */
function getBcc () {
  delete this.bcc
  return (this.bcc = getHeader(this, 'Bcc'))
}

/**
 * Memoized getter for mail Reply-To header.
 * @returns {String} Decoded mail Reply-To header
 */
function getReplyTo () {
  delete this.replyTo
  return (this.replyTo = getHeader(this, 'Reply-To'))
}

/**
 * Memoized getter for mail Date header.
 * @returns {Date} Mail Date header
 */
function getDate () {
  delete this.date
  const dateString = getHeader(this, 'Date')
  if (dateString) this.date = new Date(Date.parse(dateString))
  return this.date
}

/**
 * Memoized getter for mail Delivery-Date header.
 * @returns {Date} Mail Delivery-Date header
 */
function getDeliveryDate () {
  delete this.deliveryDate
  // MailHog does not set the Delivery-Date header, but it sets a Created
  // property that serves the same purpose (delivery date to application):
  return (this.deliveryDate = new Date(Date.parse(this.Created)))
}

/**
 * Memoized getter for mail Content-Type header.
 * @returns {String} Decoded mail Content-Type header
 */
function getContentType () {
  delete this.type
  return (this.type = getHeader(this, 'Content-Type'))
}

/**
 * Memoized getter for mail Content-Transfer-Encoding header.
 * @returns {String} Decoded mail Content-Transfer-Encoding header
 */
function getContentTransferEncoding () {
  delete this.encoding
  return (this.encoding = getHeader(this, 'Content-Transfer-Encoding'))
}

/**
 * @typedef {Object} Attachment
 * @property {String} name Filename
 * @property {String} type Content-Type
 * @property {String} encoding Content-Transfer-Encoding
 * @property {String} Body Encoded content
 */

/**
 * Memoized getter for mail attachments.
 * @returns {Array<Attachment>} List of mail attachments
 */
function getAttachments () {
  delete this.attachments
  const attachments = []
  if (this.MIME && this.MIME.Parts) {
    for (const part of this.MIME.Parts) {
      const match = /^attachment;\s*filename="?([^"]+)"?$/.exec(
        part.Headers['Content-Disposition']
      )
      if (!match) continue
      part.name = match[1]
      Object.defineProperty(part, 'type', {
        get: getContentType,
        configurable: true
      })
      Object.defineProperty(part, 'encoding', {
        get: getContentTransferEncoding,
        configurable: true
      })
      attachments.push(part)
    }
  }
  return (this.attachments = attachments)
}

/**
 * Injects convenience properties for each mail item in the given result.
 * @param {Object} result Result object for a MailHog API search/messages query
 * @returns {Object} Result object with injected properties for each mail item
 */
function injectProperties (result) {
  if (!result.count) return result
  for (const item of result.items) {
    // Define memoized getter for contents and headers:
    Object.defineProperty(item, 'text', { get: getText, configurable: true })
    Object.defineProperty(item, 'html', { get: getHTML, configurable: true })
    Object.defineProperty(item, 'subject', {
      get: getSubject,
      configurable: true
    })
    Object.defineProperty(item, 'from', { get: getFrom, configurable: true })
    Object.defineProperty(item, 'to', { get: getTo, configurable: true })
    Object.defineProperty(item, 'cc', { get: getCc, configurable: true })
    Object.defineProperty(item, 'bcc', { get: getBcc, configurable: true })
    Object.defineProperty(item, 'replyTo', {
      get: getReplyTo,
      configurable: true
    })
    Object.defineProperty(item, 'date', { get: getDate, configurable: true })
    Object.defineProperty(item, 'deliveryDate', {
      get: getDeliveryDate,
      configurable: true
    })
    Object.defineProperty(item, 'attachments', {
      get: getAttachments,
      configurable: true
    })
  }
  return result
}

/**
 * Sends a http.request and resolves with the parsed JSON response.
 * @param {String} options http.request options
 * @param {String} [data] POST data
 * @returns {Promise} resolves with JSON or http.IncomingMessage if no body
 */
function request (options, data) {
  return new Promise((resolve, reject) => {
    const req = http
      .request(options, response => {
        let body = ''
        response
          .on('data', chunk => (body += chunk))
          .on('end', () => {
            if (!body) return resolve(response)
            try {
              resolve(JSON.parse(body))
            } catch (error) {
              reject(error)
            }
          })
      })
      .on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

/**
 * @typedef {Object} Message
 * @property {String} ID Message ID
 * @property {String} text Decoded mail text content
 * @property {String} html Decoded mail HTML content
 * @property {String} subject Decoded mail Subject header
 * @property {String} from Decoded mail From header
 * @property {String} to Decoded mail To header
 * @property {String} cc Decoded mail Cc header
 * @property {String} bcc Decoded mail Bcc header
 * @property {String} replyTo Decoded mail Reply-To header
 * @property {Date} date Mail Date header
 * @property {Date} deliveryDate Mail Delivery-Date header
 * @property {Array<Attachment>} attachments List of mail attachments
 */

/**
 * @typedef {Object} Messages
 * @property {Number} total Number of results available
 * @property {Number} count Number of results returned
 * @property {Number} start Offset for the range of results returned
 * @property {Array<Message>} items List of mail object items
 */

/**
 * Requests mail objects from the MailHog API.
 * @param {Number} [start=0] defines the offset for the messages query
 * @param {Number} [limit=50] defines the max number of results
 * @returns {Promise<Messages>} resolves with object listing the mail items
 */
function messages (start, limit) {
  let path = '/api/v2/messages'
  if (start) path += `?start=${start}`
  if (limit) path += `${start ? '&' : '?'}limit=${limit}`
  const options = Object.assign({}, this.options, { path })
  return request(options).then(result => injectProperties(result))
}

/**
 * Sends a search request to the MailHog API.
 * @param {String} query search query
 * @param {String} [kind=containing] query kind, can be from|to|containing
 * @param {Number} [start=0] defines the offset for the search query
 * @param {Number} [limit=50] defines the max number of results
 * @returns {Promise<Messages>} resolves with object listing the mail items
 */
function search (query, kind, start, limit) {
  query = encodeURIComponent(query)
  let path = `/api/v2/search?kind=${kind || 'containing'}&query=${query}`
  if (start) path += `&start=${start}`
  if (limit) path += `&limit=${limit}`
  const options = Object.assign({}, this.options, { path })
  return request(options).then(result => injectProperties(result))
}

/**
 * Sends a search request for the latest mail matching the "from" query.
 * @param {String} query from address
 * @returns {Promise<Message>} resolves latest mail object for the "from" query
 */
function latestFrom (query) {
  return this.search(query, 'from', 0, 1).then(
    result => result.count && result.items[0]
  )
}

/**
 * Sends a search request for the latest mail matching the "to" query.
 * @param {String} query to address
 * @returns {Promise<Message>} resolves latest mail object for the "to" query
 */
function latestTo (query) {
  return this.search(query, 'to', 0, 1).then(
    result => result.count && result.items[0]
  )
}

/**
 * Sends a search request for the latest mail matching the "containing" query.
 * @param {String} query search query
 * @returns {Promise<Message>} resolves latest mail object "containing" query
 */
function latestContaining (query) {
  return this.search(query, 'containing', 0, 1).then(
    result => result.count && result.items[0]
  )
}

/**
 * Releases the mail with the given ID using the provided SMTP config.
 * @param {String} id message ID
 * @param {Object} config SMTP configuration
 * @param {String} config.host SMTP host
 * @param {String} config.port SMTP port
 * @param {String} config.email recipient email
 * @param {String} [config.username] SMTP username
 * @param {String} [config.password] SMTP password
 * @param {String} [config.mechanism] SMTP auth mechanism (PLAIN or CRAM-MD5)
 * @returns {Promise<http.IncomingMessage>} resolves with http.IncomingMessage
 */
function releaseMessage (id, config) {
  const options = Object.assign({}, this.options, {
    method: 'POST',
    path: '/api/v1/messages/' + encodeURIComponent(id) + '/release'
  })
  return request(options, JSON.stringify(config))
}

/**
 * Deletes the mail with the given ID from MailHog.
 * @param {String} id message ID
 * @returns {Promise<http.IncomingMessage>} resolves with http.IncomingMessage
 */
function deleteMessage (id) {
  const options = Object.assign({}, this.options, {
    method: 'DELETE',
    path: '/api/v1/messages/' + encodeURIComponent(id)
  })
  return request(options)
}

/**
 * Deletes all mails stored in MailHog.
 * @returns {Promise<http.IncomingMessage>} resolves with http.IncomingMessage
 */
function deleteAll () {
  const options = Object.assign({}, this.options, {
    method: 'DELETE',
    path: '/api/v1/messages'
  })
  return request(options)
}

/**
 * @typedef {Object} Options API options
 * @property {String} [protocol="http:"] API protocol
 * @property {String} [host=localhost] API host
 * @property {Number} [port=8025] API port
 * @property {String} [auth] API basic authentication
 */

/**
 * @typedef {Object} API
 * @property {Options} options
 * @property {typeof messages} messages
 * @property {typeof search} search
 * @property {typeof latestFrom} latestFrom
 * @property {typeof latestTo} latestTo
 * @property {typeof latestContaining} latestContaining
 * @property {typeof releaseMessage} releaseMessage
 * @property {typeof deleteMessage} deleteMessage
 * @property {typeof deleteAll} deleteAll
 * @property {typeof encode} encode
 * @property {typeof decode} decode
 */

/**
 * Returns the mailhog API interface.
 * @param {Options} [options] API options
 * @returns {API} API object
 */
function mailhog (options) {
  return {
    options: Object.assign({ port: 8025 }, options),
    messages,
    search,
    latestFrom,
    latestTo,
    latestContaining,
    releaseMessage,
    deleteMessage,
    deleteAll,
    encode,
    decode
  }
}

module.exports = mailhog
