import { getNotionClient } from "./notion_utils";
import type { Exporter } from "./providers/exporter";
import { FunctionHealthExporter } from "./providers/function_health/exporter";
import { FunctionHealthService } from "./providers/function_health/provider";
import type { FunctionHealthData } from "./providers/function_health/types";
import type { Provider } from "./providers/provider";
import { useBrowser } from "./puppeteer_utils";

if (import.meta.main) {
    (async () => {
      try {
        Bun.env;
        await useBrowser(async (browser) => {
            const notion = getNotionClient();
            const serviceMap = new Map<Provider<any>, Exporter<any>[]>([
                [new FunctionHealthService(browser), [new FunctionHealthExporter(notion)]] as [Provider<FunctionHealthData>, Exporter<FunctionHealthData>[]]
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
