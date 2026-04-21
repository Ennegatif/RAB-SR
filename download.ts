import https from 'https';
import fs from 'fs';
import path from 'path';

const download = (url: string, dest: string) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

const run = async () => {
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
  }
  console.log('Downloading 192x192...');
  await download('https://picsum.photos/seed/construction/192/192', path.join('public', 'icon-192.png'));
  console.log('Downloading 512x512...');
  await download('https://picsum.photos/seed/construction/512/512', path.join('public', 'icon-512.png'));
  console.log('Done!');
};

run();
