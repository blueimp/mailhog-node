/// <reference types="node" />
export = mailhog;
/**
 * Returns the mailhog API interface.
 *
 * @param {Options} [options] API options
 * @returns {API} API object
 */
declare function mailhog(options?: Options): API;
declare namespace mailhog {
    export { Attachment, MIME, Message, Messages, Options, API, SMTPConfig };
}
/**
 * API options
 */
type Options = {
    /**
     * API protocol
     */
    protocol?: string;
    /**
     * API host
     */
    host?: string;
    /**
     * API port
     */
    port?: number;
    /**
     * API basic authentication
     */
    auth?: string;
    /**
     * API base path
     */
    basePath?: string;
};
type API = {
    /**
     * API options
     */
    options: Options;
    /**
     * Gets all messages
     */
    messages: typeof messages;
    /**
     * Gets messages matching a query
     */
    search: typeof search;
    /**
     * Gets latest message from sender
     */
    latestFrom: typeof latestFrom;
    /**
     * Gets latest message to recipient
     */
    latestTo: typeof latestTo;
    /**
     * Gets latest with content
     */
    latestContaining: typeof latestContaining;
    /**
     * Releases given message
     */
    releaseMessage: typeof releaseMessage;
    /**
     * Deletes given message
     */
    deleteMessage: typeof deleteMessage;
    /**
     * Deletes all messages
     */
    deleteAll: typeof deleteAll;
    /**
     * Encodes given content
     */
    encode: typeof encode;
    /**
     * Decodes given content
     */
    decode: typeof decode;
};
type Attachment = {
    /**
     * Filename
     */
    name: string;
    /**
     * Content-Type
     */
    type: string;
    /**
     * Content-Transfer-Encoding
     */
    encoding: string;
    /**
     * Encoded content
     */
    Body: string;
    /**
     * Encoded headers
     */
    Headers: Array<string>;
};
type MIME = {
    /**
     * Attachment parts
     */
    Parts: Array<Attachment>;
};
type Message = {
    /**
     * Message ID
     */
    ID: string;
    /**
     * Decoded mail text content
     */
    text: string;
    /**
     * Decoded mail HTML content
     */
    html: string;
    /**
     * Decoded mail Subject header
     */
    subject: string;
    /**
     * Decoded mail From header
     */
    from: string;
    /**
     * Decoded mail To header
     */
    to: string;
    /**
     * Decoded mail Cc header
     */
    cc: string;
    /**
     * Decoded mail Bcc header
     */
    bcc: string;
    /**
     * Decoded mail Reply-To header
     */
    replyTo: string;
    /**
     * Mail Date header
     */
    date: Date;
    /**
     * Mail Delivery-Date header
     */
    deliveryDate: Date;
    /**
     * List of mail attachments
     */
    attachments: Array<Attachment>;
    /**
     * Mail Created property
     */
    Created: string;
    /**
     * Mail Mime property
     */
    MIME: MIME;
};
type Messages = {
    /**
     * Number of results available
     */
    total: number;
    /**
     * Number of results returned
     */
    count: number;
    /**
     * Offset for the range of results returned
     */
    start: number;
    /**
     * List of mail object items
     */
    items: Array<Message>;
};
type SMTPConfig = {
    /**
     * SMTP host
     */
    host: string;
    /**
     * SMTP port
     */
    port: string;
    /**
     * recipient email
     */
    email: string;
    /**
     * SMTP username
     */
    username?: string;
    /**
     * SMTP password
     */
    password?: string;
    /**
     * SMTP auth mechanism (PLAIN or CRAM-MD5)
     */
    mechanism?: string;
};
/**
 * Requests mail objects from the MailHog API.
 *
 * @param {number} [start=0] defines the offset for the messages query
 * @param {number} [limit=50] defines the max number of results
 * @returns {Promise<Messages?>} resolves with object listing the mail items
 */
declare function messages(start?: number, limit?: number): Promise<Messages | null>;
/**
 * Sends a search request to the MailHog API.
 *
 * @param {string} query search query
 * @param {string} [kind=containing] query kind, can be from|to|containing
 * @param {number} [start=0] defines the offset for the search query
 * @param {number} [limit=50] defines the max number of results
 * @returns {Promise<Messages?>} resolves with object listing the mail items
 */
declare function search(query: string, kind?: string, start?: number, limit?: number): Promise<Messages | null>;
/**
 * Sends a search request for the latest mail matching the "from" query.
 *
 * @param {string} query from address
 * @returns {Promise<Message?>} resolves latest mail object for the "from" query
 */
declare function latestFrom(query: string): Promise<Message | null>;
/**
 * Sends a search request for the latest mail matching the "to" query.
 *
 * @param {string} query to address
 * @returns {Promise<Message?>} resolves latest mail object for the "to" query
 */
declare function latestTo(query: string): Promise<Message | null>;
/**
 * Sends a search request for the latest mail matching the "containing" query.
 *
 * @param {string} query search query
 * @returns {Promise<Message?>} resolves latest mail object "containing" query
 */
declare function latestContaining(query: string): Promise<Message | null>;
/**
 * Releases the mail with the given ID using the provided SMTP config.
 *
 * @param {string} id message ID
 * @param {SMTPConfig} config SMTP configuration
 * @returns {Promise<http.IncomingMessage>} resolves with http.IncomingMessage
 */
declare function releaseMessage(id: string, config: SMTPConfig): Promise<http.IncomingMessage>;
/**
 * Deletes the mail with the given ID from MailHog.
 *
 * @param {string} id message ID
 * @returns {Promise<http.IncomingMessage>} resolves with http.IncomingMessage
 */
declare function deleteMessage(id: string): Promise<http.IncomingMessage>;
/**
 * Deletes all mails stored in MailHog.
 *
 * @returns {Promise<http.IncomingMessage>} resolves with http.IncomingMessage
 */
declare function deleteAll(): Promise<http.IncomingMessage>;
/**
 * Encodes a String in the given charset to base64 or quoted-printable encoding.
 *
 * @param {string} str String to encode
 * @param {string} [encoding] base64|quoted-printable
 * @param {string} [charset=utf8] Charset of the input string
 * @param {number} [lineLength=76] Soft line break limit
 * @returns {string} Encoded String
 */
declare function encode(str: string, encoding?: string, charset?: string, lineLength?: number): string;
/**
 * Decodes a String from the given encoding and outputs it in the given charset.
 *
 * @param {string} str String to decode
 * @param {string} [encoding=utf8] input encoding, e.g. base64|quoted-printable
 * @param {string} [charset=utf8] Charset to use for the output
 * @returns {string} Decoded String
 */
declare function decode(str: string, encoding?: string, charset?: string): string;
import http = require("http");
