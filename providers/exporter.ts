export interface Exporter<TData> {
    exportData: (data: TData) => Promise<void>;
}
