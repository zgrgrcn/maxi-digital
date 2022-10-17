// Import required AWS SDK clients and commands for Node.js
import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "./libs/ddbDocClient.js";
import axios from "axios";

const coinsTable = "coins";

export const handler = async (event) => {
  console.log("event", event);
  let response = {};
  try {
    return {
      statusCode: 200,
      body: JSON.stringify(await listCoins()),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify(err),
    };
  }
};

export const run = async () => {
  let response = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  try {
    response.statusCode = 200;
    // response.body = await listCoins();
    response.body = JSON.stringify(await listCoins());
    console.log("body succesful");
  } catch (err) {
    response.statusCode = 500;
    response.body = err.message;
  } finally {
    console.log("finally");
    console.log(response);
  }
};

//send request to https://api.coingecko.com/api/v3/coins/list
//get response and store in dynamodb
//return all stored coins
const listCoins = async () => {
  const coins = (await axios.get("https://api.coingecko.com/api/v3/coins/list"))
    .data;
  console.log("coingecko successful");

  const currentDate = new Date().toISOString();

  console.log("save start");
  let params = {
    TableName: coinsTable,
    Item: {
      date: currentDate,
      coins: coins.slice(0, 1000),//Item size has exceeded the maximum allowed size
    },
  };
  await ddbDocClient.send(new PutCommand(params));
  
  //Item size to update has exceeded the maximum allowed size
  // await ddbDocClient.send(
  //   new UpdateCommand({
  //     TableName: coinsTable,
  //     Key: {
  //       date: currentDate,
  //     },
  //     UpdateExpression:
  //       "set coins = list_append(if_not_exists(coins, :empty_list), :coins)",
  //     ExpressionAttributeValues: {
  //       ":coins": coins.slice(6500),
  //       ":empty_list": [],
  //     },
  //   })
  // );

  return (
    await ddbDocClient.send(
      new GetCommand({ TableName: coinsTable, Key: { date: currentDate } })
    )
  ).Item;
};

run();
