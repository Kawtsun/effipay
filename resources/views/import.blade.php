@extends('app') {{-- or 'layouts.app' if your layout is in a subfolder --}}

@section('content')
    <h2>Import Users</h2>

    @if(session('success'))
        <div style="color: green;">{{ session('success') }}</div>
    @endif

    <form action="{{ route('users.import') }}" method="POST" enctype="multipart/form-data">
        @csrf
        <input type="file" name="file" required>
        <button type="submit">Upload</button>
    </form>
@endsection
