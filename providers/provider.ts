declare module "bun" {
    interface Env {
        USE_CACHE?: boolean;
    }
}

export abstract class Provider<TData> {
    protected cacheFile: string;

    constructor(cacheFile: string) {
        this.cacheFile = cacheFile;
    }

    protected abstract fetchData(): Promise<TData>;

    async getData(): Promise<TData> {
        if (Bun.env.USE_CACHE && await Bun.file(this.cacheFile).exists()) {
            console.log(`Using cache from ${this.cacheFile}`);
            // console.log('File contains', await Bun.file(this.cacheFile).text());
            const cache = await Bun.file(this.cacheFile).json();
            return cache;
        }
        const data = await this.fetchData();
        console.log(`Writing cache to ${this.cacheFile}`);
        await Bun.write(this.cacheFile, JSON.stringify(data, null, 2));
        return data;
    }
}
