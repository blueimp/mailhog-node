/**
 * Encodes a Buffer or String into a Quoted-Printable encoded string
 *
 * @param {Buffer|string} buffer Buffer or String to convert
 * @returns {string} Quoted-Printable encoded string
 */
export function encode(buffer: Buffer | string): string;
/**
 * Decodes a Quoted-Printable encoded string to a Buffer object
 *
 * @param {string} input Quoted-Printable encoded string
 * @returns {Buffer} Decoded value
 */
export function decode(input: string): Buffer;
/**
 * Adds soft line breaks to a Quoted-Printable string
 *
 * @param {string} str Quoted-Printable encoded string
 * @param {number} [lineLength=76] Maximum allowed length for a line
 * @returns {string} Soft-wrapped Quoted-Printable encoded string
 */
export function wrap(str: string, lineLength?: number): string;
