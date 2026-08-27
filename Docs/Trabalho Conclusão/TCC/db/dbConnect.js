require('dotenv').config();
const mariadb = require("mariadb");

const pool = mariadb.createPool({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.DBNAME,
    connectionLimit: 5
});

async function executarQuery(query, params = []) {
  console.log(
    "=====================================================================",
  );
  console.log("dbConnect.js", "executarQuery()");
  console.log(arguments);

  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(query, params);
    console.log(
      "=====================================================================",
    );
    return rows;
  } catch (err) {
    console.error("Erro ao executar query:", err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

module.exports = { executarQuery };
