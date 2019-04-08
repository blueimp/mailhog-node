# libqp
Encode and decode quoted-printable strings according to
[RFC2045](http://tools.ietf.org/html/rfc2045#section-6.7).

## Installation
```sh
npm install mailhog
```

## Usage
```js
const libqp = require('mailhog/libqp')
```

### Encode values
Encode Buffer objects or unicode strings with

```js
libqp.encode(val)
```

Where
  * **val** is a Buffer or an unicode string

**Example**

```js
libqp.encode('jõgeva')
// j=C3=B5geva
```

### Wrap encoded values
Quoted-Printable encoded lines are limited to 76 characters but `encode` method
might return lines longer than the limit.

To enforce soft line breaks on lines longer than 76 (or any other length)
characters, use `wrap`

```js
llibqp.wrap(str[, lineLength])
```

Where
  * **str** is a Quoted-Printable encoded string
  * **lineLength** (defaults to `76`) is the maximum allowed line length.  
    Any longer line will be soft wrapped

**Example**

```js
libqp.wrap('abc j=C3=B5geva', 10)
// abc j=\r\n
// =C3=B5geva
```

## License
Released under the [MIT license](https://opensource.org/licenses/MIT).

## Author
[Andris Reinman](https://github.com/andris9) with minor edits from
[Sebastian Tschan](https://blueimp.net/).
