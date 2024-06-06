/**
 * Sort by descending order
 *
 * @param {any} a value
 * @param {any} b value
 * @param {string} orderBy  key value
 * @returns {number} Sorted value
 */
export function desc(a: any, b: any, orderBy: any) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

/**
 * Stable sort function
 *
 * @param {any[]} array Data to sort
 * @param {Function} cmp Comparisor
 * @returns {any[]} Sorted array
 */
export function stableSort(array: any[], cmp: any) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = cmp(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

/**
 * Get a sort function based on order
 *
 * @param {string} order Order type
 * @param {string} orderBy sort based on key
 * @returns {Function} sorting function
 */
export function getSorting(order: string, orderBy: string) {
  return order === 'desc'
    ? (a: any, b: any) => desc(a, b, orderBy)
    : (a: any, b: any) => -desc(a, b, orderBy);
}
