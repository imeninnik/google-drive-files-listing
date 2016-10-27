import * as express from "express";

import ApiController from "../controllers/gDocs.server.controller";

export default class IndexRoute {
	constructor(app: express.Express) {
		IndexRoute.activate(app);
	}
	
	public static activate (app: express.Express) : void {
		app.route('/list')
			.get(ApiController.getList);

		app.route('/gdocs')
			.get(ApiController.gDocsAuth);
	}
}