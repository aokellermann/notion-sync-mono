import type { Exporter } from "../exporter";
import type { FunctionHealthData } from "./types";
import { createPages, ensureDatabaseProperties, getAllPages, getPlainText, type NotionClient, type PageProperties, type PagePropertyValue } from "../../notion_utils";
import { calculateSyncUpdates } from "../../sync_utils";

export class FunctionHealthExporter implements Exporter<FunctionHealthData> {
    private notion: NotionClient;

    constructor(client: NotionClient) {
        this.notion = client;
    }

    async exportCategories(data: FunctionHealthData): Promise<void> {
        const databaseId = "23ccab5b81e580839ffcf2d5ce716562"

        await ensureDatabaseProperties(this.notion, databaseId, {
            id: "rich_text",
            Name: "title",
            questBiomarkerCode: "number",
        });

        const categoryPages = await getAllPages(this.notion, databaseId);
        const categories = data.data.categories.flatMap(record => record.category.biomarkers);

        const { pagesToAdd } = await calculateSyncUpdates(categoryPages, (page) => getPlainText(page, "id"), categories, (category) => category.id);

        await createPages(this.notion, databaseId, pagesToAdd, (page) => ({
            "id": { type: "rich_text", rich_text: [{ type: "text", text: { content: page.id } }] },
            "Name": { type: "title", title: [{ type: "text", text: { content: page.name } }] },
            "questBiomarkerCode": { type: "number", number: parseInt(page.questBiomarkerCode) },
        }));
    }
    
    async exportData(data: FunctionHealthData): Promise<void> {
        await this.exportCategories(data);
    }
}
