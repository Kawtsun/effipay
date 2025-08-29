@extends('app')

@section('content')
    <div class="container mt-4">
        <h2>Imported Data Preview</h2>
        @if(count($importedData) > 0)
            <div class="table-responsive">
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            @foreach(array_keys($importedData[0]) as $header)
                                <th>{{ $header }}</th>
                            @endforeach
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($importedData as $row)
                            <tr>
                                @foreach($row as $value)
                                    <td>{{ $value }}</td>
                                @endforeach
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @else
            <p>No data imported or file was empty.</p>
        @endif
    </div>
@endsection
