// @ts-check
'use strict'

/* eslint-disable no-useless-escape */

// expose to the world
module.exports = {
  encode: encode,
  decode: decode,
  wrap: wrap
}

/**
 * Encodes a Buffer or String into a Quoted-Printable encoded string
 *
 * @param {Buffer|String} buffer Buffer or String to convert
 * @returns {String} Quoted-Printable encoded string
 */
function encode (buffer) {
  if (typeof buffer === 'string') {
    buffer = Buffer.from(buffer, 'utf8')
  }

  // usable characters that do not need encoding
  const ranges = [
    // https://tools.ietf.org/html/rfc2045#section-6.7
    [0x09], // <TAB>
    [0x0a], // <LF>
    [0x0d], // <CR>
    [0x20, 0x3c], // <SP>!"#$%&'()*+,-./0123456789:;
    // >?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}
    [0x3e, 0x7e]
  ]
  let result = ''
  let ord

  for (let i = 0, len = buffer.length; i < len; i++) {
    ord = buffer[i]
    // if the char is in allowed range, then keep as is,
    // unless it is a ws in the end of a line
    if (
      checkRanges(ord, ranges) &&
      !(
        (ord === 0x20 || ord === 0x09) &&
        (i === len - 1 || buffer[i + 1] === 0x0a || buffer[i + 1] === 0x0d)
      )
    ) {
      result += String.fromCharCode(ord)
      continue
    }
    result += '=' + (ord < 0x10 ? '0' : '') + ord.toString(16).toUpperCase()
  }

  return result
}

/**
 * Decodes a Quoted-Printable encoded string to a Buffer object
 *
 * @param {String} str Quoted-Printable encoded string
 * @returns {Buffer} Decoded value
 */
function decode (str) {
  str = (str || '')
    .toString()
    // remove invalid whitespace from the end of lines
    .replace(/[\t ]+$/gm, '')
    // remove soft line breaks
    .replace(/\=(?:\r?\n|$)/g, '')

  const encodedBytesCount = (str.match(/\=[\da-fA-F]{2}/g) || []).length
  const bufferLength = str.length - encodedBytesCount * 2
  const buffer = Buffer.alloc(bufferLength)
  let bufferPos = 0
  let chr
  let hex

  for (let i = 0, len = str.length; i < len; i++) {
    chr = str.charAt(i)
    if (
      chr === '=' &&
      (hex = str.substr(i + 1, 2)) &&
      /[\da-fA-F]{2}/.test(hex)
    ) {
      buffer[bufferPos++] = parseInt(hex, 16)
      i += 2
      continue
    }
    buffer[bufferPos++] = chr.charCodeAt(0)
  }

  return buffer
}

/**
 * Adds soft line breaks to a Quoted-Printable string
 *
 * @param {String} str Quoted-Printable encoded string, might need line wrapping
 * @param {Number} [lineLength=76] Maximum allowed length for a line
 * @returns {String} Soft-wrapped Quoted-Printable encoded string
 */
function wrap (str, lineLength) {
  str = (str || '').toString()
  lineLength = lineLength || 76

  if (str.length <= lineLength) {
    return str
  }

  const lineMargin = Math.floor(lineLength / 3)
  const len = str.length
  let pos = 0
  let match
  let code
  let line
  let result = ''

  // insert soft linebreaks where needed
  while (pos < len) {
    line = str.substr(pos, lineLength)
    if ((match = line.match(/\r\n/))) {
      line = line.substr(0, match.index + match[0].length)
      result += line
      pos += line.length
      continue
    }

    if (line.substr(-1) === '\n') {
      // nothing to change here
      result += line
      pos += line.length
      continue
    } else if ((match = line.substr(-lineMargin).match(/\n.*?$/))) {
      // truncate to nearest line break
      line = line.substr(0, line.length - (match[0].length - 1))
      result += line
      pos += line.length
      continue
    } else if (
      line.length > lineLength - lineMargin &&
      (match = line.substr(-lineMargin).match(/[ \t\.,!\?][^ \t\.,!\?]*$/))
    ) {
      // truncate to nearest space
      line = line.substr(0, line.length - (match[0].length - 1))
    } else {
      if (line.match(/\=[\da-f]{0,2}$/i)) {
        // push incomplete encoding sequences to the next line
        if ((match = line.match(/\=[\da-f]{0,1}$/i))) {
          line = line.substr(0, line.length - match[0].length)
        }

        // ensure that utf-8 sequences are not split
        while (
          line.length > 3 &&
          line.length < len - pos &&
          !line.match(/^(?:=[\da-f]{2}){1,4}$/i) &&
          (match = line.match(/\=[\da-f]{2}$/gi))
        ) {
          code = parseInt(match[0].substr(1, 2), 16)
          if (code < 128) {
            break
          }

          line = line.substr(0, line.length - 3)

          if (code >= 0xc0) {
            break
          }
        }
      }
    }

    if (pos + line.length < len && line.substr(-1) !== '\n') {
      if (line.length === lineLength && line.match(/\=[\da-f]{2}$/i)) {
        line = line.substr(0, line.length - 3)
      } else if (line.length === lineLength) {
        line = line.substr(0, line.length - 1)
      }
      pos += line.length
      line += '=\r\n'
    } else {
      pos += line.length
    }

    result += line
  }

  return result
}

/**
 * Helper function to check if a number is inside provided ranges
 *
 * @param {Number} nr Number to check for
 * @param {Array} ranges An Array of allowed values
 * @returns {Boolean} True if value was found inside allowed ranges, else false
 */
function checkRanges (nr, ranges) {
  for (let i = ranges.length - 1; i >= 0; i--) {
    if (!ranges[i].length) {
      continue
    }
    if (ranges[i].length === 1 && nr === ranges[i][0]) {
      return true
    }
    if (ranges[i].length === 2 && nr >= ranges[i][0] && nr <= ranges[i][1]) {
      return true
    }
  }
  return false
}
