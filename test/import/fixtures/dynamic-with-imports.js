import { foo } from 'lodash';

export function bar() {
  import('./dynamic-imported.js').then(module => module.handleImport(foo));
}

export { foo };
