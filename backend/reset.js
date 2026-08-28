const { Client } = require('pg');
const client = new Client({ user: 'postgres', host: 'localhost', database: 'bustrack', password: 'password', port: 5432 });
client.connect().then(() => {
    return client.query("UPDATE users SET password_hash = '$2b$12$z22Q80327oU.0FwX.jQpBui0V6F./Tz/lTj20qj.YF3k6.V2U5K22' WHERE email IN ('admin@bustrack.vels.edu.in', 'sim_driver@vels.edu.in')");
}).then(res => {
    console.log('Passwords updated to "password123"');
}).catch(console.error).finally(() => client.end());
