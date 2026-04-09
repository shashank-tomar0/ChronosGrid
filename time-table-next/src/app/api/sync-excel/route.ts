import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function POST() {
  return new Promise((resolve) => {
    // Path to the python script (one level up from the project root)
    const scriptPath = path.resolve(process.cwd(), '..', 'read_excel2.py');
    const jsonSource = path.resolve(process.cwd(), '..', 'timetable_data.json');
    const jsonDest = path.resolve(process.cwd(), 'src', 'lib', 'timetable_data.json');

    console.log(`Executing: python "${scriptPath}"`);

    exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return resolve(NextResponse.json({ error: error.message, stderr }, { status: 500 }));
      }

      // After running the script, we need to copy the new JSON into our src/lib
      // Use fs.copyFileSync or similar if needed, but since we're on Windows, 'copy' works
      exec(`copy "${jsonSource}" "${jsonDest}"`, (copyErr) => {
        if (copyErr) {
          console.error(`copy error: ${copyErr}`);
          return resolve(NextResponse.json({ error: 'Failed to sync JSON to source', copyErr }, { status: 500 }));
        }

        resolve(NextResponse.json({ 
          success: true, 
          message: 'Excel Synced successfully',
          stdout 
        }));
      });
    });
  });
}
