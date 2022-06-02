import request from 'request';
import cheerio from 'cheerio';
import path from 'path';
import fs from 'fs';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function displayNews(url, leagueName){
    request(url, (error, response, body) => {
        if(error) {
            console.log('Something went wrong!');
            console.error(error);
        } else {
            if(response.statusCode == 200) {
                extracthtml(body);
            }
        }
    });
}

function extracthtml(body){
    let $ = cheerio.load(body);
    
    let leagueName = $(".Card__Header__Title.Card__Header__Title--no-theme");
    let headlines = $('div>.News__Item__Headline');
    let newsBody = $('div>.News__Item__Description');

    for(let i=0;i<headlines.length;i++){
        let news = $(headlines[i]).text() + "\n" + $(newsBody[i]).text() + "\n\n";
        if(!fs.existsSync(path.join(__dirname, "/News"))){
            fs.mkdirSync(path.join(__dirname, "/News"));
        }
        let fileDir = path.join(__dirname, "/News/" + leagueName.text() + ".txt");
        fs.appendFile(fileDir, news, (err) => {
            if(err) {
                console.log(err);
            }
        });

    }
}

export const news = displayNews;