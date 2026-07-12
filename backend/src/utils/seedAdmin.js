const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, "../../../.env") });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const seedAdmin = async () => {
  await mongoose.connect(process.env.DB_CONNECT_LINK);

  const email = 'admin@assetflow.local';
  const existing = await User.findOne({ email });

  if (existing) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash('xxxx', 10);

  const admin = await User.create({
    name: 'System Admin',
    email,
    password: hashedPassword,
    role: 'admin',
    status: 'Active',
  });

  console.log('Admin created:');
  console.log('  email:', admin.email);
  console.log('  password: xxxxx');
  process.exit(0);
};

seedAdmin().catch((err) => {
  console.error('Failed to seed admin:', err);
  process.exit(1);
});