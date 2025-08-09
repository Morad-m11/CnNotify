type TargetInstructions = {
    name: Target;
    url: string;
    instructions: () => Promise<CheckResult>;
};
declare const enum Target {
    Heimbau = "Heimbau"
}
export type CheckResult = {
    name: Target;
    url: string;
    changes: boolean;
};
export declare const TARGETS: TargetInstructions[];
export {};
//# sourceMappingURL=targets.d.ts.map