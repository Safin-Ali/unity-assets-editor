export interface TSPromptValues {
    trafficSpawnMono: string | null;
    trafficMonoText: string | null;
    spawnType: boolean | null;
}

export interface ManipulateSpeedTypeParams {
    buffer: string[],
    firstFileOffset: number,
    index:number
}