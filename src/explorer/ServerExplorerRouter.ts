import { Params, Router } from 'tiny-request-router';

const URI_SCHEME = "grc";

interface SomeInf {
    requestGServerConfig(config: string): void

    requestNpcScript(): void
}

function setupRouter(contract: SomeInf) {

    const router = new Router();

    router.get("/:controller(gserver)/:category(config)/:name*", (params: Params) => handleGetConfig(params));
    router.get("/:controller(gserver)/:category(players)/(.*)", (params: Params) => handlePlayerRequest(params));
    router.get("/:controller(gserver)/:category(filebrowser)/(.*)", (params: Params) => handleBrowserRequest(params));
    router.get("/:controller(npcserver)/:type(npcs|scripts|weapons)/:name*", (params: Params) => handleScriptRequest(params));

    function handleBrowserRequest(params: Params) {
        console.log("[handleBrowserRequest] matched request: ", params);
    }

    function handleGetConfig(params: Params) {
        console.log("[handleGetConfig] matched request: ", params);
    }

    function handlePlayerRequest(params: Params) {
        console.log("[handlePlayerRequest] matched request: ", params);
    }

    function handleScriptRequest(params: Params) {
        console.log("[handleScriptRequest] matched request: ", params);
    }

    return router;
}

export default setupRouter;