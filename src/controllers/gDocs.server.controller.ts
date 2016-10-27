import * as express from "express";

import GDocs from '../../src/services/gDocs';
import GDocsPager  from '../../src/services/gDocsPager';

let gDocs = new GDocs('http://localhost:9000/gdocs');
let pagesCache:GDocsPager;

export default class ApiController {

    public static getList(req: express.Request, res: express.Response, next: Function): void {

        let currentPage:number = req.query.page || 0;

        gDocs.init().then(() => {
            console.log('gDocs.isAuthorised', gDocs.isAuthorised, gDocs.getAuthUrl() );

            gDocs.isAuthorised
                ? getFiles(currentPage)
                : res.redirect( gDocs.authUrl )
        });

        function getFiles(currentPage:number):void {
            if (pagesCache){
                renderPage(pagesCache, currentPage);
                return;
            }

            gDocs.getAllFiles()
                .then(resp => {
                    pagesCache = resp;
                    renderPage(pagesCache, currentPage);

                })
                .catch(err => {
                    console.log(err);
                    res.render("error", {
                        message: err.error,
                        error: {status: null, stack: null}
                    });
                });

            function renderPage(allData:GDocsPager, currentPage:number):void {
                res.render("result", {
                    title: 'Result',
                    files: allData.pages[currentPage].pageData,
                    pages: allData.totalPages
                });
            }

        }

    }

    public static gDocsAuth(req: express.Request, res: express.Response, next: Function): void {
        if (req.query.code) {
            gDocs.getNewToken(req.query.code)
                .then(() => res.redirect('/list') )
                .catch(err => res.render("index", { title: err }) )
        }

    }

}
