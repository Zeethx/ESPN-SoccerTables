import request from 'request';
import cheerio from 'cheerio';
import fs from 'fs';
import XLXS from 'xlsx';
import path from 'path';
import {news} from './news.js'; 
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const soccerPath = path.join(__dirname, "/Soccer");
dirCreator(soccerPath);


const websiteURL = "https://www.espn.com/soccer/table/_/league/"

let seriesName = ["eng.1", "esp.1", "ita.1", "ger.1"];

for(let series = 0; series < seriesName.length; series++){
    let url = websiteURL + seriesName[series];
    getAllLeagues(url);
    news(url, seriesName[series]);
}
function getAllLeagues(url){
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
    let leagueName = $(".headline.headline__h1.dib").text().split("Table")[0].trim();
    //console.log(leagueName.text()); --> League name

    let ScoreTable = $(".Table__TBODY");
    let teamNameList = [];

    for(let table=0; table<ScoreTable.length; table++){
        if(table==0){
            let allTeams = $(ScoreTable[table]).find("tr");
            for(let i=0;i<allTeams.length;i++){
                teamNameList.push($(allTeams[i]).find("td>div>span.hide-mobile").eq(0).text());
            }
        }
        else{
            let allTeamsScores = $(ScoreTable[table]).find("tr");
            for(let i=0;i<allTeamsScores.length;i++){
                let allCols = $(allTeamsScores[i]).find("td");
                let gamesPlayed = $(allCols[0]).text();
                let Wins = $(allCols[1]).text();
                let Draws = $(allCols[2]).text();
                let Losses = $(allCols[3]).text();
                let GoalsFor = $(allCols[4]).text();
                let GoalsAgainst = $(allCols[5]).text();
                let GoalDifference = $(allCols[6]).text();
                let Points = $(allCols[7]).text();
                processTeam(leagueName,teamNameList[i], gamesPlayed, Wins, Draws, Losses, GoalsFor, GoalsAgainst, GoalDifference, Points);
            }
        }
    }
}
function processTeam(seriesName,teamName, gamesPlayed, Wins, Draws, Losses, GoalsFor, GoalsAgainst, GoalDifference, Points){
    let leaguePath = path.join(soccerPath, seriesName);
    dirCreator(leaguePath);
    let filePath = path.join(leaguePath, seriesName + ".xlsx");
    let data = excelReader(filePath, seriesName);
    let leagueObj = {
        "Team Name": teamName,
        "Games Played": gamesPlayed,
        "Wins": Wins,
        "Draws": Draws,
        "Losses": Losses,
        "Goals For": GoalsFor,
        "Goals Against": GoalsAgainst,
        "Goal Difference": GoalDifference,
        "Points": Points
    };
    data.push(leagueObj);
    excelWriter(filePath, data, seriesName);
}

function dirCreator(filePath){
    if(!fs.existsSync(filePath)){
        fs.mkdirSync(filePath);
    }
}

function excelReader(filePath,sheetName){
    if(!fs.existsSync(filePath)){
        return [];
   }
    let wb = XLXS.readFile(filePath);
    let ws = wb.Sheets[sheetName];
    let data = XLXS.utils.sheet_to_json(ws);
    return data;
}
function excelWriter(filePath, data, sheetName){
    let wb = XLXS.utils.book_new();
    let ws = XLXS.utils.json_to_sheet(data);
    XLXS.utils.book_append_sheet(wb, ws, sheetName);
    XLXS.writeFile(wb, filePath);
}
