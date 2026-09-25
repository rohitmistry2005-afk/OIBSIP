import tls from 'tls';
import dotenv from 'dotenv';
dotenv.config();

const socket = tls.connect(993, 'imap.gmail.com', { rejectUnauthorized: false }, () => {
  console.log('Connected to IMAP server');
});

socket.once('data', (d) => {
  console.log('Server greeting received');
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  socket.write(`A1 LOGIN ${process.env.SMTP_USER} ${pass}\r\n`);
  socket.once('data', (d2) => {
    const res = d2.toString();
    console.log('Login result:', res.includes('A1 OK') ? 'LOGIN SUCCESS' : 'LOGIN FAILED: ' + res.slice(0, 80));
    socket.end();
  });
});

socket.on('error', (err) => console.log('IMAP Error:', err.message));
