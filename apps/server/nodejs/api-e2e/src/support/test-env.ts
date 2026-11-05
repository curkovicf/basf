// TEST_DATABASE_URL is resolved by global-setup.ts, which runs first.
process.env['DATABASE_URL'] = process.env['TEST_DATABASE_URL'];
process.env['REVIEW_RATE_LIMIT'] = '1000';
