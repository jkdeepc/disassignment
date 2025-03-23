import { APIGatewayProxyHandler } from 'aws-lambda'; 
import { DynamoDB } from 'aws-sdk'; 

const dynamo = new DynamoDB.DocumentClient(); 
const TABLE_NAME = process.env.TABLE_NAME!; 

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const Id = event.pathParameters?.Id; 

    if (!Id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing ToyId in path' }),
      };
    }

    const result = await dynamo.scan({
      TableName: TABLE_NAME,
      FilterExpression: 'Id = :bid',
      ExpressionAttributeValues: {
        ':bid': Id,
      },
    }).promise();

    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Toy not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items), 
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch a Toy', detail: (err as Error).message }),
    };
  }
};