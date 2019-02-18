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
 * @param {Number|Boolean} [lineBreak=76] Soft line break limit
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
 * @param {String} encoding base64|quoted-printable
 * @param {String} [charset=utf8] Charset to use for the output
 * @returns {String} Decoded String
 */
function decode (str, encoding, charset) {
  let buffer
  switch ((encoding || '').toLowerCase()) {
    case 'base64':
      buffer = Buffer.from(str, 'base64')
      break
    case 'quoted-printable':
      buffer = libqp.decode(str)
      break
    default:
      buffer = str
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
  for (let part of parts) {
    const type = (part.Headers['Content-Type'] || '').toString()
    if (typeRegExp.test(type)) {
      const matches = /\bcharset=([\w_-]+)(?:;|$)/.exec(type)
      const charset = matches ? matches[1] : undefined
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
  if (key === 'Delivery-Date') {
    // MailHog does not set the Delivery-Date header, but it sets a Created
    // property that serves the same purpose (delivery date to application):
    return new Date(Date.parse(mail.Created))
  }
  const header = mail.Content.Headers[key]
  if (!header || !header.length) return
  if (key === 'Date') {
    return new Date(Date.parse(header[0]))
  }
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
  delete this.to
  return (this.to = getHeader(this, 'Cc'))
}

/**
 * Memoized getter for mail Bcc header.
 * @returns {String} Decoded mail Bcc header
 */
function getBcc () {
  delete this.to
  return (this.to = getHeader(this, 'Bcc'))
}

/**
 * Memoized getter for mail Reply-To header.
 * @returns {String} Decoded mail Reply-To header
 */
function getReplyTo () {
  delete this.to
  return (this.to = getHeader(this, 'Reply-To'))
}

/**
 * Memoized getter for mail Date header.
 * @returns {Date} Mail Date header
 */
function getDate () {
  delete this.to
  return (this.to = getHeader(this, 'Date'))
}

/**
 * Memoized getter for mail Delivery-Date header.
 * @returns {Date} Mail Delivery-Date header
 */
function getDeliveryDate () {
  delete this.to
  return (this.to = getHeader(this, 'Delivery-Date'))
}

/**
 * Injects convenience properties for each mail item in the given result.
 * @param {Object} result Result object for a MailHog API search/messages query
 * @returns {Object} Same result object with injected props for each mail item
 */
function injectProperties (result) {
  if (!result.count) return result
  for (let item of result.items) {
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
  }
  return result
}

/**
 * Sends a http.request and resolves with the parsed JSON response.
 * @param {String} options http.request options
 * @returns {Promise} Promise for the parsed JSON data
 */
function request (options) {
  return new Promise((resolve, reject) => {
    http
      .request(options, response => {
        let body = ''
        response
          .on('data', chunk => (body += chunk))
          .on('end', () => {
            try {
              resolve(JSON.parse(body))
            } catch (error) {
              reject(error)
            }
          })
      })
      .on('error', reject)
      .end()
  })
}

/**
 * Requests mail objects from the MailHog API.
 * @param {Number} [start=0] defines the offset for the messages query
 * @param {Number} [limit=50] defines the max number of results
 * @returns {Object} Object with items property listing the mail objects
 */
function messages (start, limit) {
  let path = '/api/v2/messages'
  if (start) path += `?start=${start}`
  if (limit) path += `${start ? '&' : '?'}limit=${limit}`
  const requestOptions = Object.assign({}, this.options, { path })
  return request(requestOptions).then(result => injectProperties(result))
}

/**
 * Sends a search request to the MailHog API.
 * @param {String} query search query
 * @param {String} [kind=containing] query kind, can be from|to|containing
 * @param {Number} [start=0] defines the offset for the search query
 * @param {Number} [limit=50] defines the max number of results
 * @returns {Object} Object with items property listing the mail objects
 */
function search (query, kind, start, limit) {
  query = encodeURIComponent(query)
  let path = `/api/v2/search?kind=${kind || 'containing'}&query=${query}`
  if (start) path += `&start=${start}`
  if (limit) path += `&limit=${limit}`
  const requestOptions = Object.assign({}, this.options, { path })
  return request(requestOptions).then(result => injectProperties(result))
}

/**
 * Sends a search request for the latest mail matching the "from" query.
 * @param {String} query from address
 * @returns {Object} Latest mail object for the given "from" query
 */
function latestFrom (query) {
  return this.search(query, 'from', 0, 1).then(
    result => result.count && result.items[0]
  )
}

/**
 * Sends a search request for the latest mail matching the "to" query.
 * @param {String} query to address
 * @returns {Object} Latest mail object for the given "to" query
 */
function latestTo (query) {
  return this.search(query, 'to', 0, 1).then(
    result => result.count && result.items[0]
  )
}

/**
 * Sends a search request for the latest mail matching the "containing" query.
 * @param {String} query search query
 * @returns {Object} Latest mail object for the given "containing" query
 */
function latestContaining (query) {
  return this.search(query, 'containing', 0, 1).then(
    result => result.count && result.items[0]
  )
}

/**
 * Returns the mailhog API interface.
 * @param {Object} [options] API options
 * @property {string} [options.protocol=http:] API protocol
 * @property {string} [options.host=localhost] API host
 * @property {string} [options.port=8025] API port
 * @property {string} [options.auth] API basic authentication
 * @returns {Object} API object
 */
function mailhog (options) {
  return {
    options: Object.assign({ port: 8025 }, options),
    messages,
    search,
    latestFrom,
    latestTo,
    latestContaining,
    encode,
    decode
  }
}

module.exports = mailhog
