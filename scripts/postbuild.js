const { cp, mkdir, access } = require('fs/promises');
const { join } = require('path');

async function main() {
  const outDir = join(process.cwd(), 'out');
  try {
    await access(outDir);
  } catch {
    console.error('Build output not found:', outDir);
    return;
  }

  const destDir = join(process.cwd(), '.firebase', 'apprepon', 'hosting');
  await mkdir(destDir, { recursive: true });
  await cp(outDir, destDir, { recursive: true });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
