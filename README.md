# mailhog
> A NodeJS library to interact with the
> [MailHog](https://github.com/mailhog/MailHog) API.

- [Installation](#installation)
- [Initialization](#initialization)
- [API](#api)
  * [messages](#messages)
    + [Description](#description)
    + [Parameters](#parameters)
    + [Returns](#returns)
    + [Example](#example)
  * [search](#search)
    + [Description](#description-1)
    + [Parameters](#parameters-1)
    + [Returns](#returns-1)
    + [Example](#example-1)
  * [latestFrom](#latestfrom)
    + [Description](#description-2)
    + [Parameters](#parameters-2)
    + [Returns](#returns-2)
    + [Example](#example-2)
  * [latestTo](#latestto)
    + [Description](#description-3)
    + [Parameters](#parameters-3)
    + [Returns](#returns-3)
    + [Example](#example-3)
  * [latestContaining](#latestcontaining)
    + [Description](#description-4)
    + [Parameters](#parameters-4)
    + [Returns](#returns-4)
    + [Example](#example-4)
  * [encode](#encode)
    + [Description](#description-5)
    + [Parameters](#parameters-5)
    + [Returns](#returns-5)
    + [Example](#example-5)
  * [decode](#decode)
    + [Description](#description-6)
    + [Parameters](#parameters-6)
    + [Returns](#returns-6)
    + [Example](#example-6)
- [License](#license)
- [Author](#author)

## Installation
```sh
npm install mailhog
```

## Initialization
The `mailhog` module returns an initialization function.  
This function accepts an options object that must include the `apiURL` as
property.  
The current version of this library supports the
[MailHog API v2](https://github.com/mailhog/MailHog/blob/master/docs/APIv2.md):

```js
const mailhog = require('mailhog')({
  apiURL: 'http://mailhog:8025/api/v2'
})
```

Replace `mailhog` in the `apiURL` with the hostname to your MailHog instance.

The object returned by the initialization function is the `mailhog` API object
that is used in the following examples.

## API

### messages
```
mailhog.messages(start, limit) → Promise 
```

#### Description
Retrieves a list of mail objects, sorted from latest to earliest.

#### Parameters
Name  | Type   | Required | Default | Description
----- | ------ | -------- | ------- | ------------------------------------------
start | Number | no       | 0       | defines the offset for the messages query
limit | Number | no       | 50      | defines the max number of results

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

The individual mail object items have the following getters:

```js
{
  text: String,       // Decoded mail text content
  html: String,       // Decoded mail HTML content
  subject: String,    // Decoded mail Subject header
  from: String,       // Decoded mail From header
  to: String,         // Decoded mail To header
  cc: String,         // Decoded mail Cc header
  bcc: String,        // Decoded mail Bcc header
  replyTo: String,    // Decoded mail Reply-To header
  date: Date,         // Mail Date header
  deliveryDate: Date  // Mail Delivery-Date header
}
```

#### Example
```js
async function example () {
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
Name  | Type   | Required | Default    | Description
----- | ------ | -------- | ---------- | ---------------------------------------
query | String | yes      |            | search query
kind  | String | no       | containing | query kind, can be from/to/containing
start | Number | no       | 0          | defines the offset for the search query
limit | Number | no       | 50         | defines the max number of results

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

The individual mail object items have the following getters:

```js
{
  text: String,       // Decoded mail text content
  html: String,       // Decoded mail HTML content
  subject: String,    // Decoded mail Subject header
  from: String,       // Decoded mail From header
  to: String,         // Decoded mail To header
  cc: String,         // Decoded mail Cc header
  bcc: String,        // Decoded mail Bcc header
  replyTo: String,    // Decoded mail Reply-To header
  date: Date,         // Mail Date header
  deliveryDate: Date  // Mail Delivery-Date header
}
```

#### Example
```js
async function example () {
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
Name  | Type   | Required | Description
----- | ------ | -------- | ------------
query | String | yes      | from address

#### Returns
Returns a `Promise` that resolves with an `Object`.

The resolved mail object has the following getters:

```js
{
  text: String,       // Decoded mail text content
  html: String,       // Decoded mail HTML content
  subject: String,    // Decoded mail Subject header
  from: String,       // Decoded mail From header
  to: String,         // Decoded mail To header
  cc: String,         // Decoded mail Cc header
  bcc: String,        // Decoded mail Bcc header
  replyTo: String,    // Decoded mail Reply-To header
  date: Date,         // Mail Date header
  deliveryDate: Date  // Mail Delivery-Date header
}
```

#### Example
```js
async function example () {
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
Name  | Type   | Required | Description
----- | ------ | -------- | -----------
query | String | yes      | to address

#### Returns
Returns a `Promise` that resolves with an `Object`.

The resolved mail object has the following getters:

```js
{
  text: String,       // Decoded mail text content
  html: String,       // Decoded mail HTML content
  subject: String,    // Decoded mail Subject header
  from: String,       // Decoded mail From header
  to: String,         // Decoded mail To header
  cc: String,         // Decoded mail Cc header
  bcc: String,        // Decoded mail Bcc header
  replyTo: String,    // Decoded mail Reply-To header
  date: Date,         // Mail Date header
  deliveryDate: Date  // Mail Delivery-Date header
}
```

#### Example
```js
async function example () {
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
Name  | Type   | Required | Description
----- | ------ | -------- | ------------
query | String | yes      | search query

#### Returns
Returns a `Promise` that resolves with an `Object`.

The resolved mail object has the following getters:

```js
{
  text: String,       // Decoded mail text content
  html: String,       // Decoded mail HTML content
  subject: String,    // Decoded mail Subject header
  from: String,       // Decoded mail From header
  to: String,         // Decoded mail To header
  cc: String,         // Decoded mail Cc header
  bcc: String,        // Decoded mail Bcc header
  replyTo: String,    // Decoded mail Reply-To header
  date: Date,         // Mail Date header
  deliveryDate: Date  // Mail Delivery-Date header
}
```

#### Example
```js
async function example () {
  // Search the latest message containing "banana":
  const result = await mailhog.latestContaining('banana')

  // Log the details of this message to the console:
  console.log('From: ', result.from)
  console.log('To: ', result.to)
  console.log('Subject: ', result.subject)
  console.log('Content: ', result.text)
}
```

### encode
```
mailhog.encode(str, encoding, charset, lineBreak) → String 
```

#### Description
Encodes a String in the given charset to base64 or quoted-printable encoding.

#### Parameters
Name      | Type   | Required | Default | Description
--------- | ------ | -------- | ------- | ---------------------------
str       | String | yes      |         | String to encode
encoding  | String | yes      |         | base64/quoted-printable
charset   | String | no       | utf8    | Charset of the input string
lineBreak | Number | no       | 76      | Soft line break limit

#### Returns
Returns a `String` in the target encoding.

#### Example
```js
const query = mailhog.encode('üäö', 'quoted-printable')
// =C3=BC=C3=A4=C3=B6

async function example () {
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
Name      | Type   | Required | Default | Description
--------- | ------ | -------- | ------- | -----------------------------
str       | String | yes      |         | String to decode
encoding  | String | yes      |         | base64/quoted-printable
charset   | String | no       | utf8    | Charset to use for the output

#### Returns
Returns a `String` in the target charset.

#### Example
```js
const output = mailhog.decode('5pel5pys', 'base64')
// 日本
```

## License
Released under the [MIT license](https://opensource.org/licenses/MIT).

## Author
[Sebastian Tschan](https://blueimp.net/)
