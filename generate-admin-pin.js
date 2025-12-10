import { createHash } from 'crypto';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=== Admin PIN Hash Generator ===\n');
console.log('This script will generate a secure hash for your 6-digit admin PIN.');
console.log('You will need to add this hash to your .env file.\n');

rl.question('Enter your 6-digit PIN: ', (pin) => {
  if (!/^\d{6}$/.test(pin)) {
    console.error('\nError: PIN must be exactly 6 digits.');
    rl.close();
    process.exit(1);
  }

  const hash = createHash('sha256').update(pin).digest('hex');

  console.log('\n✓ PIN hash generated successfully!\n');
  console.log('Add this line to your .env file:\n');
  console.log(`VITE_ADMIN_PIN_HASH=${hash}\n`);
  console.log('Keep your PIN secure and do not share it with anyone.\n');
  console.log('To access the admin panel, press: Ctrl+Shift+A\n');

  rl.close();
});
