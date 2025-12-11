const PREFIX = '[CoopMgr]';

export const info = (...args: any[]) => {
  // eslint-disable-next-line no-console
  console.log(PREFIX, ...args);
};

export const warn = (...args: any[]) => {
  // eslint-disable-next-line no-console
  console.warn(PREFIX, ...args);
};

export const error = (...args: any[]) => {
  // eslint-disable-next-line no-console
  console.error(PREFIX, ...args);
};

export const debug = (...args: any[]) => {
  // eslint-disable-next-line no-console
  console.debug(PREFIX, ...args);
};

export default { info, warn, error, debug };
