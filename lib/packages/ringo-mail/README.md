# Ringo Mail

* This package provides a simple interface to `javax.mail` for sending email via [RingoJS].
* Its xUnit [tests] cover/show API usage (well, `mail#send`... ;) ).
* Main module's equipped with JsDoc and some further documentation's below.
* TODOs and bugs go up on corresponding GitHub [issue tracker].

## Usage Examples

Sending an email is as simple as:

    var mail = require('ringo/mail');
    mail.send({from: 'John Doe <jdoe@example.com>', to: 'hugo@example.com'});

Note the two supported mail address syntaxes above (so incl. "personal name").

To send to multiple recipients simply use an array:

    mail.send({to: ['alice@example.com', 'bob@example.com']});

BTW, if `from`'s omitted `javax.mail`'s [fallback] mechanism is used.

Setting the subject (defaults to being empty if omitted):

    mail.send({to: 'hugo@example.com', subject: '[FTW] Ohai'});

So, to actually send some text:

    mail.send({from: 'jdoe@example.com', to: 'hugo@example.com', text: 'Hi'});

By default an email with empty string text is created if omitted.<br/>
Now, in case you want to send HTML content instead:

    mail.send({from: 'jdoe@example.com', to: 'hugo@example.com',
            html: '<strong>Hi</strong>'});

Apart from that, here's how to set `cc`, `bcc` and `replyTo`:

    mail.send({to: 'jdoe@example.com', cc: 'Hugo <hugo@example.com>',
            bcc: ['alice@example.com', 'Bob <bob@example.com>'],
            replyTo: 'no-reply@example.com'});

So, as with `to`, arrays are used to specify multiple addresses.

Of course, you can define `host` (defaults to "localhost") and `port` (defaults to 25) as well:

    mail.send({host: 'smtp.example.com', port: 465, encrypt: true,
            to: 'Hugo <hugo@example.com>'});

Note how above the port was set to SSL's 465.<br/>
In combination with `encrypt` set to `true` this enables SSL encryption.<br/>
If you want to use TLS encryption instead, simply set `encrypt` to `true` and leave port definition out:

    mail.send({host: 'smtp.example.com', encrypt: true,
            to: 'hugo@example.com'});

Naturally, if you like to be more specific, you can additionally provide TLS' port 587 info there too.

Here's how to setup SMTP auth usage:

    mail.send({username: 'jdoe', password: 'secret', to: 'hugo@example.com'});

Furthermore, you can also set arbitrary mail headers:

    mail.send({to: 'hugo@example.com', headers:
            {'Content-Language': 'en', Keywords: 'ringojs, javax.mail'}});

Attachments can be added by simply specifying respective path info of files:

    mail.send({to: 'hugo@example.com', attachments:
            module.resolve('foo.jpg')});

So e.g., you can use `module#resolve` for easily getting relative paths.<br/>
Adding multiple file attachments again works with arrays as expected:

    mail.send({to: 'hugo@example.com', attachments:
            [module.resolve('foo.jpg'), module.resolve('bar.pdf')]});

Now, if you'd like to have some global mail configuration within an app,<br/>
you can simply add something along the following inside its `config.js`:

    exports.mail = {from: 'Foo <contact@foo.com>', host: 'smtp.example.com',
            username: 'jdoe', password: 'secret'};

You can override such global config settings in any app `mail#send` call.

Well, that's basically it. :)

  [RingoJS]: http://ringojs.org/
  [tests]: http://github.com/robi42/ringo-mail/blob/master/test/all.js
  [issue tracker]: http://github.com/robi42/ringo-mail/issues
  [fallback]: http://download.oracle.com/javaee/6/api/javax/mail/internet/InternetAddress.html#getLocalAddress(javax.mail.Session)