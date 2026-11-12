const testEnvironment = {
  DB_HOST: '127.0.0.1',
  DB_PORT: '3306',
  DB_USER: 'test',
  DB_PASSWORD: 'test',
  DB_NAME: 'test',
  JWT_SECRET: 'test_jwt_secret_key_for_automated_testing_2026',
};

for (const [name, value] of Object.entries(testEnvironment)) {
  if (!process.env[name]) {
    process.env[name] = value;
  }
}
