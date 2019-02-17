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

### Transform Streams
`libqp` makes it possible to encode and decode streams with `libqp.Encoder` and
`libqp.Decoder` constructors.

### Encoder Stream
Create new Encoder Stream with

```js
const encoder = new libqp.Encoder(options)
```

Where
  * **options** is the optional stream options object with an additional option
    `lineLength` if you want to use any other line length than the default `76`
    characters (or set to `false` to turn the soft wrapping off completely)

**Example**  
The following example script reads in a file, encodes it to Quoted-Printable and
saves the output to a file.

```js
const libqp = require('libqp')
const fs = require('fs')
const source = fs.createReadStream('source.txt')
const encoded = fs.createReadStream('encoded.txt')
const encoder = new libqp.Encoder()

source.pipe(encoder).pipe(encoded)
```

### Decoder Stream
Create new Decoder Stream with

```js
const decoder = new libqp.Decoder(options)
```

Where
  * **options** is the optional stream options object

**Example**  
The following example script reads in a file in Quoted-Printable encoding,
decodes it and saves the output to a file.

```js
const libqp = require('libqp')
const fs = require('fs')
const encoded = fs.createReadStream('encoded.txt')
const dest = fs.createReadStream('dest.txt')
const decoder = new libqp.Decoder()

encoded.pipe(decoder).pipe(dest)
```

## License
Released under the [MIT license](https://opensource.org/licenses/MIT).

## Author
[Andris Reinman](https://github.com/andris9) with minimal edits from
[Sebastian Tschan](https://blueimp.net/).
