export abstract class Provider<TData> {
    protected cacheFile: string;

    constructor(cacheFile: string) {
        this.cacheFile = cacheFile;
    }

    protected abstract fetchData(): Promise<TData>;

    async getData(): Promise<TData> {
        if (process.env.USE_CACHE && await Bun.file(this.cacheFile).exists()) {
            console.log(`Using cache from ${this.cacheFile}`);
            const cache = await Bun.file(this.cacheFile).json();
            return cache;
        }
        const data = await this.fetchData();
        if (process.env.USE_CACHE) {
            await Bun.file(this.cacheFile).write(JSON.stringify(data));
        }
        return data;
    }
}
