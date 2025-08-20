import { ensureDatabaseProperties, type DatabaseProperties, type NotionClient, type DatabaseResults } from "../utils/notion_utils";
import { State } from "./state";

export abstract class Exporter<TData> {
    protected notion: NotionClient;
    protected databaseId: string;

    constructor(notion: NotionClient, databaseId: string) {
        this.notion = notion;
        this.databaseId = databaseId;
    }

    protected abstract writeData(data: TData): Promise<DatabaseResults>;

    protected abstract createSchema(data: TData): Promise<DatabaseProperties>;

    async exportData(data: TData): Promise<void> {
        const schema = await this.createSchema(data);
        await ensureDatabaseProperties(this.notion, this.databaseId, schema);
        const results = await this.writeData(data);
        State.instance.providerRecords.set(this.constructor.name, {
            result: results,
        });
    }
}
