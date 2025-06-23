// test-build-time-di.ts - Test the build-time transformation

import { BuildTimeDITransformer } from './tools/build-time-di-transformer';

async function testBuildTimeTransformation() {
  console.log('🧪 Testing Build-Time DI Transformation...');

  try {
    const transformer = new BuildTimeDITransformer({
      srcDir: './src',
      outputDir: './src/generated',
      generateDebugFiles: true,
      verbose: true
    });

    const transformedFiles = await transformer.transformForBuild();
    const summary = transformer.getTransformationSummary();

    console.log('\n📊 Transformation Summary:');
    console.log(`🎯 Functions transformed: ${summary.count}`);
    console.log(`📁 Files transformed: ${summary.transformedFiles.length}`);
    
    if (summary.functions.length > 0) {
      console.log('\n🔧 Transformed functions:');
      summary.functions.forEach(func => console.log(`  - ${func}`));
    }

    if (transformedFiles.size > 0) {
      console.log('\n📝 Transformed file contents:');
      for (const [filePath, content] of transformedFiles) {
        console.log(`\n📄 ${filePath}:`);
        console.log('---'.repeat(20));
        console.log(content.substring(0, 500) + (content.length > 500 ? '...' : ''));
        console.log('---'.repeat(20));
      }
    }

    console.log('\n✅ Build-time transformation completed successfully!');
    console.log('💡 Check for .di-transformed files in src/components/ for debug output');
    console.log('🚀 The Vite plugin will use these transformations at build time');

  } catch (error) {
    console.error('❌ Build-time transformation failed:', error);
  }
}

// Run the test
testBuildTimeTransformation();