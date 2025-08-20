import { Exporter } from "../exporter";
import type { FunctionHealthData } from "./types";
import { createPages, getAllPages, getPlainText, type DatabaseProperties, type NotionClient, type DatabaseResults } from "../../utils/notion_utils";
import { calculateSyncUpdates } from "../../utils/sync_utils";

declare module "bun" {
    interface Env {
        FUNCTION_HEALTH_BIOMARKER_DATABASE_ID: string;
    }
}

export class FunctionHealthBiomarkerExporter extends Exporter<FunctionHealthData> {
    constructor(notion: NotionClient) {
        super(notion, Bun.env.FUNCTION_HEALTH_BIOMARKER_DATABASE_ID);
    }

    private _getBiomarkerName(name: string): string {
        return name.replace(/,/g, '');
    }

    private _getCategoryName(name: string): string {
        return name === "Other" ? "STI" : name;
    }

    private _getBiomarkerToCategories(data: FunctionHealthData): Map<string, Set<string>> {
        const biomarkerToCategories = new Map<string, Set<string>>();
        for (const category of data.data.categories) {
            for (const biomarker of category.category.biomarkers) {
                const biomarkerId = biomarker.id;
                const categoryName = this._getCategoryName(category.category.categoryName);
                if (!biomarkerToCategories.has(biomarkerId)) {
                    biomarkerToCategories.set(biomarkerId, new Set());
                }
                biomarkerToCategories.get(biomarkerId)!.add(categoryName);
            }
        }

        for (const biomarker of data.data.biomarkerResultsRecord) {
            for (const category of biomarker.biomarker.categories) {
                const biomarkerId = biomarker.biomarker.id;
                const categoryName = this._getCategoryName(category.categoryName);
                if (!biomarkerToCategories.has(biomarkerId)) {
                    biomarkerToCategories.set(biomarkerId, new Set());
                }
                biomarkerToCategories.get(biomarkerId)!.add(categoryName);
            }
        }

        return biomarkerToCategories;
    }

    async createSchema(data: FunctionHealthData): Promise<DatabaseProperties> {
        const biomarkerToCategories = this._getBiomarkerToCategories(data);

        const allCategories = new Set<string>();
        for (const categories of biomarkerToCategories.values()) {
            for (const category of categories) {
                allCategories.add(category);
            }
        }

        const schema: DatabaseProperties = {
            "Name": { title: {} },
            "id": { rich_text: {} },
            "Categories": { multi_select: { options: Array.from(allCategories).map(category => ({ name: category })) } },
        }

        return schema;
    }

    async writeData(data: FunctionHealthData): Promise<DatabaseResults> {
        const biomarkerToCategories = this._getBiomarkerToCategories(data);

        const pagesExisting = await getAllPages(this.notion, this.databaseId);
        const biomarkers = data.data.biomarkerResultsRecord.map(record => record.biomarker);

        const { pagesToAdd } = await calculateSyncUpdates(
            pagesExisting, (page) => getPlainText(page, "id"),
            biomarkers, (biomarker) => biomarker.id);

        const pagesAdded = await createPages(this.notion, this.databaseId, pagesToAdd, (biomarker) => ({
            "Name": { title: [{ type: "text", text: { content: this._getBiomarkerName(biomarker.name) } }] },
            "id": { type: "rich_text", rich_text: [{ type: "text", text: { content: biomarker.id } }] },
            "Categories": { 
                type: "multi_select", 
                multi_select: Array.from(biomarkerToCategories.get(biomarker.id)!).map(category => ({ 
                    name: category
                })) 
            },
        }));

        return {
            pagesAdded: pagesAdded,
            pagesExisting: pagesExisting,
        }
    }
} 
