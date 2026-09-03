import { hash } from 'bcryptjs';

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('用法：node scripts/generate-admin-hash.mjs "至少8位的密码"');
  process.exitCode = 1;
} else {
  console.log(await hash(password, 12));
}
