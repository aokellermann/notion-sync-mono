export type SyncResult<TRecord, TMerge> = {
    pagesToAdd: TMerge[];
    pagesToRemove: TRecord[];
    pagesToUpdate: TMerge[];
}

export const calculateSyncUpdates = async <TRecord, TMerge>(records: TRecord[], recordIdSelector: (record: TRecord) => string, merges: TMerge[], mergeIdSelector: (merge: TMerge) => string): Promise<SyncResult<TRecord, TMerge>> => {
    const recordMap = new Map(records.map(item => [recordIdSelector(item), item]));
    const mergeMap = new Map(merges.map(item => [mergeIdSelector(item), item]));

    const idsToAdd = mergeMap.keys().filter(id => !recordMap.has(id));
    const idsToRemove = recordMap.keys().filter(id => !mergeMap.has(id));
    const idsToUpdate = recordMap.keys().filter(id => mergeMap.has(id));

    const pagesToAdd: TMerge[] = Array.from(idsToAdd).map(id => mergeMap.get(id) as TMerge);
    const pagesToRemove: TRecord[] = Array.from(idsToRemove).map(id => recordMap.get(id) as TRecord);
    const pagesToUpdate: TMerge[] = Array.from(idsToUpdate).map(id => mergeMap.get(id) as TMerge);

    console.log("Calculated sync updates:", {
        idsToAdd: pagesToAdd.length,
        idsToRemove: pagesToRemove.length,
        idsToUpdate: pagesToUpdate.length,
    });

    return {
        pagesToAdd,
        pagesToRemove,
        pagesToUpdate,
    };
}
