const bcrypt = require('bcryptjs');
const hashes = {
  santiago: '$2a$10$sHfNQd0Vji4PefUKeXaUJOmUxc/u0umoKr.picLfnYfEci8YxrWju',
  martin: '$2a$10$/K.Jg1QC0cJnb1rGmt21feutnQ.Lqp2Wi4FFqJfj0X2ygPBO8wnbC',
  mancilla: '$2a$10$OLZrobw3.WmfpYCI7Of8f.GHy4h.Tek58HWCSLf/4YrZTNuOGa6pu'
};
const candidates = [
  'sena2024', 'admin123', 'aprendiz123', '12345678', '87654321',
  '1037658690', '123475869', '1037000111', 'santiago', 'martin', 'mancilla',
  'santiagocisneros046@gmail.com', 'martin@gmail.com', 'mancilla@gmail.com',
  '', 'password', '123456', 'sena2025', 'sena2026', 'sena', 'Sena2024',
  'Sena2024*', 'sena2024*', 'sena2024.', 'Sena2024.', 'admin', 'admin123*',
  'admin123.', 'Admin123', 'Admin123*', 'Admin123.', 'sena123', 'Sena123',
  'sena123*', 'Sena123*', 'sena2024!', 'Sena2024!', 'sena2024#', 'Sena2024#'
];
async function test() {
  for (const [name, hash] of Object.entries(hashes)) {
    let found = false;
    for (const cand of candidates) {
      if (await bcrypt.compare(cand, hash)) {
        console.log(`✅ ${name} MATCHES '${cand}'`);
        found = true;
      }
    }
    if (!found) {
      console.log(`❌ No match found for ${name}`);
    }
  }
}
test();
