import mysql from 'mysql';
export const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_last',
});

export default function connect() {
    connection.connect(function (err) {
        if (!err) {
            console.log('Database is connected!!');
        } else {
            console.log('connect to db failed!!');
        }
    });
};

const closeDB = function () {
    connection.end(function (err) {
        if (!err) {
            console.log('closed db');
        }
    });
};


