import { Base } from './base.js';

export class Derived extends Base {
  name() {
    return `derived from ${super.name()}`;
  }
}

export { Base };
