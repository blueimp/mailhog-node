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

'use strict'

/**
 * @typedef {object} Attachment
 * @property {string} name Filename
 * @property {string} type Content-Type
 * @property {string} encoding Content-Transfer-Encoding
 * @property {string} Body Encoded content
 * @property {Array<string>} Headers Encoded headers
 */

/**
 * @typedef {object} MIME
 * @property {Array<Attachment>} Parts Attachment parts
 */

/**
 * @typedef {object} Message
 * @property {string} ID Message ID
 * @property {string} text Decoded mail text content
 * @property {string} html Decoded mail HTML content
 * @property {string} subject Decoded mail Subject header
 * @property {string} from Decoded mail From header
 * @property {string} to Decoded mail To header
 * @property {string} cc Decoded mail Cc header
 * @property {string} bcc Decoded mail Bcc header
 * @property {string} replyTo Decoded mail Reply-To header
 * @property {Date} date Mail Date header
 * @property {Date} deliveryDate Mail Delivery-Date header
 * @property {Array<Attachment>} attachments List of mail attachments
 * @property {string} Created Mail Created property
 * @property {MIME} MIME Mail Mime property
 */

/**
 * @typedef {object} Messages
 * @property {number} total Number of results available
 * @property {number} count Number of results returned
 * @property {number} start Offset for the range of results returned
 * @property {Array<Message>} items List of mail object items
 */

/**
 * @typedef {object} Options API options
 * @property {string} [protocol="http:"] API protocol
 * @property {string} [host=localhost] API host
 * @property {number} [port=8025] API port
 * @property {string} [auth] API basic authentication
 * @property {string} [basePath="/api"] API base path
 */

/* eslint-disable jsdoc/valid-types */

/**
 * @typedef {object} API
 * @property {Options} options API options
 * @property {typeof messages} messages Gets all messages
 * @property {typeof search} search Gets messages matching a query
 * @property {typeof latestFrom} latestFrom Gets latest message from sender
 * @property {typeof latestTo} latestTo Gets latest message to recipient
 * @property {typeof latestContaining} latestContaining Gets latest with content
 * @property {typeof releaseMessage} releaseMessage Releases given message
 * @property {typeof deleteMessage} deleteMessage Deletes given message
 * @property {typeof deleteAll} deleteAll Deletes all messages
 * @property {typeof encode} encode Encodes given content
 * @property {typeof decode} decode Decodes given content
 */

/* eslint-enable jsdoc/valid-types */

/**
 * @typedef {object} SMTPConfig
 * @property {string} host SMTP host
 * @property {string} port SMTP port
 * @property {string} email recipient email
 * @property {string} [username] SMTP username
 * @property {string} [password] SMTP password
 * @property {string} [mechanism] SMTP auth mechanism (PLAIN or CRAM-MD5)
 */

/* global BufferEncoding */

const http = require('http')
const https = require('https')
const libqp = require('./libqp')

/**
 * Adds soft line breaks to a given String
 *
 * @param {string} str String to wrap
 * @param {number} [lineLength=76] Maximum allowed length for a line
 * @returns {string} Soft-wrapped String using `\r\n` as line breaks
 */
function wrap(str, lineLength) {
  const maxLength = lineLength || 76
  const lines = Math.ceil(str.length / maxLength)
  let output = ''
  for (let i = 0, offset = 0; i < lines; ++i, offset += maxLength) {
    output += str.substr(offset, maxLength) + '\r\n'
  }
  return output.trim()
}

/**
 * Encodes a String in the given charset to base64 or quoted-printable encoding.
 *
 * @param {string} str String to encode
 * @param {string} [encoding] base64|quoted-printable
 * @param {string} [charset=utf8] Charset of the input string
 * @param {number} [lineLength=76] Soft line break limit
 * @returns {string} Encoded String
 */
function encode(str, encoding, charset, lineLength) {
  const maxLength = lineLength === undefined ? 76 : lineLength
  const outputEncoding = encoding && encoding.toLowerCase()
  let output = str
  if (outputEncoding === 'quoted-printable' || outputEncoding === 'base64') {
    const isUTF8Input = !charset || /^utf-?8$/.test(charset.toLowerCase())
    let buffer
    if (isUTF8Input) {
      buffer = Buffer.from(str)
    } else {
      buffer = require('iconv-lite').encode(str, charset)
    }
    if (outputEncoding === 'quoted-printable') {
      const output = libqp.encode(buffer)
      return maxLength ? libqp.wrap(output, maxLength) : output
    }
    output = buffer.toString('base64')
  }
  return maxLength ? wrap(output, maxLength) : output
}

/**
 * Decodes a String from the given encoding and outputs it in the given charset.
 *
 * @param {string} str String to decode
 * @param {string} [encoding=utf8] input encoding, e.g. base64|quoted-printable
 * @param {string} [charset=utf8] Charset to use for the output
 * @returns {string} Decoded String
 */
function decode(str, encoding, charset) {
  const inputEncoding = encoding && encoding.toLowerCase()
  const utf8Regexp = /^utf-?8$/
  const isUTF8Input = !inputEncoding || utf8Regexp.test(inputEncoding)
  const isUTF8Output = !charset || utf8Regexp.test(charset.toLowerCase())
  if (isUTF8Input && isUTF8Output) return str
  // 7bit|8bit|binary are not encoded, x-token has an unknown encoding, see:
  // https://www.w3.org/Protocols/rfc1341/5_Content-Transfer-Encoding.html
  if (/^(7|8)bit|binary|x-.+$/.test(inputEncoding)) return str
  let buffer
  if (inputEncoding === 'quoted-printable') {
    buffer = libqp.decode(str)
  } else {
    buffer = Buffer.from(
      str,
      /** @type {BufferEncoding} */
      (inputEncoding)
    )
  }
  if (isUTF8Output) return buffer.toString()
  return require('iconv-lite').decode(buffer, charset)
}

/**
 * Returns the content part matching the given content-type regular expression.
 *
 * @param {object} mail MailHog mail object
 * @param {RegExp} typeRegExp Regular expression matching the content-type
 * @returns {string} Decoded content with a type matching the content-type
 */
function getContent(mail, typeRegExp) {
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
 *
 * @param {string} _ Matched substring (unused)
 * @param {string} charset Charset to use for the output
 * @param {string} encoding B|Q, which stands for base64 or quoted-printable
 * @param {string} data Encoded String data
 * @returns {string} Decoded header content
 */
function headerDecoder(_, charset, encoding, data) {
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
 *
 * @param {object} mail MailHog mail object
 * @param {string} key Header key
 * @returns {string} Header content
 */
function getHeader(mail, key) {
  const header = (mail.Content || mail).Headers[key]
  if (!header || !header.length) return
  // Encoded header parts have the following form:
  // =?charset?encoding?data?=
  return header[0].replace(/=\?([^?]+)\?([BbQq])\?([^?]+)\?=/g, headerDecoder)
}

/**
 * Memoized getter for mail text content.
 *
 * @this Message
 * @returns {string} Decoded mail text content
 */
function getText() {
  delete this.text
  return (this.text = getContent(this, /^text\/plain($|;)/i))
}

/**
 * Memoized getter for mail HTML content.
 *
 * @this Message
 * @returns {string} Decoded mail HTML content
 */
function getHTML() {
  delete this.html
  return (this.html = getContent(this, /^text\/html($|;)/i))
}

/**
 * Memoized getter for mail Subject header.
 *
 * @this Message
 * @returns {string} Decoded mail Subject header
 */
function getSubject() {
  delete this.subject
  return (this.subject = getHeader(this, 'Subject'))
}

/**
 * Memoized getter for mail From header.
 *
 * @this Message
 * @returns {string} Decoded mail From header
 */
function getFrom() {
  delete this.from
  return (this.from = getHeader(this, 'From'))
}

/**
 * Memoized getter for mail To header.
 *
 * @this Message
 * @returns {string} Decoded mail To header
 */
function getTo() {
  delete this.to
  return (this.to = getHeader(this, 'To'))
}

/**
 * Memoized getter for mail Cc header.
 *
 * @this Message
 * @returns {string} Decoded mail Cc header
 */
function getCc() {
  delete this.cc
  return (this.cc = getHeader(this, 'Cc'))
}

/**
 * Memoized getter for mail Bcc header.
 *
 * @this Message
 * @returns {string} Decoded mail Bcc header
 */
function getBcc() {
  delete this.bcc
  return (this.bcc = getHeader(this, 'Bcc'))
}

/**
 * Memoized getter for mail Reply-To header.
 *
 * @this Message
 * @returns {string} Decoded mail Reply-To header
 */
function getReplyTo() {
  delete this.replyTo
  return (this.replyTo = getHeader(this, 'Reply-To'))
}

/**
 * Memoized getter for mail Date header.
 *
 * @this Message
 * @returns {Date} Mail Date header
 */
function getDate() {
  delete this.date
  const dateString = getHeader(this, 'Date')
  if (dateString) this.date = new Date(Date.parse(dateString))
  return this.date
}

/**
 * Memoized getter for mail Delivery-Date header.
 *
 * @this Message
 * @returns {Date} Mail Delivery-Date header
 */
function getDeliveryDate() {
  delete this.deliveryDate
  // MailHog does not set the Delivery-Date header, but it sets a Created
  // property that serves the same purpose (delivery date to application):
  return (this.deliveryDate = new Date(Date.parse(this.Created)))
}

/**
 * Memoized getter for mail Content-Type header.
 *
 * @this Attachment
 * @returns {string} Decoded mail Content-Type header
 */
function getContentType() {
  delete this.type
  return (this.type = getHeader(this, 'Content-Type'))
}

/**
 * Memoized getter for mail Content-Transfer-Encoding header.
 *
 * @this Attachment
 * @returns {string} Decoded mail Content-Transfer-Encoding header
 */
function getContentTransferEncoding() {
  delete this.encoding
  return (this.encoding = getHeader(this, 'Content-Transfer-Encoding'))
}

/**
 * Memoized getter for mail attachments.
 *
 * @this Message
 * @returns {Array<Attachment>} List of mail attachments
 */
function getAttachments() {
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
 *
 * @param {object} result Result object for a MailHog API search/messages query
 * @returns {object} Result object with injected properties for each mail item
 */
function injectProperties(result) {
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
 *
 * @param {object} options http.request options
 * @param {string} [data] POST data
 * @returns {Promise} resolves with JSON or http.IncomingMessage if no body
 */
function request(options, data) {
  const client = options.protocol === 'https:' ? https : http
  return new Promise((resolve, reject) => {
    const req = client
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
 * Requests mail objects from the MailHog API.
 *
 * @param {number} [start=0] defines the offset for the messages query
 * @param {number} [limit=50] defines the max number of results
 * @returns {Promise<Messages?>} resolves with object listing the mail items
 */
function messages(start, limit) {
  let path = `${this.options.basePath}/v2/messages`
  if (start) path += `?start=${start}`
  if (limit) path += `${start ? '&' : '?'}limit=${limit}`
  const options = Object.assign({}, this.options, { path })
  return request(options).then(result => injectProperties(result))
}

/**
 * Sends a search request to the MailHog API.
 *
 * @param {string} query search query
 * @param {string} [kind=containing] query kind, can be from|to|containing
 * @param {number} [start=0] defines the offset for the search query
 * @param {number} [limit=50] defines the max number of results
 * @returns {Promise<Messages?>} resolves with object listing the mail items
 */
function search(query, kind, start, limit) {
  const basePath = this.options.basePath
  const kindParam = kind || 'containing'
  const encodedQuery = encodeURIComponent(query)
  let path = `${basePath}/v2/search?kind=${kindParam}&query=${encodedQuery}`
  if (start) path += `&start=${start}`
  if (limit) path += `&limit=${limit}`
  const options = Object.assign({}, this.options, { path })
  return request(options).then(result => injectProperties(result))
}

/**
 * Sends a search request for the latest mail matching the "from" query.
 *
 * @param {string} query from address
 * @returns {Promise<Message?>} resolves latest mail object for the "from" query
 */
function latestFrom(query) {
  return this.search(query, 'from', 0, 1).then(
    result => result.count && result.items[0]
  )
}

/**
 * Sends a search request for the latest mail matching the "to" query.
 *
 * @param {string} query to address
 * @returns {Promise<Message?>} resolves latest mail object for the "to" query
 */
function latestTo(query) {
  return this.search(query, 'to', 0, 1).then(
    result => result.count && result.items[0]
  )
}

/**
 * Sends a search request for the latest mail matching the "containing" query.
 *
 * @param {string} query search query
 * @returns {Promise<Message?>} resolves latest mail object "containing" query
 */
function latestContaining(query) {
  return this.search(query, 'containing', 0, 1).then(
    result => result.count && result.items[0]
  )
}

/**
 * Releases the mail with the given ID using the provided SMTP config.
 *
 * @param {string} id message ID
 * @param {SMTPConfig} config SMTP configuration
 * @returns {Promise<http.IncomingMessage>} resolves with http.IncomingMessage
 */
function releaseMessage(id, config) {
  const basePath = this.options.basePath
  const options = Object.assign({}, this.options, {
    method: 'POST',
    path: `${basePath}/v1/messages/${encodeURIComponent(id)}/release`
  })
  return request(options, JSON.stringify(config))
}

/**
 * Deletes the mail with the given ID from MailHog.
 *
 * @param {string} id message ID
 * @returns {Promise<http.IncomingMessage>} resolves with http.IncomingMessage
 */
function deleteMessage(id) {
  const options = Object.assign({}, this.options, {
    method: 'DELETE',
    path: `${this.options.basePath}/v1/messages/${encodeURIComponent(id)}`
  })
  return request(options)
}

/**
 * Deletes all mails stored in MailHog.
 *
 * @returns {Promise<http.IncomingMessage>} resolves with http.IncomingMessage
 */
function deleteAll() {
  const options = Object.assign({}, this.options, {
    method: 'DELETE',
    path: `${this.options.basePath}/v1/messages`
  })
  return request(options)
}

/**
 * Returns the mailhog API interface.
 *
 * @param {Options} [options] API options
 * @returns {API} API object
 */
function mailhog(options) {
  const api = {
    options: Object.assign({ port: 8025, basePath: '/api' }, options),
    encode,
    decode
  }
  return Object.assign(api, {
    messages: messages.bind(api),
    search: search.bind(api),
    latestFrom: latestFrom.bind(api),
    latestTo: latestTo.bind(api),
    latestContaining: latestContaining.bind(api),
    releaseMessage: releaseMessage.bind(api),
    deleteMessage: deleteMessage.bind(api),
    deleteAll: deleteAll.bind(api)
  })
}

module.exports = mailhog
