<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Observance Data Debug ===\n\n";

$obs = App\Models\Observance::where('date', 'like', '2025-01%')->orderBy('date')->get();
echo "Total observances: " . $obs->count() . "\n\n";

foreach ($obs as $o) {
    echo "Date: " . $o->date . "\n";
    echo "  type field: " . var_export($o->type, true) . "\n";
    echo "  label field: " . var_export($o->label, true) . "\n";
    echo "  type === null: " . ($o->type === null ? 'TRUE' : 'FALSE') . "\n";
    echo "  isset(type): " . (isset($o->type) ? 'TRUE' : 'FALSE') . "\n";
    
    // Simulate what backend does
    $obsType = $o->type ? strtolower((string)$o->type) : '';
    echo "  Backend obsType: '$obsType'\n";
    echo "  Backend !obsType: " . (!$obsType ? 'TRUE' : 'FALSE') . "\n";
    
    // Simulate JSON encoding
    $json = json_encode(['type' => $o->type, 'label' => $o->label]);
    echo "  JSON: $json\n";
    $decoded = json_decode($json);
    echo "  Decoded type: " . var_export($decoded->type, true) . "\n";
    echo "  Decoded type === null: " . ($decoded->type === null ? 'TRUE' : 'FALSE') . "\n";
    
    echo "\n";
}

// Now test the frontend observance map building
echo "\n=== Frontend Simulation ===\n";
$obsRes = App\Models\Observance::where('date', 'like', '2025-01%')->get()->toArray();
$map = [];
foreach ($obsRes as $o) {
    $d = substr($o['date'], 0, 10);
    // Frontend code: map[d] = { type: o?.type, label: o?.label, start_time: o?.start_time };
    $map[$d] = ['type' => $o['type'], 'label' => $o['label']];
    
    echo "Date $d:\n";
    echo "  map[type]: " . var_export($map[$d]['type'], true) . "\n";
    echo "  map[type] === null: " . ($map[$d]['type'] === null ? 'TRUE' : 'FALSE') . "\n";
    
    // Frontend getObservanceInfo simulation
    $obs = $map[$d];
    $type = isset($obs['type']) && $obs['type'] ? strtolower($obs['type']) : "";
    $hasNullType = isset($obs) && ($obs['type'] === null || !isset($obs['type']));
    echo "  Frontend type: '$type'\n";
    echo "  Frontend hasNullType: " . ($hasNullType ? 'TRUE' : 'FALSE') . "\n";
    echo "\n";
}
