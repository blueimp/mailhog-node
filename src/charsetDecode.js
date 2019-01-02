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

import iconvLite from 'iconv-lite'

// Decode the given buffer with the given charset to a JavaScript string.
// If no charset is given, decodes using an utf8 charset.
export default function charsetDecode(buffer, charset) {
  if (!charset || /utf-?8/i.test(charset)) {
    return buffer.toString()
  }
  return iconvLite.decode(buffer, charset)
}
