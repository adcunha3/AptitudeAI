import express from 'express';
import connection from './config/database.js';

const app = express();

app.listen(3000, () => {
    console.log('App running on port 3000');
    connection.connect((err) => {
        if (err) throw err;
        console.log('DB Connected');
    })
});