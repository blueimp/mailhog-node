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

import libqp from 'libqp'

import charsetDecode from './charsetDecode'

// Decodes the given string using the given encoding.
// encoding can be base64|quoted-printable|7bit|8bit|binary
// 7bit|8bit|binary will be returned as is.
export default function decode(str, encoding, charset) {
  switch ((encoding || '').toLowerCase()) {
    case 'base64':
      return charsetDecode(Buffer.from(str, 'base64'), charset)
    case 'quoted-printable':
      return charsetDecode(libqp.decode(str), charset)
    default:
      return str
  }
}
