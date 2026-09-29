import tls from 'tls';
import dotenv from 'dotenv';
dotenv.config();

const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
const user = process.env.SMTP_USER;
const socket = tls.connect(993, 'imap.gmail.com', { rejectUnauthorized: false }, () => {});

let buffer = '';
let state = 'CONNECTED';

socket.on('data', (chunk) => {
  buffer += chunk.toString();

  if (state === 'CONNECTED' && buffer.includes('* OK')) {
    buffer = '';
    state = 'LOGGING_IN';
    socket.write(`A1 LOGIN ${user} ${pass}\r\n`);
  } else if (state === 'LOGGING_IN' && buffer.includes('A1 ')) {
    buffer = '';
    state = 'SELECTING';
    socket.write(`A2 SELECT "[Gmail]/All Mail"\r\n`);
  } else if (state === 'SELECTING' && buffer.includes('A2 ')) {
    console.log('Selected All Mail result:', buffer.slice(0, 200));
    socket.end();
    process.exit(0);
  }
});
