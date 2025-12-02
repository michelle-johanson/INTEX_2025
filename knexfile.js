// knexfile.js

module.exports = {
  // 1. Local Development Environment
  development: {
    client: "pg",
    connection: {
      host: process.env.RDS_HOSTNAME || "localhost",
      user: process.env.RDS_USERNAME || "postgres",
      password: process.env.RDS_PASSWORD || "admin",
      database: process.env.RDS_DB_NAME || "intex",
      port: process.env.RDS_PORT || 5432,
      ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
    },
    // Optional: useful for seeing SQL queries in your console while debugging
    debug: true 
  },

  // 2. Production Environment (AWS)
  production: {
    client: "pg",
    connection: {
      host: process.env.RDS_HOSTNAME,
      user: process.env.RDS_USERNAME,
      password: process.env.RDS_PASSWORD,
      database: process.env.RDS_DB_NAME,
      port: process.env.RDS_PORT,
      ssl: { rejectUnauthorized: false } // AWS RDS almost always requires this
    }
  }
};