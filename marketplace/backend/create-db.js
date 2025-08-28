const { Client } = require('pg');

async function createDatabase() {
  // Connect to existing database first
  const client = new Client({
    host: 'localhost',
    user: 'postgres',
    password: 'gamersmarket123',
    database: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');

    // Create new database
    await client.query('CREATE DATABASE pakistan_marketplace;');
    console.log('✅ Database "pakistan_marketplace" created successfully!');

  } catch (error) {
    if (error.code === '42P04') {
      console.log('✅ Database "pakistan_marketplace" already exists!');
    } else {
      console.error('❌ Error creating database:', error.message);
    }
  } finally {
    await client.end();
    console.log('✅ Connection closed');
  }
}

createDatabase();