var mail = require('ringo/mail');

const ADDRESS_1 = 'John Doe <jdoe@example.com>',
    ADDRESS_2 = 'RingoJS <ringojs@mailinator.com>',
    ADDRESS_3 = 'commonjs@mailinator.com',
    GMAIL_ADDRESS = 'CHANGE_ME',
    GMAIL_PASSWORD = 'CHANGE_ME',
    SUBJECT = '[Foo] Bar',
    TEXT = 'Hi!\n\nThis is some text.\n\nCheers, Tester',
    HTML = '<h1>Hi!</h1><p>This is some text.</p><p><em>Cheers, Tester</em></p>',
    ATTACHMENT = module.resolve('mangatar.jpg');

exports.testSendingMailWithVariousInputOptions = function () {
    mail.send({from: ADDRESS_1, to: ADDRESS_2, subject: SUBJECT, text: TEXT});
    mail.send({from: ADDRESS_1, to: ADDRESS_2, subject: SUBJECT, html: HTML});
    mail.send({to: ADDRESS_2, text: TEXT});
    mail.send({to: ADDRESS_2, subject: SUBJECT});
    mail.send({from: ADDRESS_1, to: [ADDRESS_2, ADDRESS_3]});
    mail.send({to: ADDRESS_2, cc: ADDRESS_3});
    mail.send({to: ADDRESS_2, cc: [ADDRESS_3, ADDRESS_1]});
    mail.send({to: ADDRESS_2, bcc: ADDRESS_3});
    mail.send({to: ADDRESS_2, bcc: [ADDRESS_3, ADDRESS_1]});
    mail.send({to: ADDRESS_2, replyTo: ADDRESS_1});
    mail.send({to: ADDRESS_2, replyTo: [ADDRESS_1, ADDRESS_3]});
    mail.send({from: ADDRESS_1, to: ADDRESS_2, headers:
            {'Content-Language': 'en', Keywords: 'ringojs, javax.mail'}});
    mail.send({from: ADDRESS_1, to: ADDRESS_2, attachments: ATTACHMENT});
    mail.send({to: ADDRESS_2, attachments: [ATTACHMENT, ATTACHMENT]});
    mail.send({from: ADDRESS_1, to: ADDRESS_2});
};

// Provide valid Gmail account info above and remove "_" in test name to run.
exports._testAuthAndTlsEncryption = function () {
    mail.send({host: 'smtp.gmail.com', encrypt: true, username: GMAIL_ADDRESS,
            password: GMAIL_PASSWORD, from: ADDRESS_1, to: GMAIL_ADDRESS,
            subject: SUBJECT, text: TEXT});
};

if (require.main == module) {
    require('test').run(exports);
}
