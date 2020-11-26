export declare type ParallelSetsDataRecord = { [dimensionName: string]: string | number };

export class ParallelSetsDataNode {
    valueHistory: (string | number)[] = [];
    dataRecordList: ParallelSetsDataRecord[] = [];
    segmentPosition: [number, number] = [0, 0];
    mergedSegmentAdjustmentRatio: number = 0;
    adjustmentRatio: number = 1;

    private _adjustedSegmentPosition?: [number, number];
    get adjustedSegmentPosition() {
        return this._adjustedSegmentPosition || this.segmentPosition;
    }
    set adjustedSegmentPosition(value) {
        this._adjustedSegmentPosition = value;
    }
}

export function compareStrings(a: string, b: string) {
    if (a < b) {
        return -1;
    } else if (a > b) {
        return 1
    } else {
        return 0;
    }
}
