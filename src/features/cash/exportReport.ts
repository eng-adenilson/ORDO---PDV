import { getCashExpected, getDailyReport } from '@/data/repo';
import { reportWorkbook } from '@/lib/export/reports';
import { saveXlsx, stampName } from '@/lib/export/shareFile';
import type { ExportedFile } from '@/features/common/ExportSheet';

/** Gera o .xlsx do relatório do dia (com dados do caixa, se houver) e devolve o arquivo salvo. */
export async function exportDayReport(counted?: { opening_cents: number; expected_cents: number; counted_cents: number }): Promise<ExportedFile> {
  const [report, exp] = await Promise.all([getDailyReport(), getCashExpected()]);
  const cash = counted ?? (exp ? { opening_cents: exp.opening_cents, expected_cents: exp.expected_cents } : null);
  const saved = await saveXlsx(stampName('relatorio'), reportWorkbook(report, cash));
  return { ...saved, detail: `${report.sales_count} vendas · ${report.date}` };
}
