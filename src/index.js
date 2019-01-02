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

import request from 'request-promise-native'

import getContentPart from './getContentPart'

export default function mkClient(options = {}) {
  const { baseUrl } = options

  return {
    // Sends a search request to the MailHog API.
    // Returns a promise that resolves with a list of email objects.
    // * query is the search query string.
    // * kind can be from|to|containing, defaults to "containing"
    // * start defines the start index of the search (default: 0)
    // * limit defines the max number of results (default: 50)
    search(query, kind, start, limit) {
      const query_ = encodeURIComponent(query)
      const kind_ = kind || 'containing'
      let url = `${baseUrl}/api/v2/search?kind=${kind_}&query=${query_}`
      if (start) url += `&start=${start}`
      if (limit) url += `&limit=${limit}`
      return request(url, { json: true })
    },
    // Returns the text content part of the given email object.
    // * mail is an object returned by MailHog for an email message
    getText(mail) {
      return getContentPart(mail, /^text\/plain($|;)/i)
    },
    // Returns the HTML content part of the given email object.
    // * mail is an object returned by MailHog for an email message
    getHTML(mail) {
      return getContentPart(mail, /^text\/html($|;)/i)
    },
    // Retrieves the latest message content for the given query.
    // Returns a promise that resolves with the email content as result.
    // * query is the search query string
    // * plainText (boolean) defines if text (true) or HTML (false) is returned
    // * kind can be from|to|containing, defaults to "to"
    // Returns HTML unless plainText is true or there is no HTML content
    getLatest(query, plainText, kind) {
      const kind_ = kind || 'to'

      return this.search(query, kind_, 0, 1).then(response => {
        if (!response.count) {
          return undefined
        }

        const mail = response.items[0]

        if (plainText) {
          return this.getText(mail)
        }

        return this.getHTML(mail) || this.getText(mail)
      })
    },

    // Deletes all emails
    deleteAll() {
      const url = `${baseUrl}/api/v1/messages`
      return request.delete(url, { json: true })
    },

    // Gets all emails
    getAll(start = 0, limit = 9999) {
      const url = `${baseUrl}/api/v2/messages?start=${start}&limit=${limit}`
      return request(url, { json: true })
    },
  }
}
