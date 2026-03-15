#!/usr/bin/env node

const { execFileSync } = require('child_process');

function main() {
  const raw = execFileSync('docker', ['ps', '--format', '{{json .}}'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });

  const rows = raw
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (!rows.length) {
    console.log('No running containers');
    return;
  }

  const headers = ['NAME', 'STATUS', 'PORTS'];
  const widths = headers.map((h) => h.length);

  const formatted = rows.map((row) => {
    const name = row.Names ?? '';
    const status = row.Status ?? '';
    const ports = row.Ports ?? '';

    widths[0] = Math.max(widths[0], name.length);
    widths[1] = Math.max(widths[1], status.length);
    widths[2] = Math.max(widths[2], ports.length);

    return { name, status, ports };
  });

  const pad = (value, len) =>
    value + ' '.repeat(Math.max(0, len - value.length));

  const header = headers.map((h, i) => pad(h, widths[i])).join('  ');
  console.log(header);
  console.log('-'.repeat(header.length));

  formatted.forEach(({ name, status, ports }) => {
    console.log(
      pad(name, widths[0]) +
        '  ' +
        pad(status, widths[1]) +
        '  ' +
        pad(ports, widths[2]),
    );
  });
}

main();
