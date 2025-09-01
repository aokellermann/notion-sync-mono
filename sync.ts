import { getNotionClient } from "./utils/notion_utils";
import type { Exporter } from "./providers/exporter";
import { FunctionHealthService } from "./providers/function_health/provider";
import type { Provider } from "./providers/provider";
import { useBrowser } from "./utils/puppeteer_utils";
import { FunctionHealthBiomarkerExporter } from "./providers/function_health/biomarker_exporter";
import { FunctionHealthBiometricExporter } from "./providers/function_health/biometric_exporter";

function createService<TService extends Provider<TData>, TExporter extends Exporter<TData>, TData>(service: TService, exporter: TExporter[]): [TService, TExporter[]] {
  return [service, exporter] as [TService, TExporter[]]
}

if (import.meta.main) {
    (async () => {
      try {
        Bun.env;
        await useBrowser(async (browser) => {
            const notion = getNotionClient();
            const serviceMap = new Map<Provider<any>, Exporter<any>[]>([
                createService(new FunctionHealthService(browser), [ new FunctionHealthBiomarkerExporter(notion), new FunctionHealthBiometricExporter(notion)])
            ]);

            for (const [service, exporters] of serviceMap.entries()) {
                console.log(`Fetching data from ${service.constructor.name}`);
                const data = await service.getData();
                console.log(`Exporting data to ${exporters.length} exporters`);
                for (const exporter of exporters) {
                    console.log(`Exporting data to ${exporter.constructor.name}`);
                    await exporter.exportData(data);
                }
            }
        });
      } catch (error) {
        console.error("💥 Script execution failed:", error);
      }
    })();
  }
