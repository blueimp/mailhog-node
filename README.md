# mailhog

> A NodeJS library to interact with the
> [MailHog](https://github.com/mailhog/MailHog) API.

## Contents

- [Installation](#installation)
- [Initialization](#initialization)
  - [Description](#description)
  - [Parameters](#parameters)
  - [Returns](#returns)
  - [Example](#example)
- [API](#api)
  - [messages](#messages)
    - [Description](#description-1)
    - [Parameters](#parameters-1)
    - [Returns](#returns-1)
    - [Example](#example-1)
  - [search](#search)
    - [Description](#description-2)
    - [Parameters](#parameters-2)
    - [Returns](#returns-2)
    - [Example](#example-2)
  - [latestFrom](#latestfrom)
    - [Description](#description-3)
    - [Parameters](#parameters-3)
    - [Returns](#returns-3)
    - [Example](#example-3)
  - [latestTo](#latestto)
    - [Description](#description-4)
    - [Parameters](#parameters-4)
    - [Returns](#returns-4)
    - [Example](#example-4)
  - [latestContaining](#latestcontaining)
    - [Description](#description-5)
    - [Parameters](#parameters-5)
    - [Returns](#returns-5)
    - [Example](#example-5)
  - [releaseMessage](#releasemessage)
    - [Description](#description-6)
    - [Parameters](#parameters-6)
    - [Returns](#returns-6)
    - [Example](#example-6)
  - [deleteMessage](#deletemessage)
    - [Description](#description-7)
    - [Parameters](#parameters-7)
    - [Returns](#returns-7)
    - [Example](#example-7)
  - [deleteAll](#deleteall)
    - [Description](#description-8)
    - [Parameters](#parameters-8)
    - [Returns](#returns-8)
    - [Example](#example-8)
  - [encode](#encode)
    - [Description](#description-9)
    - [Parameters](#parameters-9)
    - [Returns](#returns-9)
    - [Example](#example-9)
  - [decode](#decode)
    - [Description](#description-10)
    - [Parameters](#parameters-10)
    - [Returns](#returns-10)
    - [Example](#example-10)
- [Testing](#testing)
- [License](#license)
- [Author](#author)

## Installation

```sh
npm install mailhog
```

## Initialization

```
require('mailhog')(options) → Object
```

### Description

The `mailhog` module returns an initialization function.  
This function accepts an optional `options` object that is used for
[http.request](https://nodejs.org/api/http.html#http_http_request_options_callback)
calls to the MailHog API and returns the `mailhog` API object.

### Parameters

| Name             | Type   | Required | Default   | Description              |
| ---------------- | ------ | -------- | --------- | ------------------------ |
| options.protocol | String | no       | http:     | API protocol             |
| options.host     | String | no       | localhost | API host                 |
| options.port     | Number | no       | 8025      | API port                 |
| options.auth     | String | no       |           | API basic authentication |
| options.basePath | String | no       | /api      | API base path            |

### Returns

Returns the `mailhog` API object with the following properties:

```js
{
  options: Object,
  messages: Function,
  search: Function,
  latestFrom: Function,
  latestTo: Function,
  latestContaining: Function,
  releaseMessage: Function,
  deleteMessage: Function,
  deleteAll: Function,
  encode: Function,
  decode: Function
}
```

### Example

```js
const mailhog = require('mailhog')({
  host: 'mailhog'
})

mailhog.messages().then(result => console.log(result))
```

## API

The following API descriptions assume that the `mailhog` API object has been
initialized.

### messages

```
mailhog.messages(start, limit) → Promise
```

#### Description

Retrieves a list of mail objects, sorted from latest to earliest.

#### Parameters

| Name  | Type   | Required | Default | Description                       |
| ----- | ------ | -------- | ------- | --------------------------------- |
| start | Number | no       | 0       | defines the messages query offset |
| limit | Number | no       | 50      | defines the max number of results |

#### Returns

Returns a `Promise` that resolves with an `Object`.

The resolved result has the following properties:

```js
{
  total: Number, // Number of results available
  count: Number, // Number of results returned
  start: Number, // Offset for the range of results returned
  items: Array   // List of mail object items
}
```

The individual mail object items have the following properties:

```js
{
  ID: String,         // Mail ID
  text: String,       // Decoded mail text content
  html: String,       // Decoded mail HTML content
  subject: String,    // Decoded mail Subject header
  from: String,       // Decoded mail From header
  to: String,         // Decoded mail To header
  cc: String,         // Decoded mail Cc header
  bcc: String,        // Decoded mail Bcc header
  replyTo: String,    // Decoded mail Reply-To header
  date: Date,         // Mail Date header
  deliveryDate: Date, // Mail Delivery-Date header
  attachments: Array  // List of mail attachments
}
```

The individual attachments have the following properties:

```js
{
  name: String,     // Filename
  type: String,     // Content-Type
  encoding: String, // Content-Transfer-Encoding
  Body: String      // Encoded content
}
```

#### Example

```js
async function example() {
  // Retrieve the latest 10 messages:
  const result = await mailhog.messages(0, 10)

  // Log the details of each message to the console:
  for (let item of result.items) {
    console.log('From: ', item.from)
    console.log('To: ', item.to)
    console.log('Subject: ', item.subject)
    console.log('Content: ', item.text)
  }
}
```

### search

```
mailhog.search(query, kind, start, limit) → Promise
```

#### Description

Retrieves a list of mail objects for the given query, sorted from latest to
earliest.

#### Parameters

| Name  | Type   | Required | Default    | Description                       |
| ----- | ------ | -------- | ---------- | --------------------------------- |
| query | String | yes      |            | search query                      |
| kind  | String | no       | containing | query kind (from/to/containing)   |
| start | Number | no       | 0          | defines the search query offset   |
| limit | Number | no       | 50         | defines the max number of results |

#### Returns

Returns a `Promise` that resolves with an `Object`.

The resolved result has the following properties:

```js
{
  total: Number, // Number of results available
  count: Number, // Number of results returned
  start: Number, // Offset for the range of results returned
  items: Array   // List of mail object items
}
```

The individual mail object items have the following properties:

```js
{
  ID: String,         // Mail ID
  text: String,       // Decoded mail text content
  html: String,       // Decoded mail HTML content
  subject: String,    // Decoded mail Subject header
  from: String,       // Decoded mail From header
  to: String,         // Decoded mail To header
  cc: String,         // Decoded mail Cc header
  bcc: String,        // Decoded mail Bcc header
  replyTo: String,    // Decoded mail Reply-To header
  date: Date,         // Mail Date header
  deliveryDate: Date, // Mail Delivery-Date header
  attachments: Array  // List of mail attachments
}
```

The individual attachments have the following properties:

```js
{
  name: String,     // Filename
  type: String,     // Content-Type
  encoding: String, // Content-Transfer-Encoding
  Body: String      // Encoded content
}
```

#### Example

```js
async function example() {
  // Search the latest 10 messages containing "banana":
  const result = await mailhog.search('banana', 'containing', 0, 10)

  // Log the details of each message to the console:
  for (let item of result.items) {
    console.log('From: ', item.from)
    console.log('To: ', item.to)
    console.log('Subject: ', item.subject)
    console.log('Content: ', item.text)
  }
}
```

### latestFrom

```
mailhog.latestFrom(query) → Promise
```

#### Description

Retrieves the latest mail object sent from the given address.

#### Parameters

| Name  | Type   | Required | Description  |
| ----- | ------ | -------- | ------------ |
| query | String | yes      | from address |

#### Returns

Returns a `Promise` that resolves with an `Object`.

The resolved mail object has the following properties:

```js
{
  ID: String,         // Mail ID
  text: String,       // Decoded mail text content
  html: String,       // Decoded mail HTML content
  subject: String,    // Decoded mail Subject header
  from: String,       // Decoded mail From header
  to: String,         // Decoded mail To header
  cc: String,         // Decoded mail Cc header
  bcc: String,        // Decoded mail Bcc header
  replyTo: String,    // Decoded mail Reply-To header
  date: Date,         // Mail Date header
  deliveryDate: Date, // Mail Delivery-Date header
  attachments: Array  // List of mail attachments
}
```

The individual attachments have the following properties:

```js
{
  name: String,     // Filename
  type: String,     // Content-Type
  encoding: String, // Content-Transfer-Encoding
  Body: String      // Encoded content
}
```

#### Example

```js
async function example() {
  // Search the latest message from "test@example.org":
  const result = await mailhog.latestFrom('test@example.org')

  // Log the details of this message to the console:
  console.log('From: ', result.from)
  console.log('To: ', result.to)
  console.log('Subject: ', result.subject)
  console.log('Content: ', result.text)
}
```

### latestTo

```
mailhog.latestTo(query) → Promise
```

#### Description

Retrieves the latest mail object sent to the given address.

#### Parameters

| Name  | Type   | Required | Description |
| ----- | ------ | -------- | ----------- |
| query | String | yes      | to address  |

#### Returns

Returns a `Promise` that resolves with an `Object`.

The resolved mail object has the following properties:

```js
{
  ID: String,         // Mail ID
  text: String,       // Decoded mail text content
  html: String,       // Decoded mail HTML content
  subject: String,    // Decoded mail Subject header
  from: String,       // Decoded mail From header
  to: String,         // Decoded mail To header
  cc: String,         // Decoded mail Cc header
  bcc: String,        // Decoded mail Bcc header
  replyTo: String,    // Decoded mail Reply-To header
  date: Date,         // Mail Date header
  deliveryDate: Date, // Mail Delivery-Date header
  attachments: Array  // List of mail attachments
}
```

The individual attachments have the following properties:

```js
{
  name: String,     // Filename
  type: String,     // Content-Type
  encoding: String, // Content-Transfer-Encoding
  Body: String      // Encoded content
}
```

#### Example

```js
async function example() {
  // Search the latest message to "test@example.org":
  const result = await mailhog.latestTo('test@example.org')

  // Log the details of this message to the console:
  console.log('From: ', result.from)
  console.log('To: ', result.to)
  console.log('Subject: ', result.subject)
  console.log('Content: ', result.text)
}
```

### latestContaining

```
mailhog.latestContaining(query) → Promise
```

#### Description

Retrieves the latest mail object containing the given query.

#### Parameters

| Name  | Type   | Required | Description  |
| ----- | ------ | -------- | ------------ |
| query | String | yes      | search query |

#### Returns

Returns a `Promise` that resolves with an `Object`.

The resolved mail object has the following properties:

```js
{
  ID: String,         // Mail ID
  text: String,       // Decoded mail text content
  html: String,       // Decoded mail HTML content
  subject: String,    // Decoded mail Subject header
  from: String,       // Decoded mail From header
  to: String,         // Decoded mail To header
  cc: String,         // Decoded mail Cc header
  bcc: String,        // Decoded mail Bcc header
  replyTo: String,    // Decoded mail Reply-To header
  date: Date,         // Mail Date header
  deliveryDate: Date, // Mail Delivery-Date header
  attachments: Array  // List of mail attachments
}
```

The individual attachments have the following properties:

```js
{
  name: String,     // Filename
  type: String,     // Content-Type
  encoding: String, // Content-Transfer-Encoding
  Body: String      // Encoded content
}
```

#### Example

```js
async function example() {
  // Search the latest message containing "banana":
  const result = await mailhog.latestContaining('banana')

  // Log the details of this message to the console:
  console.log('From: ', result.from)
  console.log('To: ', result.to)
  console.log('Subject: ', result.subject)
  console.log('Content: ', result.text)
}
```

### releaseMessage

```
mailhog.releaseMessage(id, config) → Promise
```

#### Description

Releases the mail with the given ID using the provided SMTP config.

#### Parameters

| Name             | Type   | Required | Description                        |
| ---------------- | ------ | -------- | ---------------------------------- |
| id               | String | yes      | message ID                         |
| config           | Object | yes      | SMTP configuration                 |
| config.host      | String | yes      | SMTP host                          |
| config.port      | String | yes      | SMTP port                          |
| config.email     | String | yes      | recipient email                    |
| config.username  | String | no       | SMTP username                      |
| config.password  | String | no       | SMTP password                      |
| config.mechanism | String | no       | SMTP auth type (PLAIN or CRAM-MD5) |

#### Returns

Returns a `Promise` that resolves with an
[http.IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
object.

#### Example

```js
async function example() {
  const result = await mailhog.latestTo('test@example.org')

  const response = await mailhog.releaseMessage(result.ID, {
    host: 'localhost',
    port: '1025',
    email: 'test@example.org'
  })
}
```

### deleteMessage

```
mailhog.deleteMessage(id) → Promise
```

#### Description

Deletes the mail with the given ID from MailHog.

#### Parameters

| Name | Type   | Required | Description |
| ---- | ------ | -------- | ----------- |
| id   | String | yes      | message ID  |

#### Returns

Returns a `Promise` that resolves with an
[http.IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
object.

#### Example

```js
async function example() {
  const result = await mailhog.latestTo('test@example.org')

  const response = await mailhog.deleteMessage(result.ID)

  console.log('Status code: ', response.statusCode)
}
```

### deleteAll

```
mailhog.deleteAll() → Promise
```

#### Description

Deletes all mails stored in MailHog.

#### Parameters

None

#### Returns

Returns a `Promise` that resolves with an
[http.IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
object.

#### Example

```js
async function example() {
  const response = await mailhog.deleteAll()

  console.log('Status code: ', response.statusCode)
}
```

### encode

```
mailhog.encode(str, encoding, charset, lineLength) → String
```

#### Description

Encodes a String in the given charset to base64 or quoted-printable encoding.

#### Parameters

| Name       | Type   | Required | Default | Description                 |
| ---------- | ------ | -------- | ------- | --------------------------- |
| str        | String | yes      |         | String to encode            |
| encoding   | String | yes      | utf8    | base64/quoted-printable     |
| charset    | String | no       | utf8    | Charset of the input string |
| lineLength | Number | no       | 76      | Soft line break limit       |

#### Returns

Returns a `String` in the target encoding.

#### Example

```js
const query = mailhog.encode('üäö', 'quoted-printable')
// =C3=BC=C3=A4=C3=B6

async function example() {
  // Search for "üäö" in quoted-printable encoding:
  const result = await mailhog.search(query)
}
```

### decode

```
mailhog.decode(str, encoding, charset) → String
```

#### Description

Decodes a String from the given encoding and outputs it in the given charset.

#### Parameters

| Name     | Type   | Required | Default | Description                   |
| -------- | ------ | -------- | ------- | ----------------------------- |
| str      | String | yes      |         | String to decode              |
| encoding | String | yes      |         | base64/quoted-printable       |
| charset  | String | no       | utf8    | Charset to use for the output |

#### Returns

Returns a `String` in the target charset.

#### Example

```js
const output = mailhog.decode('5pel5pys', 'base64')
// 日本
```

## Testing

1. Start [Docker](https://docs.docker.com/).
2. Install development dependencies:
   ```sh
   npm install
   ```
3. Run the tests:
   ```sh
   npm test
   ```

## License

Released under the [MIT license](https://opensource.org/licenses/MIT).

## Author

[Sebastian Tschan](https://blueimp.net/)
