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

import decode from './decode'

// Returns the content part matching the given content-type.
// * mail is an object returned by MailHog for an email message
// * typeRegExp is a regular expression matched against the parts' content-type
// Returns an object with type (content-type) and content (decoded) properties.

export default function getContentPart(mail, typeRegExp) {
  const parts = mail.MIME ? [mail.Content, ...mail.MIME.Parts] : [mail.Content]

  const matchingPart = parts.find(part => {
    const type = (part.Headers['Content-Type'] || '').toString()
    return typeRegExp.test(type)
  })

  if (!matchingPart) {
    return undefined
  }

  const type = (matchingPart.Headers['Content-Type'] || '').toString()

  const matches = /\bcharset=([\w_-]+)(?:;|$)/.exec(type)
  const charset = matches ? matches[1] : undefined

  const content = decode(
    matchingPart.Body,
    (matchingPart.Headers['Content-Transfer-Encoding'] || '').toString(),
    charset,
  )

  return {
    type,
    content,
  }
}
