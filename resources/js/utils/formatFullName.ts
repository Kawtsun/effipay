// Accepts last, first, and middle as arguments for clarity
export function formatFullName(last: string, first: string, middle?: string) {
    last = last || '';
    first = first || '';
    // Omit middle if null, undefined, empty, or string 'null' (case-insensitive)
    if (!middle || String(middle).trim().toLowerCase() === 'null') {
        middle = '';
    }
    const full = middle
        ? `${last}, ${first} ${middle}`
        : `${last}, ${first}`;
    return full.toLocaleUpperCase('en-US');
}
