exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL ||
                      'mongodb://localhost/SDS-server';
exports.TEST_DATABASE_URL = (
	process.env.TEST_DATABASE_URL ||
	'mongodb://localhost/test-SDS-server');
exports.PORT = process.env.PORT || 8080;

exports.SMTP_URL= process.env.SMTP_URL || 'smtps://bestcardinfo@gmail.com:SNRrnmYhcQfq88ZT@smtp.gmail.com';
exports.APP_URL_BASE = process.env.APP_URL_BASE || 'http://localhost:8080';
