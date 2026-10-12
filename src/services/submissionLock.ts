export const createSubmissionLock = () => {
  let locked = false;

  return {
    async run<T>(operation: () => Promise<T>): Promise<{ started: false } | { started: true; value: T }> {
      if (locked) return { started: false };
      locked = true;
      try {
        return { started: true, value: await operation() };
      } finally {
        locked = false;
      }
    },
  };
};
