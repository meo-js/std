import { config } from '@meojs/utc';

export default config({
  web: {
    build: {
      conditions: ['cocos', 'node', 'default'],
      tsdown: {
        external: ['cc/env', 'cc'],
      },
    },
    test: {
      vitest: {
        test: {
          setupFiles: './test/setup.ts',
        },
      },
    },
  },
});
