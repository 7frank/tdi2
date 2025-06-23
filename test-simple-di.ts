// test-simple-di.ts - Simple test to verify DI works

import { BuildTimeDITransformer } from './tools/build-time-di-transformer';

async function testSimpleDI() {
  console.log('🧪 Testing Simple DI...');

  try {
    console.log('📁 Creating build-time transformer...');
    
    const transformer = new BuildTimeDITransformer({
      srcDir: './src',
      generateDebugFiles: false,
      verbose: true
    });

    console.log('🔍 Running transformation...');
    const transformedFiles = await transformer.transformForBuild();
    
    console.log(`✅ Success! Transformed ${transformedFiles.size} files`);
    
    for (const [filePath, content] of transformedFiles) {
      console.log(`\n📄 File: ${filePath}`);
      console.log(`📏 Content length: ${content.length} characters`);
      
      // Show first few lines of transformed content
      const lines = content.split('\n').slice(0, 10);
      console.log('📋 First 10 lines:');
      lines.forEach((line, i) => console.log(`  ${i + 1}: ${line}`));
      
      if (content.split('\n').length > 10) {
        console.log('  ...');
      }
    }

    const summary = transformer.getTransformationSummary();
    console.log(`\n📊 Summary: ${summary.count} functions in ${summary.transformedFiles.length} files`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSimpleDI();