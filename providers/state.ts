import type { DatabaseResults } from "../utils/notion_utils";

export class ProviderRecords {
    public result: DatabaseResults | null = null;
}

export class State {
    public static instance: State = new State();

    public providerRecords: Map<string, ProviderRecords> = new Map();
}
