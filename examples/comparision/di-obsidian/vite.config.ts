import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import obsidian from 'swc-plugin-obsidian'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      tsDecorators: true,
      plugins: [
        obsidian()
      ],
      // @ts-expect-error - useAtYourOwnRisk_mutateSwcOptions is intentionally undocumented
      useAtYourOwnRisk_mutateSwcOptions: (options) => {
        options.jsc.parser.decorators = true;
        options.jsc.experimental.runPluginFirst = true;
      }
    })
  ],
})
