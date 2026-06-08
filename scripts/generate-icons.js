#!/usr/bin/env node
// scripts/generate-icons.js — run with: node scripts/generate-icons.js
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#2563eb');
  gradient.addColorStop(1, '#7c3aed');
  ctx.fillStyle = gradient;
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();

  // Lightning bolt emoji text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.55}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚡', size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

const dir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

try {
  fs.writeFileSync(path.join(dir, 'icon-192.png'), generateIcon(192));
  fs.writeFileSync(path.join(dir, 'icon-512.png'), generateIcon(512));
  console.log('✅ Icons generated');
} catch (e) {
  console.log('⚠️  canvas not available — create icons/icon-192.png and icons/icon-512.png manually');
}
