const crypto = require('crypto');

function generateEncryptedPassword(plaintextPassword) {
    const salt = crypto.randomBytes(20).toString('hex').slice(0, 20);
    const hash = crypto.createHash('sha256').update(plaintextPassword + salt).digest('base64');
    const saltedHash = salt + hash;
    return saltedHash;
}

const plaintextPassword = 'guest';
const encryptedPassword = generateEncryptedPassword(plaintextPassword);
console.log(encryptedPassword);
