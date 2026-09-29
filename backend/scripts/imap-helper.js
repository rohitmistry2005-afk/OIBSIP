import tls from 'tls';
import dotenv from 'dotenv';
dotenv.config();

export function fetchLatestEmailBySubject(subjectQuery, options = {}) {
  const timeoutMs = typeof options === 'number' ? options : (options.timeoutMs || 25000);
  const recipient = typeof options === 'object' ? options.recipient : null;

  return new Promise((resolve, reject) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try { socket.end(); } catch {}
        reject(new Error(`Timeout waiting for email with subject: ${subjectQuery}`));
      }
    }, timeoutMs);

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
        if (!buffer.includes('A1 OK')) {
          clearTimeout(timer);
          resolved = true;
          socket.end();
          return reject(new Error('IMAP login failed: ' + buffer));
        }
        buffer = '';
        state = 'SELECTING';
        socket.write(`A2 SELECT "[Gmail]/All Mail"\r\n`);
      } else if (state === 'SELECTING' && buffer.includes('A2 ')) {
        buffer = '';
        state = 'SEARCHING';
        socket.write(`A3 SEARCH ALL\r\n`);
      } else if (state === 'SEARCHING' && buffer.includes('A3 ')) {
        const searchMatch = buffer.match(/\* SEARCH ([\d ]+)/);
        const seqs = searchMatch && searchMatch[1] ? searchMatch[1].trim().split(/\s+/).filter(Boolean) : [];
        if (!seqs.length) {
          clearTimeout(timer);
          resolved = true;
          socket.end();
          return resolve(null);
        }
        // Fetch up to the last 15 emails to find the matching subject & recipient
        const recentSeqs = seqs.slice(-15).reverse();
        buffer = '';
        state = 'FETCHING';
        let idx = 0;

        function fetchNext() {
          if (idx >= recentSeqs.length) {
            clearTimeout(timer);
            resolved = true;
            socket.end();
            return resolve(null);
          }
          const seq = recentSeqs[idx++];
          buffer = '';
          socket.write(`A4 FETCH ${seq} (BODY[TEXT] BODY[HEADER.FIELDS (SUBJECT TO DATE)])\r\n`);
        }

        socket.removeAllListeners('data');
        socket.on('data', (d2) => {
          buffer += d2.toString();
          if (buffer.includes('A4 OK') || buffer.includes('A4 NO') || buffer.includes('A4 BAD')) {
            const hasSubject = buffer.toLowerCase().includes(subjectQuery.toLowerCase());
            const hasRecipient = !recipient || buffer.toLowerCase().includes(recipient.toLowerCase());
            if (hasSubject && hasRecipient) {
              clearTimeout(timer);
              resolved = true;
              socket.end();
              return resolve(buffer);
            }
            fetchNext();
          }
        });

        fetchNext();
      }
    });

    socket.on('error', (err) => {
      if (!resolved) {
        clearTimeout(timer);
        resolved = true;
        reject(err);
      }
    });
  });
}
