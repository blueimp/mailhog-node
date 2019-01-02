# MailHog NodeJS library

- [Initialization](#initialization)
- [Methods](#methods)
  - [search](#search)
    - [Usage](#usage)
    - [Example](#example)
  - [getText](#gettext)
    - [Usage](#usage-1)
    - [Example](#example-1)
  - [getHTML](#gethtml)
    - [Usage](#usage-2)
    - [Example](#example-2)
  - [getLatest](#getlatest)
    - [Usage](#usage-3)
    - [Example](#example-3)
- [License](#license)
- [Author](#author)

## Initialization
The `mailhog` module returns an initialization function.
This function accepts an options object that must include the `apiURL`.
Currently this library requires the MailHog API `v2`:

```js
import mailhog from 'mailhog'
# or
# const mailhog = require('mailhog').default

const mailhogClient = mailhog({
  apiURL: 'http://mailhog:8025/api/v2'
})
```

Replace `mailhog` in the `apiURL` with the hostname to your MailHog instance.

The object returned by the initialization function is the `mailhog` API object
that is used in the following examples.

## Methods

### search
Sends a search request to the MailHog API.
Returns a list of emails objects.

#### Usage

```js
mailhogClient.search(query, kind, start, limit)
  .then(function (result) {})
  .catch(function (error) {})
```

* `query` is the search query string
* `kind` can be from|to|containing, defaults to `"containing"`
* `start` defines the start index of the search (default: `0`)
* `limit` defines the max number of results (default: `50`)

#### Example

```js
mailhogClient.search('example.org').then(function (result) {
  console.log(result)
}).catch(function (error) {
  console.error(error)
})
```

### getText
Returns the text content part of the given email object.

#### Usage

```js
mailhogClient.getText(mail)
```

* `mail` is an object returned by MailHog for an email message

#### Example

```js
mailhogClient.search('example.org').then(function (result) {
  for (let mail of result.items) {
    console.log(mailhogClient.getText(mail))
  }
}).catch(function (error) {
  console.error(error)
})
```

### getHTML
Returns the HTML content part of the given email object.

#### Usage

```js
mailhogClient.getHTML(mail)
```

* `mail` is an object returned by MailHog for an email message

#### Example

```js
mailhogClient.search('example.org').then(function (result) {
  for (let mail of result.items) {
    console.log(mailhogClient.getHTML(mail))
  }
}).catch(function (error) {
  console.error(error)
})
```

### getLatest
Retrieves the latest message content for the given query.
Returns a promise that resolves with the email content as result.

#### Usage

```js
mailhogClient.getLatest(query, plainText, kind)
  .then(function (result) {})
  .catch(function (error) {})
```

* `query` is the search query string
* `plainText` (boolean) defines if text (`true`) or HTML (`false`) is returned
* `kind` can be `from|to|containing`, defaults to `"to"`

Returns HTML unless `plainText` is `true` or there is no HTML content.

#### Example

```js
mailhogClient.getLatest('nihon@example.org').then(function (result) {
  console.log(result)
}).catch(function (error) {
  console.error(error)
})
```

### deleteAll
Deletes all received messages

#### Usage

```js
mailhogClient.deleteAll()
```

Returns `undefined`

#### Example

```js
mailhogClient.deleteAll()
.catch(function (error) {
  console.error(error)
})
```

### getAll
Similar to search, but just returns all received messages without filtering.
Returns a list of emails objects.

#### Usage

```js
mailhogClient.getAll(start, limit)
  .then(function (result) {})
  .catch(function (error) {})
```

* `start` defines the start index of the search (default: `0`)
* `limit` defines the max number of results (default: `9999`)

#### Example

```js
mailhogClient.getAll().then(function (result) {
  console.log(result)
}).catch(function (error) {
  console.error(error)
})
```

## License
Released under the [MIT license](https://opensource.org/licenses/MIT).

## Author
[Sebastian Tschan](https://blueimp.net/)
