import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB, Translate } from 'aws-sdk';

const dynamo = new DynamoDB.DocumentClient();
const translator = new Translate();
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const Id = event.pathParameters?.Id;
    const name = event.pathParameters?.name;
    const language = event.queryStringParameters?.language;

    if (!Id || !name || !language) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing toyId, title, or language in request' }),
      };
    }

    const { Item } = await dynamo.get({
      TableName: TABLE_NAME,
      Key: {  Id, name },
    }).promise();

    if (!Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Toy not found' }),
      };
    }

    const originalDescription = Item.description;
    const cachedTranslation = Item.translations?.[language];

    if (cachedTranslation) {
      return {
        statusCode: 200,
        body: JSON.stringify({ translated: cachedTranslation, cached: true }),
      };
    }

    const translated = await translator.translateText({
      SourceLanguageCode: 'en',
      TargetLanguageCode: language,
      Text: originalDescription,
    }).promise();

    const translatedText = translated.TranslatedText;

    await dynamo.update({
      TableName: TABLE_NAME,
      Key: {  Id, name },
      UpdateExpression: 'set #translations.#lang = :text',
      ExpressionAttributeNames: {
        '#translations': 'translations',
        '#lang': language,
      },
      ExpressionAttributeValues: {
        ':text': translatedText,
      },
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ translated: translatedText, cached: false }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Translation failed', detail: (err as Error).message }),
    };
  }
};