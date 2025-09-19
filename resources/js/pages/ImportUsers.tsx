import { useForm } from '@inertiajs/react';

export default function ImportUsers() {
    const { data, setData, post, errors } = useForm<{ file: File | null }>({
        file: null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('import.users'), {
            onSuccess: () => {
                window.location.href = route('import.preview');
            },
        });
    };

    return (
        <div>
            <h1>Import Users</h1>
            <form onSubmit={handleSubmit} encType="multipart/form-data">
                <input
                    type="file"
                    name="file"
                    accept=".csv,.txt,.xlsx,.xls"
                    onChange={e => setData('file', e.target.files && e.target.files.length > 0 ? e.target.files[0] : null)}
                    required
                />
                {errors.file && <div style={{ color: 'red' }}>{errors.file}</div>}
                <button type="submit">Upload</button>
            </form>
        </div>
    );
}
