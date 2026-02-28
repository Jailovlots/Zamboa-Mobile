import { app, setupApp } from "../server/index";

let initialized = false;

export default async function handler(req: any, res: any) {
    if (!initialized) {
        await setupApp();
        initialized = true;
    }
    return app(req, res);
}
