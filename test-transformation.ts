// test-transformation.ts - Test the functional DI transformation safely

import { DITransformer } from './tools/di-transformer';
import * as fs from 'fs';

async function testTransformation() {
  console.log('🧪 Testing Safer Functional DI Transformation...');

  try {
    // Create backup of files we'll modify
    const filesToBackup = [
      './src/components/NewFunctionalComponent.tsx',
      './src/components/SimpleTestComponent.tsx'
    ];
    
    for (const filePath of filesToBackup) {
      const backupPath = `${filePath}.backup`;
      if (fs.existsSync(filePath) && !fs.existsSync(backupPath)) {
        fs.copyFileSync(filePath, backupPath);
        console.log(`📄 Created backup of ${filePath}`);
      }
    }

    // Run the transformer with safer approach
    const transformer = new DITransformer({
      verbose: true,
      srcDir: './src',
      outputDir: './src/generated',
      enableFunctionalDI: true
    });

    await transformer.transform();
    await transformer.save();

    console.log('✅ Transformation completed successfully!');
    console.log('💡 Check the transformed components - new versions added alongside originals');
    console.log('🚀 Run "npm run dev" to see the results!');

  } catch (error) {
    console.error('❌ Transformation failed:', error);
    
    // Restore backups if transformation failed
    const filesToRestore = [
      './src/components/NewFunctionalComponent.tsx',
      './src/components/SimpleTestComponent.tsx'
    ];
    
    for (const filePath of filesToRestore) {
      const backupPath = `${filePath}.backup`;
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, filePath);
        console.log(`🔄 Restored backup for ${filePath}`);
      }
    }
  }
}

// Run the test
testTransformation();