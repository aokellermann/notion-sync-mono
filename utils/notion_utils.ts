import { Client, type DatabaseObjectResponse, type PartialPageObjectResponse, type PageObjectResponse, type PartialDatabaseObjectResponse } from "@notionhq/client";
import type { UpdateDatabaseParameters, CreatePageParameters } from "@notionhq/client/build/src/api-endpoints";

export type NotionClient = Client;
export type QueryDatabaseResponseResult = PageObjectResponse// | PartialPageObjectResponse | PartialDatabaseObjectResponse | DatabaseObjectResponse;

export type PageProperties = PageObjectResponse["properties"];
export type PagePropertyValue = PageProperties[string];

export type DatabaseProperties = NonNullable<UpdateDatabaseParameters["properties"]>;

declare module "bun" {
    interface Env {
        NOTION_TOKEN: string;
    }
}

export const getNotionClient = () => {
    return new Client({
        auth: Bun.env.NOTION_TOKEN,
    });
}

export const getAllPages = async (client: NotionClient, databaseId: string, cursor?: string | undefined): Promise<QueryDatabaseResponseResult[]> => {
    if (!cursor) {
        console.log("Getting all pages for database", databaseId);
    }
    const pages = await client.databases.query({
        database_id: databaseId,
        start_cursor: cursor,
    });
    if (pages.has_more) {
        const nextPages = await getAllPages(client, databaseId, pages.next_cursor ?? undefined);
        return [...pages.results, ...nextPages] as QueryDatabaseResponseResult[];
    }
    console.log("Found", pages.results.length, "pages");
    return pages.results as QueryDatabaseResponseResult[];
}

export const ensureDatabaseProperties = async (client: NotionClient, databaseId: string, properties: DatabaseProperties) => {
    console.log("Ensuring database properties for database", databaseId, properties);

    properties = { ...properties, id: { rich_text: {} }, Name: { title: {} } };

    await client.databases.update({
        database_id: databaseId,
        properties: properties,
    });
}

export const createPages = async<T>(client: NotionClient, databaseId: string, pages: T[], buildProperties: (page: T) => CreatePageParameters["properties"]) => {
    for (const page of pages) {
        await client.pages.create({
            parent: { type: "database_id", database_id: databaseId },
            properties: buildProperties(page),
        });
    }
}

export const getPlainText = (page: PageObjectResponse, property: string) => {
    return (page.properties[property] as PagePropertyValue & { type: "rich_text" }).rich_text[0]?.plain_text ?? "";
}


