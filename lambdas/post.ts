import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { createItem } from '../shared/util'; 
import { CreateInput } from '../shared/type';

const dynamo = new DynamoDB.DocumentClient(); 
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body!);
    const input: CreateInput = body; 

    const item = createItem(input);

    await dynamo.put({
      TableName: TABLE_NAME,
      Item: item,
    }).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Toy added!', Id: item.Id }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not add a Toy', detail: (error as Error).message }),
    };
  }
};