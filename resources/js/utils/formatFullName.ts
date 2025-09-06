export function formatFullName(name: string) {
    const parts = name.split(',').map(p => p.trim());
    if (parts.length === 3) {
        return `${parts[0]}, ${parts[1]} ${parts[2]}`;
    } else if (parts.length === 2) {
        return `${parts[0]}, ${parts[1]}`;
    }
    return name;
}
