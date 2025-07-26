import { ensureDatabaseProperties, type DatabaseProperties, type NotionClient } from "../utils/notion_utils";

export abstract class Exporter<TData> {
    protected notion: NotionClient;
    protected databaseId: string;

    constructor(notion: NotionClient, databaseId: string) {
        this.notion = notion;
        this.databaseId = databaseId;
    }

    protected abstract writeData(data: TData): Promise<void>;

    protected abstract createSchema(data: TData): Promise<DatabaseProperties>;

    async exportData(data: TData): Promise<void> {
        const schema = await this.createSchema(data);
        await ensureDatabaseProperties(this.notion, this.databaseId, schema);
        await this.writeData(data);
    }
}
