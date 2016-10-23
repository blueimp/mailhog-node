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
const mailhog = require('./mailhog')({
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
mailhog.search(query, kind, start, limit)
  .then(function (result) {})
  .catch(function (error) {})
```

* `query` is the search query string
* `kind` can be from|to|containing, defaults to `"containing"`
* `start` defines the start index of the search (default: `0`)
* `limit` defines the max number of results (default: `50`)

#### Example

```js
mailhog.search('example.org').then(function (result) {
  console.log(result)
}).catch(function (error) {
  console.error(error)
})
```

### getText
Returns the text content part of the given email object.

#### Usage

```js
mailhog.getText(mail)
```

* `mail` is an object returned by MailHog for an email message

#### Example

```js
mailhog.search('example.org').then(function (result) {
  for (let mail of result.items) {
    console.log(mailhog.getText(mail))
  }
}).catch(function (error) {
  console.error(error)
})
```

### getHTML
Returns the HTML content part of the given email object.

#### Usage

```js
mailhog.getHTML(mail)
```

* `mail` is an object returned by MailHog for an email message

#### Example

```js
mailhog.search('example.org').then(function (result) {
  for (let mail of result.items) {
    console.log(mailhog.getHTML(mail))
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
mailhog.getLatest(query, plainText, kind)
  .then(function (result) {})
  .catch(function (error) {})
```

* `query` is the search query string
* `plainText` (boolean) defines if text (`true`) or HTML (`false`) is returned
* `kind` can be `from|to|containing`, defaults to `"to"`

Returns HTML unless `plainText` is `true` or there is no HTML content.

#### Example

```js
mailhog.getLatest('nihon@example.org').then(function (result) {
  console.log(result)
}).catch(function (error) {
  console.error(error)
})
```

## License
Released under the [MIT license](https://opensource.org/licenses/MIT).

## Author
[Sebastian Tschan](https://blueimp.net/)
