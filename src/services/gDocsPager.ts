interface Pages {
    pageNumber: number,
    pageData: Array<Object>,
    pageToken: string,
    lastPage: boolean
}
export default class GDocsPager {
    pages:Array<Pages> = [];
    pageSize:number = 50;
    totalPages: number = 0;

    addNewItemsToNewPage(items:Array<Object>, pageToken:string = null) {
        this.pages[ this.pages.length ] = {
            pageNumber: this.pages.length,
            pageData: items,
            pageToken: pageToken,
            lastPage: !!pageToken
        };
        this.totalPages++;
    }
}
