import { Exporter } from "../exporter";
import type { FunctionHealthData } from "./types";
import { createPages, getAllPages, getPlainText, type DatabaseProperties, type NotionClient } from "../../utils/notion_utils";
import { calculateSyncUpdates } from "../../utils/sync_utils";

declare module "bun" {
    interface Env {
        FUNCTION_HEALTH_RESULTS_DATABASE_ID: string;
    }
}

export class FunctionHealthResultsExporter extends Exporter<FunctionHealthData> {
    constructor(notion: NotionClient) {
        super(notion, Bun.env.FUNCTION_HEALTH_RESULTS_DATABASE_ID);
    }

    async createSchema(data: FunctionHealthData): Promise<DatabaseProperties> {
        // const biomarkerNames = data.data.categories.flatMap(record => record.category.biomarkers).map(biomarker => biomarker.name);

        const schema: DatabaseProperties = {
            "date": { type: "date" },
            "biomarker": { type: "select" },
            "value": { type: "rich_text" },
            "unit": { type: "rich_text" },
        }

        return schema;
    }

    async writeData(data: FunctionHealthData): Promise<void> {
        const resultsPages = await getAllPages(this.notion, this.databaseId);
        const results = data.data.biomarkerResultsRecord;

        const { pagesToAdd } = await calculateSyncUpdates(resultsPages, (page) => getPlainText(page, "id"), results, (result) => result.currentResult.id);

        await createPages(this.notion, this.databaseId, pagesToAdd, (page) => ({
            "id": { type: "rich_text", rich_text: [{ type: "text", text: { content: page.currentResult.id } }] },
            "date": { type: "date", date: { start: page.currentResult.dateOfService } },
            "biomarker": { type: "select", select: { name: page.biomarker.name.replace(/,/g, '') } },
            "value": { type: "rich_text", rich_text: [{ type: "text", text: { content: page.currentResult.calculatedResult } }] },
            "unit": { type: "rich_text", rich_text: [{ type: "text", text: { content: page.units } }] },
        }));
    }
}
