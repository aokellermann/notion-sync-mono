import { Exporter } from "../exporter";
import type { Biomarker, FunctionHealthData } from "./types";
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

    private getBiomarkerName(name: string): string {
        return name.replace(/,/g, '');
    }

    async createSchema(data: FunctionHealthData): Promise<DatabaseProperties> {
        const biomarkerNames = Array.from(new Set(data.data.biomarkerResultsRecord.flatMap(record => record.biomarker.name).map(name => this.getBiomarkerName(name)))).map(name => ({ name }));
        const categoryNames = Array.from(new Set(data.data.biomarkerResultsRecord.flatMap(record => record.biomarker.categories.map(category => category.categoryName)))).map(name => ({ name }));

        const schema: DatabaseProperties = {
            "date": { date: {} },
            // "biomarker": { select: { options: biomarkerNames } },
            "biomarker": { rich_text: {} },
            "category": { multi_select: { options: categoryNames } },
            "value": { rich_text: {} },
            "unit": { rich_text: {} },
            "inRange": { checkbox: {} },
        }

        return schema;
    }

    async writeData(data: FunctionHealthData): Promise<void> {
        const resultsPages = await getAllPages(this.notion, this.databaseId);
        const results = data.data.biomarkerResultsRecord;

        const { pagesToAdd } = await calculateSyncUpdates(resultsPages, (page) => getPlainText(page, "id"), results, (result) => result.currentResult.id);

        const nameToCategory = new Map<string, Set<string>>();
        for (const category of data.data.categories) {
            for (const biomarker of category.category.biomarkers) {
                const categoryName = this.getBiomarkerName(biomarker.name);
                if (!nameToCategory.has(categoryName)) {
                    nameToCategory.set(categoryName, new Set());
                }
                nameToCategory.get(categoryName)!.add(category.category.categoryName);
            }
        }

        const getCategories = (biomarker: Biomarker): string[] => {
            const categories = biomarker.categories.map(category => category.categoryName);
            const categoryName = this.getBiomarkerName(biomarker.name);
            const additionalCategories = [...nameToCategory.get(categoryName)!];

            const allCategories = new Set([...categories, ...additionalCategories]);

            // for some reason, STIs are in the Other category
            if (allCategories.has("Other")) {
                allCategories.delete("Other");
                allCategories.add("STI");
            }

            return [...allCategories];
        }

        await createPages(this.notion, this.databaseId, pagesToAdd, (page) => ({
            "Name": { title: [{ type: "text", text: { content: this.getBiomarkerName(page.biomarker.name) + " - " + page.currentResult.dateOfService } }] },
            "id": { type: "rich_text", rich_text: [{ type: "text", text: { content: page.currentResult.id } }] },
            "date": { type: "date", date: { start: page.currentResult.dateOfService } },
            // "biomarker": { type: "select", select: { name: this.getBiomarkerName(page.biomarker.name) } },
            "biomarker": { type: "rich_text", rich_text: [{ type: "text", text: { content: this.getBiomarkerName(page.biomarker.name) } }] },
            "category": { type: "multi_select", multi_select: getCategories(page.biomarker).map(category => ({ name: category })) },
            "value": { type: "rich_text", rich_text: [{ type: "text", text: { content: page.currentResult.calculatedResult } }] },
            "unit": { type: "rich_text", rich_text: [{ type: "text", text: { content: page.units } }] },
            "inRange": { checkbox: page.currentResult.inRange },
        }));
    }
}
