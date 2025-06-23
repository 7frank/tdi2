// test-transformation.ts - Test the functional DI transformation safely

import { DITransformer } from './tools/di-transformer';
import * as fs from 'fs';

async function testTransformation() {
  console.log('🧪 Testing Functional DI Transformation...');

  try {
    // Create backup of original files
    const newComponentPath = './src/components/NewFunctionalComponent.tsx';
    const backupPath = './src/components/NewFunctionalComponent.tsx.backup';
    
    if (fs.existsSync(newComponentPath) && !fs.existsSync(backupPath)) {
      fs.copyFileSync(newComponentPath, backupPath);
      console.log('📄 Created backup of NewFunctionalComponent.tsx');
    }

    // Run the transformer
    const transformer = new DITransformer({
      verbose: true,
      srcDir: './src',
      outputDir: './src/generated',
      enableFunctionalDI: true
    });

    await transformer.transform();
    await transformer.save();

    console.log('✅ Transformation completed successfully!');
    console.log('💡 Check the transformed components in src/components/NewFunctionalComponent.tsx');
    console.log('🚀 Run "npm run dev" to see the results!');

  } catch (error) {
    console.error('❌ Transformation failed:', error);
    
    // Restore backup if transformation failed
    const newComponentPath = './src/components/NewFunctionalComponent.tsx';
    const backupPath = './src/components/NewFunctionalComponent.tsx.backup';
    
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, newComponentPath);
      console.log('🔄 Restored backup due to transformation failure');
    }
  }
}

// Run the test
testTransformation();