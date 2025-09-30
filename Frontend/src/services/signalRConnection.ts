import * as signalR from "@microsoft/signalr";

// DEV
const hubUrl = "http://localhost:5271/bookinghub";
// PROD
// const hubUrl = "https://backend20250901141037.azurewebsites.net/bookinghub";


console.log("----🔌 SignalR ansluter till:------", hubUrl);

const connection = new signalR.HubConnectionBuilder()
  .withUrl(hubUrl)
  .withAutomaticReconnect()
  .build();

export default connection;