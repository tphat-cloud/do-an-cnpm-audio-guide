const mysql = require('mysql2/promise');
const { readFile } = require('node:fs/promises');
const path = require('node:path');

const databaseName = 'narration_test';

async function prepareDatabase() {
  const rootPassword = process.env.MYSQL_ROOT_PASSWORD;
  if (!rootPassword) {
    throw new Error('MYSQL_ROOT_PASSWORD must be configured');
  }

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_TEST_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_TEST_PORT || 3306),
    user: 'root',
    password: rootPassword,
    multipleStatements: true,
  });

  try {
    await connection.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);

    const schema = await readFile(
      path.resolve(__dirname, '../../database/schema.sql'),
      'utf8'
    );
    const seed = await readFile(
      path.resolve(__dirname, '../../database/seed.sql'),
      'utf8'
    );

    await connection.query(schema.replaceAll('narration_db', databaseName));
    await connection.query(seed.replaceAll('narration_db', databaseName));
    await connection.query(
      `GRANT ALL PRIVILEGES ON \`${databaseName}\`.* TO 'test'@'%'`
    );
  } finally {
    await connection.end();
  }
}

prepareDatabase().catch((error) => {
  console.error('Failed to prepare isolated MySQL integration database:', error);
  process.exitCode = 1;
});
