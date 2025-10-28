import * as signalR from "@microsoft/signalr";

const isDev = import.meta.env.DEV;

const hubUrl = isDev 
  ? "http://localhost:5271/bookinghub" 
  : "https://innoviahub-backend-had9greebjazakbe.swedencentral-01.azurewebsites.net/";


console.log("----🔌 SignalR ansluter till:------", hubUrl);

const connection = new signalR.HubConnectionBuilder()
  .withUrl(hubUrl)
  .withAutomaticReconnect()
  .build();

export default connection;