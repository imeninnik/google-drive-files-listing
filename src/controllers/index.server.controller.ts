import * as express from "express";

export default class IndexController {
    public static getIndex(req: express.Request, res: express.Response, next: Function): void {
        res.render("index", { title: "Google Drive Files Listing" });
    }
}