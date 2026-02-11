export default function exists<Model extends {
    count: any;
}>(model: Model, args: Parameters<Model["count"]>[0]): Promise<boolean>;
