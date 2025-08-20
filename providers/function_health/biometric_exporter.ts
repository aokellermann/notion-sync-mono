import { Exporter } from "../exporter";
import type { Biomarker, FunctionHealthData } from "./types";
import { createPages, DatabaseResults, getAllPages, getPlainText, type DatabaseProperties, type NotionClient } from "../../utils/notion_utils";
import { calculateSyncUpdates } from "../../utils/sync_utils";
import { State } from "../state";
import { FunctionHealthBiomarkerExporter } from "./biomarker_exporter";


declare module "bun" {
    interface Env {
        FUNCTION_HEALTH_BIOMETRIC_DATABASE_ID: string;
        FUNCTION_HEALTH_BIOMARKER_DATABASE_ID: string;
    }
}

export class FunctionHealthBiometricExporter extends Exporter<FunctionHealthData> {
    private biomarkerDatabaseId: string;

    constructor(notion: NotionClient) {
        super(notion, Bun.env.FUNCTION_HEALTH_BIOMETRIC_DATABASE_ID);
        this.biomarkerDatabaseId = Bun.env.FUNCTION_HEALTH_BIOMARKER_DATABASE_ID;
    }

    private getBiomarkerName(name: string): string {
        return name.replace(/,/g, '');
    }

    async createSchema(data: FunctionHealthData): Promise<DatabaseProperties> {
        const schema: DatabaseProperties = {
            "Name": { title: {} },
            "id": { rich_text: {} },
            "date": { date: {} },
            "biomarker": { relation: { database_id: this.biomarkerDatabaseId, single_property: {} } },
            "categories": { rollup: { relation_property_name: "biomarker", rollup_property_name: "Categories", function: "show_original" } },
            "value": { rich_text: {} },
            "unit": { rich_text: {} },
            "inRange": { checkbox: {} },
        }

        return schema;
    }

    async writeData(data: FunctionHealthData): Promise<DatabaseResults> {
        const pagesExisting = await getAllPages(this.notion, this.databaseId);
        const results = data.data.biomarkerResultsRecord;

        const { pagesToAdd } = await calculateSyncUpdates(
            pagesExisting, (page) => getPlainText(page, "id"),
            results, (result) => result.currentResult.id);

        const biomarkerIdToNotionId = new Map<string, string>();
        const state = State.instance.providerRecords.get(FunctionHealthBiomarkerExporter.name)!.result!;
        for (const page of [...state.pagesExisting, ...state.pagesAdded]) {
            const biomarkerId = getPlainText(page, "id");
            biomarkerIdToNotionId.set(biomarkerId, page.id);
        }

        const pagesAdded = await createPages(this.notion, this.databaseId, pagesToAdd, (page) => {
            return {
                "Name": { title: [{ type: "text", text: { content: this.getBiomarkerName(page.biomarker.name) + " - " + page.currentResult.dateOfService } }] },
                "id": { type: "rich_text", rich_text: [{ type: "text", text: { content: page.currentResult.id } }] },
                "date": { type: "date", date: { start: page.currentResult.dateOfService } },
                "biomarker": { type: "relation", relation: [{ id: biomarkerIdToNotionId.get(page.biomarker.id)! }] },
                "value": { type: "rich_text", rich_text: [{ type: "text", text: { content: page.currentResult.calculatedResult } }] },
                "unit": { type: "rich_text", rich_text: [{ type: "text", text: { content: page.units } }] },
                "inRange": { checkbox: page.currentResult.inRange },
            };
        });

        return {
            pagesAdded: pagesAdded,
            pagesExisting: pagesExisting,
        }
    }
} 
