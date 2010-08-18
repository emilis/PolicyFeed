/**
 * @fileoverview Simple interface to javax.mail for sending email.
 */

importPackage(javax.mail);
importPackage(javax.mail.internet);

export('send');

var log = require('ringo/logging').getLogger(module.id),
    session;

/**
 * Does the actual job of sending mail.
 *
 * @param {Object} data the data of mail to send
 */
function send(data) {
    try {
        session = Session.getInstance(createProps(data));
        var msg = createMsg(data),
            transport = session.getTransport('smtp');
        data.username && data.password ? // Enable SMTP auth.
                transport.connect(data.username, data.password) :
                transport.connect();
        transport.sendMessage(msg, msg.allRecipients);
        log.info('Sent mail with following input data:', JSON.stringify(data));
    } catch (error) {
        log.error('Something went wrong while trying to send mail; input data:',
                JSON.stringify(data));
        throw error;
    } finally {
        if (transport && transport.isConnected()) {
            transport.close();
        }
    }
}

/**
 * Creates props to be used by javax.mail session.
 *
 * @param {Object} data the data of mail to send
 * @returns props the props to be used by session
 */
function createProps(data) {
    var props = new java.util.Properties();
    props.put('mail.smtp.host', data.host || 'localhost');
    props.put('mail.smtp.auth', data.username && data.password);
    props.put('mail.smtp.port', String(data.port || 25));
    if (data.encrypt) { // Handle encryption settings.
        if (String(data.port) === '465') {
            props.put('mail.smtp.socketFactory.port', data.port);
            props.put('mail.smtp.socketFactory.class',
                    'javax.net.ssl.SSLSocketFactory');
            props.put('mail.smtp.socketFactory.fallback', 'false');
            props.put('mail.smtp.ssl', 'true');
        }
        if (typeof data.port === 'undefined' || String(data.port) === '587') {
            props.put('mail.smtp.starttls.enable', 'true');
        }
    } else {
        props.put('mail.smtp.starttls.enable', 'false');
    }
    props.put('mail.mime.charset', 'UTF-8');
    return props;
}

/**
 * Creates javax.mail message of mail to send.
 *
 * @param {Object} data the data of mail to send
 * @returns msg the message of mail to send
 */
function createMsg(data) {
    var msg = new MimeMessage(session);
    msg.setFrom(new InternetAddress(data.from));
    handleRecipients(msg, data);
    if (data.headers) {
        for (let headerName in data.headers) {
            msg.setHeader(headerName, data.headers[headerName]);
        }
    }
    if (data.subject) { // Enable empty subjects.
        msg.subject = MimeUtility.encodeWord(data.subject);
    }
    data.html ? msg.setText(data.html, 'utf-8', 'html') :
            msg.setText(data.text || '', 'utf-8'); // Enable "empty" content.
    msg.sentDate = new java.util.Date();
    return msg;
}

/**
 * Handles recipients of javax.mail message.
 *
 * @param msg the javax.mail message to handle
 * @param {Object} data the data of mail to send
 */
function handleRecipients(msg, data) {
    msg.setRecipients(Message.RecipientType.TO, Array.isArray(data.to) ?
            data.to.toString() : data.to);
    if (data.cc) {
        msg.addRecipients(Message.RecipientType.CC, Array.isArray(data.cc) ?
                data.cc.toString() : data.cc);
    }
    if (data.bcc) {
        msg.addRecipients(Message.RecipientType.BCC, Array.isArray(data.bcc) ?
                data.bcc.toString() : data.bcc);
    }
    if (data.replyTo) {
        msg.replyTo = Array.isArray(data.replyTo) ?
                [new InternetAddress(addr) for each (addr in data.replyTo)] :
                [new InternetAddress(data.replyTo)];
    }
}
