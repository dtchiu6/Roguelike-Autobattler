let counter = 0;
/** Collision-safe incremental id for units / floaters / log entries. */
export const uid = (prefix = 'u') =>
  `${prefix}_${(++counter).toString(36)}`;