const bcrypt = require('bcrypt');

async function hashPassword(password) {
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
        } else {
            console.log('Hashed password:', hash);
        }
    });
}

hashPassword('12345')
hashPassword('12345')