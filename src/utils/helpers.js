export const devLog = (...args) => {
  if (__DEV__) {
    console.log(...args);
  }
};

export const devError = (...args) => {
  if (__DEV__) {
    console.error(...args);
  }
};
