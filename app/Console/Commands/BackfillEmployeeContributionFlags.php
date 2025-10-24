<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackfillEmployeeContributionFlags extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'effipay:backfill-employee-flags {--apply : Actually apply the changes} {--limit=10 : Number of sample rows to show}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Preview and (optionally) backfill employees.sss, philhealth, withholding_tax as boolean flags (non-zero -> true)';

    public function handle()
    {
        $apply = $this->option('apply');
        $limit = (int) $this->option('limit');

        $total = DB::table('employees')->count();

        $sssNonZero = DB::table('employees')->whereNotNull('sss')->where('sss', '<>', 0)->count();
        $philNonZero = DB::table('employees')->whereNotNull('philhealth')->where('philhealth', '<>', 0)->count();
        $withholdingNonZero = DB::table('employees')->whereNotNull('withholding_tax')->where('withholding_tax', '<>', 0)->count();

        $this->info("Employees total: {$total}");
        $this->info("SSS non-zero: {$sssNonZero}");
        $this->info("PhilHealth non-zero: {$philNonZero}");
        $this->info("Withholding non-zero: {$withholdingNonZero}");

        $this->line('');
        $this->info('Sample rows with non-zero SSS (id, sss, philhealth, withholding_tax):');
        $samples = DB::table('employees')
            ->select('id', 'sss', 'philhealth', 'withholding_tax')
            ->whereNotNull('sss')
            ->where('sss', '<>', 0)
            ->limit($limit)
            ->get();

        if ($samples->isEmpty()) {
            $this->line('  (none)');
        } else {
            foreach ($samples as $r) {
                $this->line("  id={$r->id} sss={$r->sss} philhealth={$r->philhealth} withholding={$r->withholding_tax}");
            }
        }

        $this->line('');
        if (! $apply) {
            $this->warn('No changes applied. Re-run with --apply to perform the backfill.');
            return 0;
        }

        DB::beginTransaction();
        try {
            $this->warn('Applying backfill: converting numeric values to 0/1 flags (non-zero => 1).');

            // Use raw SQL updates to minimize Eloquent casts interference.
            DB::statement("UPDATE employees SET sss = CASE WHEN sss IS NULL OR sss = 0 THEN 0 ELSE 1 END");
            DB::statement("UPDATE employees SET philhealth = CASE WHEN philhealth IS NULL OR philhealth = 0 THEN 0 ELSE 1 END");
            DB::statement("UPDATE employees SET withholding_tax = CASE WHEN withholding_tax IS NULL OR withholding_tax = 0 THEN 0 ELSE 1 END");

            DB::commit();
            $this->info('Backfill applied successfully.');
            $this->info('You may now run the migration to change column types to boolean.');
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Failed to apply backfill: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
