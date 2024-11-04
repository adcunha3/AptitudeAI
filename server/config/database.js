import mysql from 'mysql2';

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'AptitudeAI',
    database: 'AptitudeAI'
});

export default connection;