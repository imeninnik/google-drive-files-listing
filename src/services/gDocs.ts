import GDocsPager from './gDocsPager';

let fs = require('fs');
let google = require('googleapis');
let googleAuth = require('google-auth-library');


const SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/drive.metadata',
    'https://www.googleapis.com/auth/drive.photos.readonly'
];
const TOKEN_DIR = '_credentials/';
const TOKEN_PATH = TOKEN_DIR + 'google-drive-token.json';



export default class GDocs {
    authorized: boolean;
    token: string;
    oauth2Client: any;
    authUrl: string;

    constructor(
        private REDIRECT_URI: string
    ) {}

    public init(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            fs.readFile('client_secret.json', (err, content) => {
                if (err) {
                    console.log('Error loading client secret file: ' + err);
                    return reject(err);
                }
                // Authorize a client with the loaded credentials, then call the
                // Drive API.
                this.authorize( JSON.parse(content) ).then(()=> resolve(true) ).catch((err)=>reject(err));
            });
        });
    }

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     */
    private authorize(credentials):Promise<boolean> {
        return new Promise( (resolve, reject) => {
            let clientSecret = credentials.web.client_secret;
            let clientId = credentials.web.client_id;
            let redirectUrl = this.REDIRECT_URI;
            let auth = new googleAuth();

            this.oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
            google.options = {auth: this.oauth2Client};

            // Check if we have previously stored a token.
            fs.readFile(TOKEN_PATH, (err, token) => {
                if (err) {
                    this.authorized = false;
                    this.token = token;

                    return resolve(false);
                } else {
                    this.authorized = true;
                    this.oauth2Client.credentials = JSON.parse(token);
                    return resolve(true);
                }
            });
        });

    }

    getAuthUrl():string {
        this.authUrl = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            redirect_uri: this.REDIRECT_URI,
            scope: SCOPES
        });

        return this.authUrl

    }




    get isAuthorised(): boolean {
        return this.authorized;
    }

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     */
    public getNewToken(code:string):Promise<string> {
        return new Promise((resolve, reject) => {
            this.oauth2Client.getToken(code, (err, token) => {
                if (err) {
                    console.log('Error while trying to retrieve access token', err);
                    return reject(err);
                }

                this.oauth2Client.credentials = token;
                this.storeToken(token);

                return resolve(token);
            });
        })

    }


    /**
     * Lists the names and IDs of up to 10 files.
     *
     * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
     */
    public getAllFiles(): Promise<any> {

        return new Promise((resolve, reject) => {
            let gDocsPager = new GDocsPager();
            let that = this;
            var fetch = function fetch(pageSize, pageToken) {
                that.fetchPages(pageSize, pageToken)
                    .then(resp => {
                        gDocsPager.addNewItemsToNewPage(resp.files, resp.nextPageToken);
                        console.log('Fetch new page ', resp.nextPageToken);
                        if (!resp.nextPageToken) {

                            console.log('that\'s it');
                            return resolve(gDocsPager);
                        }
                        fetch(gDocsPager.pageSize, resp.nextPageToken);
                    }).catch((err) => console.log(err));
            };
            fetch(gDocsPager.pageSize, null);


        });


    }

    private fetchPages(pageSize:number, pageToken=null): Promise<any> {
        return new Promise((resolve, reject) => {
            var service = google.drive('v3');
            service.files.list({
                auth: this.oauth2Client,
                pageSize,
                pageToken,
                fields: "nextPageToken, files(id, name, mimeType, size, parents, createdTime, modifiedTime),  kind"
            }, (err, response) => {
                    if (err) {
                        console.log('The API returned an error: ' + err);
                        return reject({error: err});
                    }
                    resolve(response)
                })
        })
    }

    /**
     * Store token to disk be used in later program executions.
     *
     * @param {Object} token The token to store to disk.
     */
    private storeToken(token) {
        try {
            fs.mkdirSync(TOKEN_DIR);
        } catch (err) {
            if (err.code != 'EEXIST') {
                throw err;
            }
        }
        fs.writeFile(TOKEN_PATH, JSON.stringify(token));
        console.log('Token stored to ' + TOKEN_PATH);
    }

}