export function formatFullName(name: string) {
    // Format as 'LAST NAME, FIRSTNAME MIDDLENAME' in allcaps for display, preserving special characters
    if (!name) return '';
    const parts = name.split(',').map(p => p.trim());
    let formatted = '';
    if (parts.length === 3) {
        formatted = `${parts[0]}, ${parts[1]} ${parts[2]}`;
    } else if (parts.length === 2) {
        formatted = `${parts[0]}, ${parts[1]}`;
    } else {
        formatted = name;
    }
    // Use toLocaleUpperCase to support ñ and other special characters
    return formatted.toLocaleUpperCase('en-US');
}
